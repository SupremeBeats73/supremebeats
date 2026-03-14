import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * Verify Stripe checkout session and apply the upgrade.
 * Only the server trusts Stripe; the client never sends userId or planType.
 * RLS stays strict: we use Service Role only on the server.
 */
async function verifySessionAndUpgrade(sessionId: string) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe not configured");
  const stripe = new Stripe(secretKey);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase not configured");
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "line_items"],
  });

  const userId = session.client_reference_id ?? session.metadata?.userId;
  if (!userId) throw new Error("No user reference in session");

  const paid = session.payment_status === "paid" || session.status === "complete";
  if (!paid) return { success: false, creditsAdded: 0, plan: null as string | null };

  const metadata = session.metadata ?? {};
  const creditsToAdd = metadata.credits ? parseInt(metadata.credits, 10) : 0;
  const plan = (metadata.plan as string | undefined) ?? null;

  if (creditsToAdd > 0) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();
    const current = typeof profile?.credits === "number" ? profile.credits : 0;
    const { error: creditsError } = await supabaseAdmin
      .from("profiles")
      .update({
        credits: current + creditsToAdd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (creditsError) throw creditsError;
  }

  const micTier =
    plan === "elite" ? "gold" : plan === "professional" ? "silver" : null;
  if (micTier) {
    const { error: tierError } = await supabaseAdmin
      .from("profiles")
      .update({
        mic_tier: micTier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (tierError) throw tierError;
  }

  // Scalable: add post-upgrade hooks here (e.g. welcome email, unlock AI models).
  // if (plan === 'elite') { await sendWelcomeGoldEmail(userId); await unlockGoldModels(userId); }

  return { success: true, creditsAdded: creditsToAdd, plan };
}

/**
 * POST: Requires session_id from Stripe redirect. No userId/planType from client.
 * Secure: server verifies payment with Stripe before any profile change.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = (body as { session_id?: string }).session_id;
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "session_id is required (from Stripe checkout redirect)" },
        { status: 400 }
      );
    }

    const result = await verifySessionAndUpgrade(sessionId);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[checkout/success] POST", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upgrade failed" },
      { status: 500 }
    );
  }
}

/**
 * GET: Same verification, session_id from query (e.g. /api/checkout/success?session_id=...).
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const result = await verifySessionAndUpgrade(sessionId);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[checkout/success] GET", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

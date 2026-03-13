import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const stripe = new Stripe(secretKey);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "line_items"],
    });

    const userId = session.client_reference_id ?? session.metadata?.userId;
    if (!userId) {
      return NextResponse.json({ error: "No user reference" }, { status: 400 });
    }

    const paid = session.payment_status === "paid" || session.status === "complete";
    if (!paid) {
      return NextResponse.json({ success: false, message: "Payment not completed" });
    }

    const metadata = session.metadata ?? {};
    const creditsToAdd = metadata.credits ? parseInt(metadata.credits, 10) : 0;
    const plan = metadata.plan;

    if (creditsToAdd > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .maybeSingle();

      const current = typeof profile?.credits === "number" ? profile.credits : 0;
      const { error } = await supabase
        .from("profiles")
        .update({ credits: current + creditsToAdd, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        console.error("[checkout/success] Supabase update credits", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    if (plan === "professional" || plan === "elite") {
      const micTier = plan === "elite" ? "gold" : "silver";
      await supabase
        .from("profiles")
        .update({ mic_tier: micTier, updated_at: new Date().toISOString() })
        .eq("id", userId);
    }

    return NextResponse.json({ success: true, creditsAdded: creditsToAdd, plan });
  } catch (e) {
    console.error("[checkout/success]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

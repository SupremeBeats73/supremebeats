import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2023-10-16" as Stripe.LatestApiVersion });
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase URL or SERVICE_ROLE_KEY is not set");
  return createClient(url, key);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new NextResponse("STRIPE_WEBHOOK_SECRET is not set", { status: 500 });
  }

  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new NextResponse(null, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id ?? session.metadata?.userId;

  if (!userId) {
    return new NextResponse("No user reference in session", { status: 400 });
  }

  // Retrieve session with line_items to get price ID (not always in webhook payload)
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price"],
  });
  const priceId =
    (fullSession.line_items?.data?.[0]?.price as Stripe.Price | undefined)?.id ??
    fullSession.metadata?.priceId;

  if (!priceId) {
    return new NextResponse("Could not determine price", { status: 400 });
  }

  const elitePriceId = process.env.NEXT_PUBLIC_PRICE_ELITE_GOLD;
  const proPriceId = process.env.NEXT_PUBLIC_PRICE_PROFESSIONAL;
  const price1000 = process.env.NEXT_PUBLIC_PRICE_1000_COINS;
  const price500 = process.env.NEXT_PUBLIC_PRICE_500_COINS;
  const price100 = process.env.NEXT_PUBLIC_PRICE_100_COINS;

  // 1. Elite (Gold Mic) - $49/mo
  if (priceId === elitePriceId) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        mic_tier: "gold",
        credits: 999999,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) {
      console.error("[webhook] Elite update failed", error);
      return new NextResponse("Profile update failed", { status: 500 });
    }
  }
  // 2. Professional - $19/mo
  else if (priceId === proPriceId) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        mic_tier: "silver",
        credits: 500,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) {
      console.error("[webhook] Pro update failed", error);
      return new NextResponse("Profile update failed", { status: 500 });
    }
  }
  // 3–5. Coin packs: increment credits (read-then-update, no RPC required)
  else if (priceId === price1000 || priceId === price500 || priceId === price100) {
    const amount =
      priceId === price1000 ? 1000 : priceId === price500 ? 500 : 100;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();

    const current = typeof profile?.credits === "number" ? profile.credits : 0;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        credits: current + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("[webhook] Credits increment failed", error);
      return new NextResponse("Credits update failed", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}

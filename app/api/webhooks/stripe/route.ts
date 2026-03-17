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

const elitePriceId = () => process.env.NEXT_PUBLIC_PRICE_ELITE_GOLD;
const proPriceId = () => process.env.NEXT_PUBLIC_PRICE_PROFESSIONAL;
const price1000 = () => process.env.NEXT_PUBLIC_PRICE_1000_COINS;
const price500 = () => process.env.NEXT_PUBLIC_PRICE_500_COINS;
const price100 = () => process.env.NEXT_PUBLIC_PRICE_100_COINS;

/** Apply Pro/Elite or coin-pack credit update to profile. Returns true if applied. */
async function applyPriceToProfile(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  priceId: string
): Promise<{ ok: boolean; error?: string }> {
  const elite = elitePriceId();
  const pro = proPriceId();
  const p1000 = price1000();
  const p500 = price500();
  const p100 = price100();

  if (priceId === elite) {
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
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }
  if (priceId === pro) {
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
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }
  if (priceId === p1000 || priceId === p500 || priceId === p100) {
    const amount = priceId === p1000 ? 1000 : priceId === p500 ? 500 : 100;
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
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }
  return { ok: false };
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

  // ——— checkout.session.completed (first purchase: one-time or subscription)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.userId;
    if (!userId) {
      return new NextResponse("No user reference in session", { status: 400 });
    }
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price"],
    });
    const priceId =
      (fullSession.line_items?.data?.[0]?.price as Stripe.Price | undefined)?.id ??
      fullSession.metadata?.priceId;
    if (!priceId) {
      return new NextResponse("Could not determine price", { status: 400 });
    }
    const result = await applyPriceToProfile(supabaseAdmin, userId, priceId);
    if (!result.ok) {
      return new NextResponse(result.error ?? "Profile update failed", { status: 500 });
    }
    // Persist Stripe customer id for billing portal (cancel, change plan, invoices)
    const customerId =
      typeof fullSession.customer === "string"
        ? fullSession.customer
        : (fullSession.customer as Stripe.Customer | null)?.id;
    if (customerId) {
      await supabaseAdmin
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }
    return new NextResponse(null, { status: 200 });
  }

  // ——— invoice.paid (subscription renewals: refill Pro/Elite credits each billing cycle)
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    if (!invoice.subscription) {
      return new NextResponse(null, { status: 200 });
    }
    const subscription = await stripe.subscriptions.retrieve(
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id
    );
    const userId = subscription.metadata?.userId;
    if (!userId) {
      return new NextResponse(null, { status: 200 });
    }
    const line = invoice.lines?.data?.[0];
    const priceId = (line?.price as Stripe.Price | undefined)?.id ?? line?.price;
    if (!priceId || typeof priceId !== "string") {
      return new NextResponse(null, { status: 200 });
    }
    const result = await applyPriceToProfile(supabaseAdmin, userId, priceId);
    if (!result.ok) {
      console.error("[webhook] invoice.paid apply failed", result.error);
    }
    return new NextResponse(null, { status: 200 });
  }

  return new NextResponse(null, { status: 200 });
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, userId, metadata = {}, returnBaseUrl } = body as {
      priceId?: string;
      userId?: string;
      metadata?: Record<string, string>;
      returnBaseUrl?: string;
    };

    // Use the origin the user started from so they return to the same site and stay logged in
    const origin =
      typeof returnBaseUrl === "string" && /^https?:\/\//.test(returnBaseUrl)
        ? returnBaseUrl.replace(/\/$/, "")
        : request.headers.get("origin") ?? siteUrl;

    if (!origin) {
      return NextResponse.json(
        { error: "Server misconfigured: NEXT_PUBLIC_SITE_URL is not set" },
        { status: 500 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing priceId" },
        { status: 400 }
      );
    }

    // Reject placeholder IDs (Stripe real IDs look like price_1ABC... with 24+ chars)
    const isPlaceholder =
      typeof priceId === "string" &&
      (priceId.length < 20 || /^price_(pro_month|elite_month|topup_\d+)$/.test(priceId));
    if (isPlaceholder) {
      return NextResponse.json(
        {
          error:
            "Price not configured. Add your Stripe price IDs to .env.local (e.g. NEXT_PUBLIC_PRICE_PROFESSIONAL, NEXT_PUBLIC_PRICE_ELITE_GOLD). Create prices in Stripe Dashboard → Products.",
        },
        { status: 400 }
      );
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe is not configured (STRIPE_SECRET_KEY)" },
        { status: 500 }
      );
    }

    const coinPriceIds = [
      process.env.NEXT_PUBLIC_PRICE_100_COINS,
      process.env.NEXT_PUBLIC_PRICE_500_COINS,
      process.env.NEXT_PUBLIC_PRICE_1000_COINS,
    ].filter(Boolean) as string[];
    const isOneTime = coinPriceIds.includes(priceId);
    const mode: "payment" | "subscription" = isOneTime ? "payment" : "subscription";

    const stripe = new Stripe(secretKey);
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/shop`,
      ...(userId && { client_reference_id: userId }),
      metadata: userId ? { userId, ...metadata } : metadata,
    };
    if (mode === "subscription" && userId) {
      sessionParams.subscription_data = { metadata: { userId } };
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url ?? null });
  } catch (e) {
    console.error("[checkout]", e);
    const message = e instanceof Error ? e.message : "Checkout failed";
    const isNoSuchPrice =
      typeof message === "string" &&
      (message.toLowerCase().includes("no such price") ||
        message.toLowerCase().includes("resource_missing"));
    return NextResponse.json(
      {
        error: isNoSuchPrice
          ? "That price ID isn’t in your Stripe account. Check .env.local: use price IDs from Stripe Dashboard → Products (e.g. price_1ABC...)."
          : message,
      },
      { status: 500 }
    );
  }
}

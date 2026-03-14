import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.supremebeatsstudio.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, userId, metadata = {} } = body as {
      priceId?: string;
      userId?: string;
      metadata?: Record<string, string>;
    };

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing priceId" },
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

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/dashboard/shop`,
      ...(userId && { client_reference_id: userId }),
      metadata: userId ? { userId, ...metadata } : metadata,
    });

    return NextResponse.json({ url: session.url ?? null });
  } catch (e) {
    console.error("[checkout]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}

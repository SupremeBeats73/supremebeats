"use server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

const defaultBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  returnBaseUrl?: string
) {
  const baseUrl =
    typeof returnBaseUrl === "string" && /^https?:\/\//.test(returnBaseUrl)
      ? returnBaseUrl.replace(/\/$/, "")
      : defaultBaseUrl;
  if (!baseUrl) {
    throw new Error("Server misconfigured: NEXT_PUBLIC_SITE_URL is not set");
  }

  try {
    const isSubscription =
      priceId === process.env.NEXT_PUBLIC_PRICE_PROFESSIONAL ||
      priceId === process.env.NEXT_PUBLIC_PRICE_ELITE_GOLD;

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { userId },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return { url: session.url };
  } catch (error: unknown) {
    console.error("Stripe Error:", error);
    throw new Error(error instanceof Error ? error.message : "Checkout failed");
  }
}

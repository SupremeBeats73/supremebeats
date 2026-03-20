import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Billing is not configured" },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const customerId = profile?.stripe_customer_id as string | undefined;
  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "No billing account yet. Subscribe or make a purchase in the Shop to manage your subscription and invoices here.",
      },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secretKey);
  const baseUrl = siteUrl ?? request.headers.get("origin");
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Server misconfigured: NEXT_PUBLIC_SITE_URL is not set" },
      { status: 500 }
    );
  }
  const returnUrl = `${baseUrl.replace(/\/$/, "")}/dashboard/billing`;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url ?? null });
}

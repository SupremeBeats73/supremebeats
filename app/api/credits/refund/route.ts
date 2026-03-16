import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/credits/refund
 * Body: { amount: number }
 * Adds credits back to the current user's profile (e.g. when a job fails or is cancelled).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const amount = typeof body?.amount === "number" ? Math.floor(body.amount) : undefined;
  if (amount === undefined || amount < 1) {
    return NextResponse.json(
      { success: false, error: "amount must be a positive integer" },
      { status: 400 }
    );
  }

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[credits/refund] fetch profile", fetchError);
    return NextResponse.json(
      { success: false, error: "Could not load profile" },
      { status: 500 }
    );
  }

  const current = typeof profile?.credits === "number" ? profile.credits : 0;
  const newBalance = current + amount;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      credits: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[credits/refund] update profile", updateError);
    return NextResponse.json(
      { success: false, error: "Could not refund credits" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, newBalance });
}

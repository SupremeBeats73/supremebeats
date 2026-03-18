import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isEliteUser } from "@/app/lib/admin";

/**
 * POST /api/credits/deduct
 * Body: { amount: number }
 * Deducts credits from the current user's profile. Elite (Gold Mic) users are not deducted.
 * Returns { success: true, newBalance } or { success: false, error }.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { amount?: number; reason?: string; jobId?: string };
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
    .select("credits, mic_tier, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[credits/deduct] fetch profile", fetchError);
    return NextResponse.json(
      { success: false, error: "Could not load profile" },
      { status: 500 }
    );
  }

  const credits = typeof profile?.credits === "number" ? profile.credits : 0;
  const micTier = (profile?.mic_tier as string) ?? "";
  const isAdmin = (profile?.is_admin as boolean) ?? false;

  // Unlimited users: do not deduct
  if (isEliteUser(user.email ?? null, micTier, isAdmin)) {
    return NextResponse.json({
      success: true,
      newBalance: credits,
      unlimited: true,
    });
  }

  if (credits < amount) {
    return NextResponse.json(
      { success: false, error: "Insufficient credits" },
      { status: 400 }
    );
  }

  const newBalance = credits - amount;

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      credits: newBalance,
      updated_at: now,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[credits/deduct] update profile", updateError);
    return NextResponse.json(
      { success: false, error: "Could not deduct credits" },
      { status: 500 }
    );
  }

  const reason = typeof body?.reason === "string" && body.reason.trim().length
    ? body.reason.trim()
    : "job_deduct";

  const jobId = typeof body?.jobId === "string" && body.jobId.trim().length
    ? body.jobId.trim()
    : null;

  const { error: ledgerError } = await supabase.from("credit_ledger").insert({
    user_id: user.id,
    delta: -amount,
    reason,
    job_id: jobId,
    metadata_json: null,
    created_at: now,
  });

  if (ledgerError) {
    console.error("[credits/deduct] ledger insert", ledgerError);
    // Do not roll back profile update; just log the failure.
  }

  return NextResponse.json({ success: true, newBalance });
}

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * GET /api/admin/jobs-credits
 * Returns generation_jobs and credit_ledger for admin audit. Requires admin email.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server configuration missing" },
      { status: 500 }
    );
  }

  const admin = createServiceClient(url, serviceKey);

  const limit = 200;

  const [jobsRes, ledgerRes] = await Promise.all([
    admin
      .from("generation_jobs")
      .select("id, user_id, project_id, job_type, provider, provider_job_id, status, error_message, input_json, output_json, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("credit_ledger")
      .select("id, user_id, delta, reason, job_id, stripe_session_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (jobsRes.error) {
    console.error("[admin/jobs-credits] generation_jobs", jobsRes.error);
    return NextResponse.json(
      { error: jobsRes.error.message || "Failed to load jobs" },
      { status: 500 }
    );
  }
  if (ledgerRes.error) {
    console.error("[admin/jobs-credits] credit_ledger", ledgerRes.error);
    return NextResponse.json(
      { error: ledgerRes.error.message || "Failed to load ledger" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    jobs: jobsRes.data ?? [],
    ledger: ledgerRes.data ?? [],
  });
}

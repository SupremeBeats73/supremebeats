import { createClient } from "@/utils/supabase/server";

const ELITE_DISPLAY_CREDITS = 999999;

export type DashboardProfile = {
  displayName: string | null;
  credits: number;
  micTier: string | null;
};

export type RecentGeneration = {
  id: string;
  job_type: string;
  status: string;
  project_id: string;
  created_at: string;
  error_message: string | null;
};

export type DashboardData = {
  profile: DashboardProfile | null;
  projectsCount: number;
  recentGenerations: RecentGeneration[];
};

/**
 * Server-only: fetch dashboard stats for the logged-in user.
 * Returns null if not authenticated.
 */
export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const [profileRes, projectsRes, jobsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, credits, mic_tier")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("generation_jobs")
      .select("id, job_type, status, project_id, created_at, error_message")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const profileRow = profileRes.data;
  const credits =
    typeof profileRow?.credits === "number" ? profileRow.credits : 0;
  const micTier = (profileRow?.mic_tier as string) ?? null;
  const tierLower = micTier != null ? String(micTier).trim().toLowerCase() : "";
  const isElite = tierLower === "gold" || tierLower === "elite";

  const profile: DashboardProfile = {
    displayName:
      (profileRow?.display_name as string)?.trim() || null,
    credits: isElite ? ELITE_DISPLAY_CREDITS : credits,
    micTier,
  };

  const projectsCount = projectsRes.count ?? 0;
  const recentGenerations: RecentGeneration[] = (jobsRes.data ?? []).map(
    (row) => ({
      id: row.id,
      job_type: row.job_type,
      status: row.status,
      project_id: row.project_id,
      created_at: row.created_at,
      error_message: row.error_message,
    })
  );

  return {
    profile,
    projectsCount,
    recentGenerations,
  };
}

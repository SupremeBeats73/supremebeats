/**
 * Fetch public discovery tracks from Supabase (project_assets + profiles).
 * JOIN: We fetch profiles (display_name, mic_tier) for every post author in one batch,
 * so each track includes mic_tier and the UI can render UserBadge without per-user API calls.
 * Assets are treated as "public" when status is success and url is set.
 */
import { supabase } from "./supabaseClient";
import type { MicTierId } from "./types";

const TRACK_KINDS = ["beat", "full_song"];

function normalizeMicTier(v: string | null | undefined, isAdmin?: boolean | null): MicTierId {
  if (isAdmin) return "gold";
  if (!v) return "bronze";
  const s = String(v).toLowerCase();
  if (s === "gold" || s === "elite" || s.includes("gold")) return "gold";
  if (s === "silver" || s.includes("silver")) return "silver";
  return "bronze";
}

export interface DiscoveryTrack {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  creatorSlug: string;
  /** From profiles join — use this for UserBadge so no extra fetch per author. */
  micTier: MicTierId;
  artworkUrl: string | null;
  audioUrl: string | null;
  plays: number;
  likes: number;
  commentsCount: number;
}

export async function fetchPublicDiscoveryTracks(): Promise<DiscoveryTrack[]> {
  const { data: assets, error: assetsError } = await supabase
    .from("project_assets")
    .select("id, project_id, user_id, kind, label, url, created_at")
    .eq("status", "success")
    .not("url", "is", null)
    .in("kind", TRACK_KINDS)
    .order("created_at", { ascending: false });

  if (assetsError) throw assetsError;
  if (!assets?.length) return [];

  const userIds = [...new Set(assets.map((a) => a.user_id).filter(Boolean))] as string[];
  const projectIds = [...new Set(assets.map((a) => a.project_id).filter(Boolean))] as string[];

  /* JOIN with profiles: one query for all post authors' display_name + mic_tier */
  const [profilesRes, projectsRes] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, display_name, mic_tier, is_admin").in("id", userIds)
      : { data: [] as { id: string; display_name: string | null; mic_tier: string | null; is_admin?: boolean | null }[] },
    projectIds.length
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : { data: [] as { id: string; name: string }[] },
  ]);

  const profilesByKey = (profilesRes.data ?? []).reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<string, { display_name: string | null; mic_tier: string | null; is_admin?: boolean | null }>
  );
  const projectsByKey = (projectsRes.data ?? []).reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<string, { name: string }>
  );

  const slug = (id: string, name: string) =>
    (name || id).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "creator";

  return assets.map((a) => {
    const profile = profilesByKey[a.user_id] ?? null;
    const project = projectsByKey[a.project_id] ?? null;
    const creatorName = profile?.display_name ?? "Creator";
    const creatorSlug = slug(a.user_id, creatorName);
    return {
      id: a.id,
      title: project?.name ?? a.label ?? "Untitled",
      creatorId: a.user_id,
      creatorName,
      creatorSlug,
      micTier: normalizeMicTier(profile?.mic_tier, (profile as any)?.is_admin as boolean | null),
      artworkUrl: null,
      audioUrl: a.url,
      plays: 0,
      likes: 0,
      commentsCount: 0,
    };
  });
}

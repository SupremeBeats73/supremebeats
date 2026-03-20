/**
 * Comments on assets (Discovery feed). Table: public.comments (user_id, asset_id, body, created_at).
 */
import { supabase } from "./supabaseClient";
import type { MicTierId } from "./types";

function normalizeMicTier(v: string | null | undefined, isAdmin?: boolean | null): MicTierId {
  if (isAdmin) return "gold";
  if (!v) return "bronze";
  const s = String(v).toLowerCase();
  if (s === "gold" || s === "elite" || s.includes("gold")) return "gold";
  if (s === "silver" || s.includes("silver")) return "silver";
  return "bronze";
}

export interface CommentRow {
  id: string;
  user_id: string;
  asset_id: string;
  body: string;
  created_at: string;
}

export interface CommentWithAuthor {
  id: string;
  userId: string;
  assetId: string;
  body: string;
  createdAt: string;
  displayName: string;
  micTier: MicTierId;
}

export async function fetchCommentsByAssetId(assetId: string): Promise<CommentWithAuthor[]> {
  const { data: rows, error } = await supabase
    .from("comments")
    .select("id, user_id, asset_id, body, created_at")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!rows?.length) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, mic_tier, is_admin")
    .in("id", userIds);

  const byId = (profiles ?? []).reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<string, { display_name: string | null; mic_tier: string | null; is_admin?: boolean | null }>
  );

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    assetId: r.asset_id,
    body: r.body,
    createdAt: r.created_at,
    displayName: byId[r.user_id]?.display_name ?? "Anonymous",
    micTier: normalizeMicTier(byId[r.user_id]?.mic_tier, byId[r.user_id]?.is_admin ?? null),
  }));
}

export async function insertComment(
  userId: string,
  assetId: string,
  body: string
): Promise<CommentRow> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ user_id: userId, asset_id: assetId, body: body.trim() })
    .select("id, user_id, asset_id, body, created_at")
    .single();
  if (error) throw error;
  return data as CommentRow;
}

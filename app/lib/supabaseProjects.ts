/**
 * Supabase persistence for Studio projects, assets, and YouTube packages.
 * All operations require the authenticated user; RLS enforces user_id = auth.uid().
 */
import { supabase } from "./supabaseClient";
import type {
  Project,
  ProjectAsset,
  ProjectAssetKind,
  AssetStatus,
  YouTubePackageData,
} from "./types";

// —— Projects ——

export async function fetchProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToProject);
}

export async function createProjectInSupabase(
  userId: string,
  data: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<Project> {
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    name: data.name,
    genre: data.genre,
    bpm: data.bpm,
    key: data.key,
    mood: data.mood,
    duration: data.duration,
    instruments: data.instruments,
    reference_uploads: data.referenceUploads,
    prompt: data.prompt ?? "",
    created_at: now,
    updated_at: now,
  };
  if (process.env.NODE_ENV === "development") {
    console.log("[supabaseProjects] createProjectInSupabase inserting", {
      user_id: userId,
      name: row.name,
      table: "projects",
    });
  }
  const { data: inserted, error } = await supabase
    .from("projects")
    .insert(row)
    .select("id, user_id, name, genre, bpm, key, mood, duration, instruments, reference_uploads, prompt, created_at, updated_at")
    .single();
  if (error) {
    console.error("[supabaseProjects] createProjectInSupabase Supabase error", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    const errMessage =
      (error.message || "Supabase error") +
      (error.code ? ` (code: ${error.code})` : "") +
      (error.details ? ` — ${JSON.stringify(error.details)}` : "");
    throw new Error(errMessage);
  }
  if (inserted == null) {
    const fallback = "Supabase returned no row after insert.";
    console.error("[supabaseProjects] createProjectInSupabase", fallback);
    throw new Error(fallback);
  }
  return rowToProject(inserted);
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    genre: (row.genre as string) ?? "",
    bpm: (row.bpm as number) ?? 120,
    key: (row.key as string) ?? "",
    mood: (row.mood as string) ?? "",
    duration: (row.duration as number) ?? 180,
    instruments: ((row.instruments as string[]) ?? []) as string[],
    referenceUploads: ((row.reference_uploads as string[]) ?? []) as string[],
    prompt: (row.prompt as string) ?? undefined,
    createdAt: (row.created_at as string) ?? "",
    updatedAt: (row.updated_at as string) ?? "",
  };
}

// —— Project assets ——

export async function fetchAssetsForProjects(
  userId: string,
  projectIds: string[]
): Promise<ProjectAsset[]> {
  if (projectIds.length === 0) return [];
  const { data, error } = await supabase
    .from("project_assets")
    .select("*")
    .eq("user_id", userId)
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToAsset);
}

export async function insertAssetInSupabase(
  userId: string,
  projectId: string,
  kind: ProjectAssetKind,
  label: string,
  status: AssetStatus = "pending"
): Promise<ProjectAsset> {
  const row = {
    project_id: projectId,
    user_id: userId,
    kind,
    label,
    url: null,
    status,
    error_message: null,
  };
  const { data: inserted, error } = await supabase
    .from("project_assets")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return rowToAsset(inserted);
}

export async function updateAssetStatusInSupabase(
  assetId: string,
  status: AssetStatus,
  errorMessage?: string | null,
  url?: string | null
): Promise<void> {
  const { error } = await supabase
    .from("project_assets")
    .update({
      status,
      ...(errorMessage !== undefined && { error_message: errorMessage }),
      ...(url !== undefined && { url }),
    })
    .eq("id", assetId);
  if (error) throw error;
}

function rowToAsset(row: Record<string, unknown>): ProjectAsset {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    kind: row.kind as ProjectAssetKind,
    label: (row.label as string) ?? "",
    url: (row.url as string | null) ?? null,
    status: (row.status as AssetStatus) ?? "pending",
    createdAt: (row.created_at as string) ?? "",
    errorMessage: (row.error_message as string | null) ?? null,
  };
}

// —— YouTube packages ——

export async function fetchYouTubePackagesForProjects(
  userId: string,
  projectIds: string[]
): Promise<Record<string, YouTubePackageData>> {
  if (projectIds.length === 0) return {};
  const { data, error } = await supabase
    .from("youtube_packages")
    .select("*")
    .eq("user_id", userId)
    .in("project_id", projectIds);
  if (error) throw error;
  const out: Record<string, YouTubePackageData> = {};
  for (const row of data ?? []) {
    const projectId = row.project_id as string;
    out[projectId] = rowToYouTubePackage(row);
  }
  return out;
}

export async function upsertYouTubePackageInSupabase(
  userId: string,
  projectId: string,
  data: YouTubePackageData
): Promise<void> {
  const row = {
    project_id: projectId,
    user_id: userId,
    title: data.title,
    description: data.description,
    tags: data.tags,
    hashtags: data.hashtags,
    readiness_score: data.readinessScore,
    generated_at: data.generatedAt,
  };
  const { error } = await supabase.from("youtube_packages").upsert(row, {
    onConflict: "project_id",
  });
  if (error) throw error;
}

function rowToYouTubePackage(row: Record<string, unknown>): YouTubePackageData {
  return {
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? "",
    tags: ((row.tags as string[]) ?? []) as string[],
    hashtags: ((row.hashtags as string[]) ?? []) as string[],
    readinessScore: (row.readiness_score as number) ?? 0,
    generatedAt: (row.generated_at as string) ?? "",
  };
}

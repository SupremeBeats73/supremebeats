import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SignedObject = { bucket: string; path: string };

function extractSignedObjectFromUrl(url: string): SignedObject | null {
  // Supabase signed URL format:
  // .../storage/v1/object/sign/<bucket>/<path>?token=...
  const marker = "/storage/v1/object/sign/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  const after = url.slice(idx + marker.length);
  const [bucketAndPath] = after.split("?");
  if (!bucketAndPath) return null;

  const slash = bucketAndPath.indexOf("/");
  if (slash <= 0) return null;

  const bucket = bucketAndPath.slice(0, slash);
  const path = bucketAndPath.slice(slash + 1);
  if (!bucket || !path) return null;

  return { bucket, path };
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Prefer JSON body; fallback to query param.
  let body: { projectId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }
  const url = new URL(request.url);
  const projectId =
    typeof body?.projectId === "string"
      ? body.projectId.trim()
      : url.searchParams.get("projectId")?.trim() ?? "";

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: "projectId is required" },
      { status: 400 },
    );
  }

  // Validate ownership.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (projectError) {
    console.error("[projects/delete] project lookup", projectError);
    return NextResponse.json(
      { success: false, error: "Could not validate project" },
      { status: 500 },
    );
  }

  if (!project) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 },
    );
  }

  // Fetch associated assets/versions with file paths so we can delete storage too.
  const [assetsRes, versionsRes] = await Promise.all([
    supabase
      .from("project_assets")
      .select("id, asset_type, file_path, url, file_url")
      .eq("project_id", projectId)
      .eq("user_id", user.id),
    supabase
      .from("project_versions")
      .select("id, asset_type, file_path, audio_url")
      .eq("project_id", projectId)
      .eq("user_id", user.id),
  ]);

  const assets = assetsRes.data ?? [];
  const versions = versionsRes.data ?? [];

  const storageTargets: { bucket: string; path: string }[] = [];
  const storageKeySet = new Set<string>();

  const pushTarget = (bucket: string, path: string) => {
    if (!bucket || !path) return;
    const key = `${bucket}/${path}`;
    if (storageKeySet.has(key)) return;
    storageKeySet.add(key);
    storageTargets.push({ bucket, path });
  };

  // Versions: generated-audio / project-exports
  for (const v of versions) {
    const filePath = (v.file_path as string | null) ?? null;
    const assetType = (v.asset_type as string | null) ?? null;
    const audioUrl = (v.audio_url as string | null) ?? null;

    if (filePath) {
      const bucket = assetType === "export" ? "project-exports" : "generated-audio";
      pushTarget(bucket, filePath);
      continue;
    }

    if (audioUrl && audioUrl.includes("/storage/v1/object/sign/")) {
      const parsed = extractSignedObjectFromUrl(audioUrl);
      if (parsed) pushTarget(parsed.bucket, parsed.path);
    }
  }

  // Assets: reference-audio (user-uploads), cover-art (cover-art), else fall back to signed URL parsing.
  for (const a of assets) {
    const assetType = (a.asset_type as string | null) ?? null;
    const filePath = (a.file_path as string | null) ?? null;
    const urlValue = (a.url as string | null) ?? (a.file_url as string | null) ?? null;

    if (filePath) {
      const bucket =
        assetType === "reference-audio"
          ? "user-uploads"
          : assetType === "cover-art"
            ? "cover-art"
            : "assets";
      pushTarget(bucket, filePath);
      continue;
    }

    if (urlValue && urlValue.includes("/storage/v1/object/sign/")) {
      const parsed = extractSignedObjectFromUrl(urlValue);
      if (parsed) pushTarget(parsed.bucket, parsed.path);
    }
  }

  // Delete rows first (as requested).
  const deleteVersionsRes = await supabase
    .from("project_versions")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  if (deleteVersionsRes.error) {
    console.error("[projects/delete] project_versions delete", deleteVersionsRes.error);
    return NextResponse.json(
      {
        success: false,
        error:
          `Could not delete project versions: ` +
          (deleteVersionsRes.error.message ?? String(deleteVersionsRes.error)),
      },
      { status: 500 },
    );
  }

  const deleteAssetsRes = await supabase
    .from("project_assets")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  if (deleteAssetsRes.error) {
    console.error("[projects/delete] project_assets delete", deleteAssetsRes.error);
    return NextResponse.json(
      {
        success: false,
        error:
          `Could not delete project assets: ` +
          (deleteAssetsRes.error.message ?? String(deleteAssetsRes.error)),
      },
      { status: 500 },
    );
  }

  const deleteGenerationRes = await supabase
    .from("generation_jobs")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  if (deleteGenerationRes.error) {
    console.error("[projects/delete] generation_jobs delete", deleteGenerationRes.error);
    return NextResponse.json(
      {
        success: false,
        error:
          `Could not delete project jobs: ` +
          (deleteGenerationRes.error.message ?? String(deleteGenerationRes.error)),
      },
      { status: 500 },
    );
  }

  const deleteProjectRes = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (deleteProjectRes.error) {
    console.error("[projects/delete] projects delete", deleteProjectRes.error);
    return NextResponse.json(
      {
        success: false,
        error:
          `Could not delete project: ` +
          (deleteProjectRes.error.message ?? String(deleteProjectRes.error)),
      },
      { status: 500 },
    );
  }

  // Delete associated storage files (best-effort).
  try {
    const targetsByBucket = new Map<string, Set<string>>();
    for (const t of storageTargets) {
      if (!targetsByBucket.has(t.bucket)) targetsByBucket.set(t.bucket, new Set<string>());
      targetsByBucket.get(t.bucket)!.add(t.path);
    }

    for (const [bucket, paths] of targetsByBucket.entries()) {
      const toRemove = Array.from(paths);
      if (toRemove.length === 0) continue;
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove(toRemove);
      if (storageError) {
        console.error("[projects/delete] storage remove error", { bucket, storageError });
      }
    }
  } catch (e) {
    console.error("[projects/delete] storage deletion failed", e);
  }

  return NextResponse.json({ success: true });
}


import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/export/audio
 * Body: { versionId: string }
 * - Validates the user
 * - Confirms they own the project_versions row
 * - Generates (or returns) a download URL for the audio file.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { versionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const versionId =
    typeof body?.versionId === "string" ? body.versionId.trim() : "";
  if (!versionId) {
    return NextResponse.json(
      { error: "versionId is required" },
      { status: 400 }
    );
  }

  const { data: version, error: versionError } = await supabase
    .from("project_versions")
    .select("id, user_id, audio_url, file_path, asset_type")
    .eq("id", versionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (versionError) {
    console.error("[export/audio] load version", versionError);
    return NextResponse.json(
      { error: "Could not load version" },
      { status: 500 }
    );
  }

  if (!version) {
    return NextResponse.json(
      { error: "Version not found" },
      { status: 404 }
    );
  }

  const audioUrl = (version.audio_url as string | null) ?? null;
  const filePath = (version.file_path as string | null) ?? null;

  // If audio_url is already a full URL, just return it (legacy behavior).
  if (audioUrl && audioUrl.startsWith("http")) {
    return NextResponse.json({ url: audioUrl });
  }

  if (!filePath && !audioUrl) {
    return NextResponse.json(
      { error: "Version has no audio file associated" },
      { status: 400 }
    );
  }

  const path = filePath || audioUrl!;

  // Decide bucket: default to generated-audio for versions.
  const assetType = (version.asset_type as string | null) ?? null;
  const bucket =
    assetType === "export"
      ? "project-exports"
      : "generated-audio";

  const { data: signed, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  if (signedError || !signed?.signedUrl) {
    console.error("[export/audio] signed url", signedError);
    return NextResponse.json(
      { error: "Failed to create signed URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signed.signedUrl });
}


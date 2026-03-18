import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_AUDIO_MIME_PREFIX = "audio/";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const projectId = formData.get("projectId");
  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  // Validate project ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (projectError) {
    console.error("[upload/reference] load project", projectError);
    return NextResponse.json(
      { error: "Could not validate project" },
      { status: 500 }
    );
  }

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be 25MB or smaller" },
      { status: 400 }
    );
  }

  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith(ALLOWED_AUDIO_MIME_PREFIX)) {
    return NextResponse.json(
      { error: "Only audio files are allowed" },
      { status: 400 }
    );
  }

  const originalName = file.name || "reference";
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${projectId}/reference-${Date.now()}-${safeName}`;

  // Upload to storage bucket user-uploads
  const { error: uploadError } = await supabase.storage
    .from("user-uploads")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[upload/reference] storage", uploadError);
    return NextResponse.json(
      { error: uploadError.message || "Upload failed" },
      { status: 500 }
    );
  }

  const { data: urlData, error: signedError } = await supabase.storage
    .from("user-uploads")
    .createSignedUrl(path, 3600);
  if (signedError || !urlData?.signedUrl) {
    console.error("[upload/reference] signed url", signedError);
    // Keep file_path so we can re-sign later if needed
  }
  const fileUrl = urlData?.signedUrl ?? null;

  const now = new Date().toISOString();

  // Insert into project_assets
  const { data: inserted, error: insertError } = await supabase
    .from("project_assets")
    .insert({
      project_id: projectId,
      user_id: user.id,
      kind: "automation_placeholder", // keep existing kinds tight; specific type is in asset_type
      label: originalName,
      url: fileUrl,
      status: "success",
      error_message: null,
      asset_type: "reference-audio",
      file_url: fileUrl,
      file_path: path,
      file_name: originalName,
      mime_type: mime,
      created_at: now,
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("[upload/reference] insert asset", insertError);
    return NextResponse.json(
      { error: "Could not create asset" },
      { status: 500 }
    );
  }

  // Append URL to project.reference_uploads so Studio workspace can load it as a track
  const { data: projectRow } = await supabase
    .from("projects")
    .select("reference_uploads")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  const existing = (projectRow?.reference_uploads as string[] | null) ?? [];
  const nextUrls = Array.isArray(existing)
    ? [...existing, ...(fileUrl ? [fileUrl] : [])]
    : fileUrl ? [fileUrl] : [];

  const { error: updateProjError } = await supabase
    .from("projects")
    .update({
      reference_uploads: nextUrls,
      updated_at: now,
    })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (updateProjError) {
    console.error("[upload/reference] update project reference_uploads", updateProjError);
    // Asset was created; still return success so the file is not orphaned
  }

  return NextResponse.json({ asset: inserted, url: fileUrl });
}


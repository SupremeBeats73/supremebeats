import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const REPLICATE_MUSICGEN_VERSION =
  "b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38";
const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_WAIT_MS = 120_000; // 2 min

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  genre: string;
  bpm: number;
  mood: string;
  prompt: string | null;
  duration: number;
};

/**
 * POST /api/generate/music
 * Body: { projectId: string, kind: "beat" | "full_song", assetId: string }
 * - Validates auth and project ownership.
 * - Assumes credits were already checked + deducted by the caller (submitJob → /api/credits/deduct).
 * - Writes a generation_jobs row (queued → running → success/failed) when jobId is provided.
 * - Loads project (prompt, genre, bpm, mood), calls Replicate MusicGen,
 *   downloads audio, uploads to Supabase Storage, updates project_asset,
 *   and creates a project_versions row pointing at the stored audio.
 * - If REPLICATE_API_TOKEN is not set, returns 501.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token?.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: "AI generation is not configured. Set REPLICATE_API_TOKEN to enable.",
      },
      { status: 501 }
    );
  }

  let body: { projectId?: string; kind?: string; assetId?: string; jobId?: string; jobType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const kind = body?.kind === "beat" || body?.kind === "full_song" ? body.kind : null;
  const assetId = typeof body?.assetId === "string" ? body.assetId.trim() : "";
  const jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";
  const jobType = typeof body?.jobType === "string" ? body.jobType.trim() : "";

  if (!projectId || !kind || !assetId) {
    return NextResponse.json(
      { success: false, error: "projectId, kind (beat|full_song), and assetId are required" },
      { status: 400 }
    );
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id, name, genre, bpm, mood, prompt, duration")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { success: false, error: "Project not found or access denied" },
      { status: 404 }
    );
  }

  const row = project as unknown as ProjectRow;
  const prompt = [row.prompt, row.genre, row.bpm ? `${row.bpm} BPM` : "", row.mood]
    .filter(Boolean)
    .join(". ") || "Instrumental music";
  const durationSec = kind === "beat" ? 20 : Math.min(30, Math.max(8, row.duration || 30));

  const nowIso = new Date().toISOString();

  const hasJob = !!jobId && !!jobType;

  const updateJob = async (fields: Partial<{
    status: string;
    error_message: string | null;
    provider_job_id: string | null;
    output_json: unknown;
  }>) => {
    if (!hasJob) return;
    await supabase
      .from("generation_jobs")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("user_id", user.id);
  };

  if (hasJob) {
    await supabase.from("generation_jobs").upsert(
      {
        id: jobId,
        user_id: user.id,
        project_id: projectId,
        job_type: jobType,
        provider: "replicate",
        status: "queued",
        input_json: {
          kind,
          prompt,
          duration: durationSec,
        },
        created_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  }

  const updateAssetFailure = async (errorMessage: string) => {
    await supabase
      .from("project_assets")
      .update({ status: "failure", error_message: errorMessage })
      .eq("id", assetId)
      .eq("user_id", user.id);
    await updateJob({ status: "failed", error_message: errorMessage });
  };

  // Move job to running right before calling the provider.
  if (hasJob) {
    await updateJob({ status: "running" });
  }

  let predictionId: string;
  let pollUrl: string;
  try {
    const createRes = await fetch(`${REPLICATE_API_BASE}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: REPLICATE_MUSICGEN_VERSION,
        input: {
          model_version: "stereo-melody-large",
          prompt,
          duration: durationSec,
          output_format: "mp3",
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      await updateAssetFailure("Replicate API error: " + (errText || createRes.statusText));
      return NextResponse.json(
        { success: false, error: "Replicate request failed" },
        { status: 502 }
      );
    }

    const createData = (await createRes.json()) as { id?: string; urls?: { get: string } };
    predictionId = createData.id as string;
    pollUrl = createData.urls?.get ?? "";
    if (!predictionId || !pollUrl) {
      await updateAssetFailure("Replicate did not return prediction id or poll URL");
      return NextResponse.json(
        { success: false, error: "Invalid Replicate response" },
        { status: 502 }
      );
    }
    if (hasJob && predictionId) {
      await updateJob({ provider_job_id: predictionId });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Replicate request failed";
    await updateAssetFailure(msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }

  let output: string | null = null;
  const deadline = Date.now() + POLL_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pollData = (await pollRes.json()) as {
      status: string;
      output?: string;
      error?: string;
    };
    if (pollData.status === "succeeded") {
      output = typeof pollData.output === "string" ? pollData.output : null;
      if (!output && Array.isArray(pollData.output)) output = pollData.output[0] ?? null;
      break;
    }
    if (pollData.status === "failed" || pollData.status === "canceled") {
      const err = pollData.error || pollData.status;
      await updateAssetFailure("Generation failed: " + err);
      return NextResponse.json(
        { success: false, error: String(err) },
        { status: 502 }
      );
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  if (!output) {
    await updateAssetFailure("Generation timed out");
    return NextResponse.json(
      { success: false, error: "Generation timed out" },
      { status: 504 }
    );
  }

  let audioBuffer: ArrayBuffer;
  try {
    const audioRes = await fetch(output);
    if (!audioRes.ok) {
      await updateAssetFailure("Failed to download generated audio");
      return NextResponse.json(
        { success: false, error: "Failed to download audio" },
        { status: 502 }
      );
    }
    audioBuffer = await audioRes.arrayBuffer();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Download failed";
    await updateAssetFailure(msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }

  const filePath = `${user.id}/${projectId}/${Date.now()}-${kind}.mp3`;

  const { error: uploadError } = await supabase.storage
    .from("generated-audio")
    .upload(filePath, audioBuffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: "audio/mpeg",
    });

  if (uploadError) {
    await updateAssetFailure("Storage upload failed: " + uploadError.message);
    return NextResponse.json(
      { success: false, error: "Storage upload failed" },
      { status: 500 }
    );
  }

  const { data: urlData, error: signedError } = await supabase.storage
    .from("generated-audio")
    .createSignedUrl(filePath, 3600);
  if (signedError || !urlData?.signedUrl) {
    await updateAssetFailure("Failed to create signed URL");
    return NextResponse.json(
      { success: false, error: "Failed to create signed URL" },
      { status: 500 }
    );
  }
  const publicUrl = urlData.signedUrl;

  const { error: updateError } = await supabase
    .from("project_assets")
    .update({ status: "success", url: publicUrl, error_message: null })
    .eq("id", assetId)
    .eq("user_id", user.id);

  if (updateError) {
    await updateJob({
      status: "failed",
      error_message: "Failed to update asset after generation",
    });
    return NextResponse.json(
      { success: false, error: "Failed to update asset" },
      { status: 500 }
    );
  }

  // Best-effort: record this generation as a project_version for export workflows.
  try {
    await supabase.from("project_versions").insert({
      project_id: projectId,
      user_id: user.id,
      label:
        (row.name
          ? `${row.name} – ${kind === "beat" ? "Beat" : "Full song"}`
          : kind === "beat"
            ? "Beat"
            : "Full song") || null,
      status: "success",
      // Prefer storing the storage path; export endpoint will re-sign it.
      file_path: filePath,
      audio_url: null,
      asset_type: "generated",
    } as any);
  } catch (e) {
    // Non-fatal; log on server but don't fail the request.
    console.error("[generate/music] project_versions insert", e);
  }

  await updateJob({
    status: "success",
    error_message: null,
    output_json: { url: publicUrl, assetId },
  });

  return NextResponse.json({
    success: true,
    assetId,
    url: publicUrl,
  });
}

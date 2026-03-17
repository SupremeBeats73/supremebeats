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
 * - Loads project (prompt, genre, bpm, mood), calls Replicate MusicGen,
 *   downloads audio, uploads to Supabase Storage, updates project_asset.
 * - Credits are assumed already deducted by caller (submitJob).
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

  let body: { projectId?: string; kind?: string; assetId?: string };
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

  const updateAssetFailure = async (errorMessage: string) => {
    await supabase
      .from("project_assets")
      .update({ status: "failure", error_message: errorMessage })
      .eq("id", assetId)
      .eq("user_id", user.id);
  };

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

  const folder = "generated";
  const filePath = `${folder}/${user.id}/${projectId}/${Date.now()}-${kind}.mp3`;

  const { error: uploadError } = await supabase.storage
    .from("assets")
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

  const { data: urlData } = supabase.storage.from("assets").getPublicUrl(filePath);
  const publicUrl = urlData?.publicUrl ?? "";

  const { error: updateError } = await supabase
    .from("project_assets")
    .update({ status: "success", url: publicUrl, error_message: null })
    .eq("id", assetId)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: "Failed to update asset" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    assetId,
    url: publicUrl,
  });
}

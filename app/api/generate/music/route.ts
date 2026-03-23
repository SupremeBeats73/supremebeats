import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/** MiniMax Music 1.5 on Replicate. */
const REPLICATE_MINIMAX_MUSIC_PREDICTIONS =
  "https://api.replicate.com/v1/models/minimax/music-1.5/predictions";
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_WAIT_MS = 300_000; // 5 min — async music jobs

/** Replicate MiniMax Music API — prompt must be 10–300 characters. */
const MIN_MUSIC_PROMPT = 10;
const MAX_MUSIC_PROMPT = 300;
const MIN_LYRICS = 10;
const MAX_LYRICS = 600;

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  genre: string;
  bpm: number;
  mood: string;
  key: string;
  prompt: string | null;
  duration: number;
  lyrics: string | null;
  vocal_style: string | null;
  instruments: unknown;
};

type ProjectVersionInsertRow = {
  id: string;
  project_id: string;
  user_id: string;
  label: string | null;
  status: string;
  file_path: string;
  audio_url: string | null;
  asset_type: string;
};

function ensureCharRange(text: string, min: number, max: number, filler: string): string {
  let s = text.trim().replace(/\s+/gim, " ");
  if (s.length > max) {
    s = s.slice(0, max);
  }
  if (s.length < min) {
    const pad = `${filler} ${s}`.trim();
    s = pad.slice(0, max);
  }
  while (s.length < min) {
    s = `${s}.`;
  }
  return s.slice(0, max);
}

const STUDIO_PROMPT_META_PREFIX = "SBMETA_JSON";

/** Music Studio form packs JSON meta on the first line; remainder is free direction text. */
function unpackStudioPromptMeta(full: string | null | undefined): {
  meta: Record<string, string>;
  direction: string;
} {
  const s = (full ?? "").trim();
  if (!s.startsWith(STUDIO_PROMPT_META_PREFIX)) return { meta: {}, direction: s };
  const nl = s.indexOf("\n");
  if (nl <= STUDIO_PROMPT_META_PREFIX.length) return { meta: {}, direction: s };
  try {
    const raw = s.slice(STUDIO_PROMPT_META_PREFIX.length, nl);
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { meta: {}, direction: s };
    }
    const meta: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") meta[k] = v;
    }
    return { meta, direction: s.slice(nl + 1).trim() };
  } catch {
    return { meta: {}, direction: s };
  }
}

const PROMPT_FALLBACK_MIN = "Instrumental beat";

/**
 * MiniMax Music prompt for Replicate: strictly 10–300 characters.
 * Priority: track description (user text after SBMETA line), then genre, mood, BPM, key.
 */
function buildDescriptiveMinimaxPrompt(row: ProjectRow, _kind: "beat" | "full_song"): string {
  const { direction: directionRaw } = unpackStudioPromptMeta(row.prompt);
  const trackDescription = directionRaw.trim();
  const genre = row.genre?.trim() ?? "";
  const mood = row.mood?.trim() ?? "";
  const keyStr = row.key?.trim() ?? "";
  const bpm =
    Number.isFinite(row.bpm) && row.bpm > 0
      ? Math.min(300, Math.max(40, Math.round(row.bpm)))
      : null;

  const parts: string[] = [];
  if (trackDescription) parts.push(trackDescription);
  if (genre) parts.push(genre);
  if (mood) parts.push(`${mood} mood`);
  if (bpm != null) parts.push(`${bpm} BPM`);
  if (keyStr) parts.push(`${keyStr} key`);

  let prompt = parts.join(", ").replace(/\s+/g, " ").trim();

  if (prompt.length > MAX_MUSIC_PROMPT) {
    prompt = prompt.slice(0, MAX_MUSIC_PROMPT);
  }

  if (prompt.length < MIN_MUSIC_PROMPT) {
    prompt = PROMPT_FALLBACK_MIN.slice(0, MAX_MUSIC_PROMPT);
  }

  return prompt.slice(0, MAX_MUSIC_PROMPT);
}

function buildMinimaxLyrics(row: ProjectRow, kind: "beat" | "full_song"): string {
  if (kind === "beat") {
    const beatLyrics = `[instrumental]
No vocals. Pure instrumental beat, loop-friendly arrangement.
[verse] (instrumental groove — drums, bass, harmony)
[chorus] (instrumental hook — memorable motif, no singing)
[outro] (instrumental fade)`;
    return ensureCharRange(beatLyrics, MIN_LYRICS, MAX_LYRICS, "[instrumental] ");
  }

  const existing = row.lyrics?.trim() ?? "";
  if (existing.length >= MIN_LYRICS) {
    const withStructure = `Full song: use clear [verse] and [chorus] section markers. Follow the lyrics and implied melody closely.\n${existing}`;
    return ensureCharRange(withStructure, MIN_LYRICS, MAX_LYRICS, "[verse] ");
  }

  const fallback = `[intro]
Lights up, we own the sky tonight.
[verse]
Every bar a spark, every note upright.
[chorus]
This is our anthem, burning bright.
[bridge]
Hold your breath and jump with me.
[outro]
Sing it loud until dawn.`;
  return ensureCharRange(fallback, MIN_LYRICS, MAX_LYRICS, "[verse] La la la.");
}

/** Turn Replicate HTTP error body into a short message for logs + client. */
function formatReplicateHttpError(status: number, errText: string): string {
  const raw = (errText ?? "").trim();
  let message = raw;
  try {
    const j = JSON.parse(raw) as { detail?: unknown; title?: unknown };
    const d = typeof j.detail === "string" ? j.detail : "";
    const t = typeof j.title === "string" ? j.title : "";
    if (d || t) message = [t, d].filter(Boolean).join(": ");
  } catch {
    // keep raw text (often HTML or plain string)
  }
  if (!message) message = `HTTP ${status}`;
  if (message.length > 420) message = `${message.slice(0, 417)}...`;

  const hints: Partial<Record<number, string>> = {
    401: "Invalid or missing API token — set REPLICATE_API_TOKEN in Vercel (Production).",
    403: "Access denied — confirm the token can run minimax/music-1.5 on replicate.com.",
    402: "Replicate billing required — add a card or credits at replicate.com/account/billing.",
    429: "Replicate rate limit — wait and try again.",
  };
  const hint = hints[status];
  return hint ? `${message} (${hint})` : message;
}

function predictionOutputToUrl(output: unknown): string | null {
  if (typeof output === "string" && output.startsWith("http")) return output;
  if (Array.isArray(output) && typeof output[0] === "string" && output[0].startsWith("http")) {
    return output[0];
  }
  if (
    output &&
    typeof output === "object" &&
    "url" in output &&
    typeof (output as { url: unknown }).url === "string"
  ) {
    const u = (output as { url: string }).url;
    if (u.startsWith("http")) return u;
  }
  return null;
}

/**
 * POST /api/generate/music
 * Body: { projectId: string, kind: "beat" | "full_song", assetId: string, jobId?, jobType? }
 * Uses Replicate MiniMax Music 1.5 with project-backed prompt + lyrics, polls until done,
 * uploads to generated-audio/{user_id}/{project_id}/{version_id}.mp3, inserts project_versions,
 * marks generation_jobs as completed, returns signed audio URL for WaveSurfer.
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
    .select(
      "id, user_id, name, genre, bpm, mood, key, prompt, duration, lyrics, vocal_style, instruments"
    )
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
  const musicPrompt = buildDescriptiveMinimaxPrompt(row, kind);
  const lyrics = buildMinimaxLyrics(row, kind);

  const nowIso = new Date().toISOString();
  const hasJob = !!jobId && !!jobType;
  const versionId = randomUUID();
  const storagePath = `${user.id}/${projectId}/${versionId}.mp3`;

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
          model: "minimax/music-1.5",
          prompt: musicPrompt,
          lyrics,
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

  if (hasJob) {
    await updateJob({ status: "running" });
  }

  let pollUrl = "";
  let predictionId = "";

  try {
    console.log(
      "[generate/music] Final MiniMax music prompt (Replicate)",
      `length=${musicPrompt.length}`,
      "content=",
      musicPrompt
    );
    console.log(
      "[generate/music] MiniMax lyrics:",
      `length=${lyrics.length}`,
      "preview=",
      lyrics.slice(0, 160).replace(/\s+/g, " ")
    );

    const createRes = await fetch(REPLICATE_MINIMAX_MUSIC_PREDICTIONS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: musicPrompt,
          lyrics,
          audio_format: "mp3",
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      const userMessage = formatReplicateHttpError(createRes.status, errText);
      console.error(
        "[generate/music] Replicate create prediction failed",
        createRes.status,
        errText.slice(0, 2000)
      );
      await updateAssetFailure("Replicate API error: " + userMessage);
      return NextResponse.json(
        { success: false, error: userMessage },
        { status: createRes.status === 401 || createRes.status === 403 ? 401 : 502 }
      );
    }

    const createData = (await createRes.json()) as {
      id?: string;
      status?: string;
      urls?: { get: string };
      output?: unknown;
      error?: string;
    };

    predictionId = createData.id ?? "";
    pollUrl = createData.urls?.get ?? "";
    if (!predictionId) {
      await updateAssetFailure("Replicate did not return prediction id");
      return NextResponse.json(
        { success: false, error: "Invalid Replicate response" },
        { status: 502 }
      );
    }
    if (hasJob) {
      await updateJob({ provider_job_id: predictionId });
    }

    let outputUrl: string | null = null;
    if (createData.status === "succeeded") {
      outputUrl = predictionOutputToUrl(createData.output);
    }

    if (!outputUrl && !pollUrl) {
      await updateAssetFailure("Replicate did not return a poll URL");
      return NextResponse.json(
        { success: false, error: "Invalid Replicate response" },
        { status: 502 }
      );
    }

    if (!outputUrl && pollUrl) {
      const deadline = Date.now() + POLL_MAX_WAIT_MS;
      while (Date.now() < deadline) {
        const pollRes = await fetch(pollUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pollData = (await pollRes.json()) as {
          status: string;
          output?: unknown;
          error?: string;
        };
        if (pollData.status === "succeeded") {
          outputUrl = predictionOutputToUrl(pollData.output);
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
    }

    if (!outputUrl) {
      await updateAssetFailure("Generation timed out");
      return NextResponse.json(
        { success: false, error: "Generation timed out" },
        { status: 504 }
      );
    }

    let audioBuffer: ArrayBuffer;
    try {
      const audioRes = await fetch(outputUrl);
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

    const { error: uploadError } = await supabase.storage
      .from("generated-audio")
      .upload(storagePath, audioBuffer, {
        cacheControl: "3600",
        upsert: true,
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
      .createSignedUrl(storagePath, 3600);
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

    const insertRow: ProjectVersionInsertRow = {
      id: versionId,
      project_id: projectId,
      user_id: user.id,
      label:
        (row.name
          ? `${row.name} – ${kind === "beat" ? "Beat" : "Full song"} (MiniMax 1.5)`
          : kind === "beat"
            ? "Beat – MiniMax 1.5"
            : "Full song – MiniMax 1.5") || null,
      status: "success",
      file_path: storagePath,
      audio_url: publicUrl,
      asset_type: "generated",
    };

    const { error: versionError } = await supabase.from("project_versions").insert(insertRow);
    if (versionError) {
      console.error("[generate/music] project_versions insert", versionError);
    }

    await updateJob({
      status: "completed",
      error_message: null,
      output_json: { url: publicUrl, assetId, versionId, storagePath },
    });

    return NextResponse.json({
      success: true,
      assetId,
      versionId,
      url: publicUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Replicate request failed";
    await updateAssetFailure(msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }
}

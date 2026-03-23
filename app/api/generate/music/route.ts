import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/** MiniMax Music 1.5 on Replicate. */
const REPLICATE_MINIMAX_MUSIC_PREDICTIONS =
  "https://api.replicate.com/v1/models/minimax/music-1.5/predictions";
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_WAIT_MS = 300_000; // 5 min — async music jobs

/** MiniMax Music 1.5 — descriptive prompt budget (optional details trimmed first; core settings never dropped). */
const MIN_MUSIC_PROMPT = 10;
const MAX_MUSIC_PROMPT = 600;
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

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === "string");
  }
  return [];
}

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

/** Production texture hints from genre (natural language for MiniMax). */
function genreProductionTexture(genreRaw: string): string {
  const g = genreRaw.trim().toLowerCase();
  if (!g) return "professional mix, clear low end, polished production";
  if (g.includes("lo-fi") || g.includes("lofi") || g.includes("chillhop"))
    return "soft drums, vinyl texture, warm tape saturation, relaxed pocket, mellow dynamics";
  if (g.includes("trap"))
    return "heavy 808s, crisp hi-hats, punchy drums, dark aggressive energy";
  if (g.includes("drill"))
    return "sliding 808s, sparse dark melodies, punchy drums, UK drill energy";
  if (g.includes("afro"))
    return "percussive grooves, warm low end, melodic hooks, Afrobeats bounce";
  if (g.includes("hip-hop") || g.includes("hip hop") || g.includes("hiphop"))
    return "swing groove, punchy drums, warm bass, sample-friendly pocket";
  if (g.includes("r&b") || g.includes("rnb") || g.includes("r and b"))
    return "smooth chords, intimate groove, silky highs, polished vocal-ready mix";
  if (g.includes("pop"))
    return "bright mix, catchy energy, wide chorus, radio-ready clarity";
  if (g.includes("edm") || g.includes("house") || g.includes("electronic") || g.includes("dance"))
    return "wide stereo, driving four-on-the-floor energy, club-ready impact";
  if (g.includes("rock"))
    return "live-band energy, gritty guitars, driving drums, powerful dynamics";
  if (g.includes("jazz"))
    return "swing feel, warm upright bass, brushed or light drums, harmonic richness";
  if (g.includes("ambient") || g.includes("cinematic"))
    return "spacious reverb, evolving pads, subtle motion, film-score depth";
  return "professional mix, clear low end, polished modern production";
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

/**
 * Single descriptive prompt for MiniMax Music 1.5.
 * Core block (genre, BPM, key, mood, vocal style for full song) is NEVER removed when trimming;
 * only optional tail (texture, lyrics excerpt, meta, notes) is dropped to fit MAX_MUSIC_PROMPT.
 */
function buildDescriptiveMinimaxPrompt(row: ProjectRow, kind: "beat" | "full_song"): string {
  const genre = row.genre?.trim() || "Electronic";
  const bpm =
    Number.isFinite(row.bpm) && row.bpm > 0 ? Math.min(300, Math.max(40, Math.round(row.bpm))) : null;
  const keyStr = row.key?.trim();
  const mood = row.mood?.trim();
  const vocalStyle = row.vocal_style?.trim();
  const { meta, direction: directionRaw } = unpackStudioPromptMeta(row.prompt);
  /** User track description (body after SBMETA line) — primary creative direction. */
  const trackDescription = directionRaw.trim();
  const projectName = row.name?.trim();
  const durationSec =
    Number.isFinite(row.duration) && row.duration > 0
      ? Math.min(600, Math.max(8, Math.round(row.duration)))
      : null;
  const inst = asStringArray(row.instruments);
  const instPhrase = inst.length ? inst.slice(0, 10).join(", ") : "";

  const texture = genreProductionTexture(genre);

  const beatClosing =
    "Instrumental only, no vocals, loop-ready beat.";
  const fullSongClosing =
    "Full song with vocals and song structure including verse and chorus.";

  /** Always included first — matches user-facing studio choices. */
  const coreSegments: string[] = [];
  if (kind === "beat") {
    coreSegments.push(`${genre} instrumental beat`);
  } else {
    coreSegments.push(`${genre} full song`);
  }
  if (bpm != null) {
    coreSegments.push(`${bpm} BPM`);
  }
  if (keyStr) {
    coreSegments.push(`${keyStr} key`);
  }
  if (mood) {
    coreSegments.push(`${mood} mood`);
  }
  if (kind === "beat") {
    coreSegments.push("no vocals");
  } else if (vocalStyle) {
    coreSegments.push(`vocal style: ${vocalStyle}`);
  }

  const coreBlock = coreSegments.join(", ").replace(/\s+/g, " ").trim();

  /** Lyrics snippet for the music prompt (full lyrics still sent via `lyrics` input). */
  let lyricsForPrompt: string | null = null;
  if (kind === "full_song") {
    const L = row.lyrics?.trim() ?? "";
    if (L.length >= MIN_LYRICS) {
      const one = L.replace(/\s+/g, " ");
      const cap = 280;
      lyricsForPrompt =
        one.length <= cap
          ? `User lyrics to perform (use [verse] and [chorus] sections): ${one}`
          : `User lyrics to perform (use [verse] and [chorus] sections): ${one.slice(0, cap - 3)}...`;
    }
  }

  /**
   * Optional segments (after track description + technical core): drop from the END when over budget.
   * Order: texture, lyrics excerpt, instruments, structure, artist, reference hint, duration, title.
   */
  const optionalOrdered: string[] = [];
  optionalOrdered.push(texture);
  if (lyricsForPrompt) optionalOrdered.push(lyricsForPrompt);
  if (instPhrase) optionalOrdered.push(`instruments: ${instPhrase}`);
  const structure = meta.structure?.trim();
  if (structure) optionalOrdered.push(`song structure: ${structure}`);
  const artistRef = meta.artist?.trim();
  if (artistRef) optionalOrdered.push(`artist sound reference: ${artistRef}`);
  if (meta.hasReference === "1") {
    optionalOrdered.push(
      "reference audio uploaded for this project — match groove, tone, and vibe to that reference"
    );
  }
  if (durationSec != null) optionalOrdered.push(`target length about ${durationSec} seconds`);
  if (projectName && projectName.toLowerCase() !== "untitled project") {
    optionalOrdered.push(`project title vibe: ${projectName}`);
  }

  const closing = kind === "beat" ? beatClosing : fullSongClosing;

  const joinAll = (opts: string[], desc: string) => {
    const parts = [desc, coreBlock, ...opts.filter(Boolean), closing].filter(Boolean);
    return parts.join(", ").replace(/\s+/g, " ").trim();
  };

  let opts = [...optionalOrdered];
  let desc = trackDescription;
  let prompt = joinAll(opts, desc);
  while (prompt.length > MAX_MUSIC_PROMPT && opts.length > 0) {
    opts.pop();
    prompt = joinAll(opts, desc);
  }

  let trimGuard = 0;
  while (prompt.length > MAX_MUSIC_PROMPT && desc.length > 0 && trimGuard < 80) {
    trimGuard += 1;
    const over = prompt.length - MAX_MUSIC_PROMPT;
    const nextLen = Math.max(0, desc.length - over - 3);
    if (nextLen <= 0) {
      desc = "";
      break;
    }
    desc = desc.slice(0, nextLen).trimEnd();
    if (desc.length > 0) desc = `${desc}...`;
    prompt = joinAll(opts, desc);
  }

  if (prompt.length > MAX_MUSIC_PROMPT) {
    const suffix = `, ${closing}`;
    const headBudget = MAX_MUSIC_PROMPT - suffix.length;
    const fixedCore = [desc, coreBlock].filter(Boolean).join(", ").replace(/\s+/g, " ").trim();
    let head = fixedCore;
    if (head.length > headBudget) {
      head = head.slice(0, Math.max(MIN_MUSIC_PROMPT, headBudget)).replace(/[, ]+$/, "");
    }
    prompt = `${head}${suffix}`.replace(/\s+/g, " ").trim().slice(0, MAX_MUSIC_PROMPT);
  }

  if (prompt.length < MIN_MUSIC_PROMPT) {
    prompt = `${prompt}, high quality stereo mix`.slice(0, MAX_MUSIC_PROMPT);
  }
  while (prompt.length < MIN_MUSIC_PROMPT) {
    prompt = `${prompt}.`;
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
      "[generate/music] Final MiniMax music prompt",
      `(${musicPrompt.length} chars):`,
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

import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createRlsClient } from "@/utils/supabase/server";

const MODEL_VERSION =
  "sakemin/musicgen-chord:c940ab4308578237484f90f010b2b3871bf64008e95f26f4d567529ad019a3d6";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[api/generate] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Route will return 500 until configured."
  );
}

const serviceSupabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function POST(req: Request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: "AI generation is not configured on the server." },
        { status: 501 }
      );
    }
    if (!serviceSupabase) {
      return NextResponse.json(
        { error: "Supabase service client is not configured." },
        { status: 500 }
      );
    }

    const rlsSupabase = await createRlsClient();
    const {
      data: { user },
    } = await rlsSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      prompt?: string;
      bpm?: number | string;
      chords?: string;
      duration?: number;
      projectId?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const prompt = (body.prompt ?? "").toString().trim();
    const bpmRaw = Number(body.bpm ?? 120);
    const bpm = Number.isFinite(bpmRaw) ? Math.min(200, Math.max(60, bpmRaw)) : 120;
    const chords = (body.chords ?? "C G Am F").toString().trim().slice(0, 120);
    const durationRaw = Number(body.duration ?? 30);
    const duration = Number.isFinite(durationRaw)
      ? Math.min(60, Math.max(5, durationRaw))
      : 30;
    const projectId = (body.projectId ?? "").toString().trim();

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Verify the project belongs to the current user via RLS client.
    const { data: project, error: projectError } = await rlsSupabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // 1. Trigger Replicate MusicGen-Chord
    const output = (await replicate.run(MODEL_VERSION, {
      input: {
        prompt,
        bpm,
        text_chords: chords || "C G Am F",
        duration,
        time_sig: "4/4",
      },
    })) as unknown;

    const audioUrl =
      typeof output === "string"
        ? output
        : Array.isArray(output)
          ? (output[0] as string)
          : null;

    if (!audioUrl) {
      return NextResponse.json(
        { error: "Replicate did not return an audio URL." },
        { status: 502 }
      );
    }

    // 2. Download the audio buffer
    const response = await fetch(audioUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to download generated audio." },
        { status: 502 }
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Upload to Supabase Storage
    const fileName = `${user.id}/${projectId}/${Date.now()}.wav`;
    const { error: storageError } = await serviceSupabase.storage
      .from("generated-audio")
      .upload(fileName, buffer, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (storageError) {
      // eslint-disable-next-line no-console
      console.error("[api/generate] storage upload error", storageError);
      return NextResponse.json(
        { error: "Failed to upload audio to storage." },
        { status: 500 }
      );
    }

    // 4. Create signed URL (1h)
    const { data: signed, error: signedError } = await serviceSupabase.storage
      .from("generated-audio")
      .createSignedUrl(fileName, 3600);

    if (signedError || !signed?.signedUrl) {
      // eslint-disable-next-line no-console
      console.error("[api/generate] signed url error", signedError);
      return NextResponse.json(
        { error: "Failed to create signed URL for audio" },
        { status: 500 }
      );
    }

    const signedUrl = signed.signedUrl;

    // 5. Update the Database (optional: store on projects or project_assets)
    const { error: dbError } = await serviceSupabase
      .from("projects")
      .update({ audio_url: signedUrl, status: "completed" })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (dbError) {
      // eslint-disable-next-line no-console
      console.error("[api/generate] db update error", dbError);
      // We still return the URL so the client can use it even if metadata update failed.
    }

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("GENERATION_ERROR:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


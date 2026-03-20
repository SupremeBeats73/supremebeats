import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createRlsClient } from "@/utils/supabase/server";

const DEMUCS_VERSION =
  "lucataco/demucs:4372e90c58e5e89d5351307b0ba941f71c4c8ef3e6a2569e5d4151a6603a1100";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[api/stems] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Route will return 500 until configured."
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
        { error: "Stem separation is not configured on the server." },
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

    let body: { audioUrl?: string; projectId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    let audioUrl = (body.audioUrl ?? "").toString().trim();
    const projectId = (body.projectId ?? "").toString().trim();

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Verify the project belongs to the current user
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

    // If audioUrl was not provided, fall back to projects.audio_url
    if (!audioUrl) {
      const { data: projRow, error: audioError } = await serviceSupabase
        .from("projects")
        .select("audio_url")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (audioError) {
        return NextResponse.json(
          { error: "Could not load project audio_url for stems." },
          { status: 500 }
        );
      }
      const fromDb = (projRow?.audio_url as string | null) ?? "";
      audioUrl = fromDb.trim();
      if (!audioUrl) {
        return NextResponse.json(
          { error: "No audio_url found for this project." },
          { status: 400 }
        );
      }
    }

    // 1. Run Demucs on Replicate (4-stem separation)
    const output = (await replicate.run(DEMUCS_VERSION, {
      input: {
        audio: audioUrl,
        model: "htdemucs",
        stem: "all",
      },
    })) as Record<string, string>;

    const uploadedStems: Record<string, string> = {};

    // 2. Download each stem and upload to Supabase Storage
    for (const [name, url] of Object.entries(output)) {
      if (!url || typeof url !== "string") continue;
      const response = await fetch(url);
      if (!response.ok) {
        console.error("[api/stems] failed to fetch stem", name, response.status);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const filePath = `${user.id}/${projectId}/stems/${name}.wav`;
      const { error: uploadError } = await serviceSupabase.storage
        .from("generated-audio")
        .upload(filePath, buffer, { contentType: "audio/wav", upsert: true });

      if (uploadError) {
        console.error("[api/stems] upload error", name, uploadError);
        continue;
      }

      const { data: signed, error: signedError } = await serviceSupabase.storage
        .from("generated-audio")
        .createSignedUrl(filePath, 3600);
      if (signedError || !signed?.signedUrl) {
        console.error("[api/stems] signed url error", name, signedError);
        continue;
      }
      uploadedStems[name] = signed.signedUrl;
    }

    if (Object.keys(uploadedStems).length === 0) {
      return NextResponse.json(
        { error: "No stems could be saved." },
        { status: 502 }
      );
    }

    // 3. Update projects with stem URLs and status
    const { error: dbError } = await serviceSupabase
      .from("projects")
      .update({ stems: uploadedStems, status: "split_complete" })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (dbError) {
      console.error("[api/stems] db update error", dbError);
      // Still return stems so the client can use them
    }

    return NextResponse.json({ stems: uploadedStems });
  } catch (error) {
    console.error("STEM_SPLIT_ERROR:", error);
    const message = error instanceof Error ? error.message : "Stem separation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

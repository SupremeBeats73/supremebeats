import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/generate/cover-art
 * Body: { projectId: string }
 * - Validates user, project ownership, and credits (>= 1).
 * - Deducts 1 credit (profile + credit_ledger reason "cover-art-generation").
 * - Generates cover art via Replicate FLUX from project name/genre/mood.
 * - Stores image in cover-art bucket at {user_id}/{project_id}/{asset_id}.png.
 * - Inserts project_assets with asset_type "cover-art", returns asset.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { projectId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const projectId =
    typeof body?.projectId === "string" ? body.projectId.trim() : "";
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id, name, genre, mood")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json(
      { error: "Project not found or access denied" },
      { status: 404 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits, mic_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Could not load profile" },
      { status: 500 }
    );
  }

  const credits = typeof profile.credits === "number" ? profile.credits : 0;
  const micTier = (profile.mic_tier as string) ?? "";
  const isElite = String(micTier).toLowerCase() === "gold";

  if (!isElite && credits < 1) {
    return NextResponse.json(
      { error: "Insufficient credits. You need at least 1 credit." },
      { status: 400 }
    );
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token?.trim()) {
    return NextResponse.json(
      { error: "Cover art generation is not configured. Set REPLICATE_API_TOKEN." },
      { status: 501 }
    );
  }

  const now = new Date().toISOString();

  if (!isElite) {
    const newBalance = credits - 1;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: newBalance, updated_at: now })
      .eq("id", user.id);
    if (updateError) {
      console.error("[generate/cover-art] profile update", updateError);
      return NextResponse.json(
        { error: "Could not deduct credit" },
        { status: 500 }
      );
    }
    const { error: ledgerError } = await supabase.from("credit_ledger").insert({
      user_id: user.id,
      delta: -1,
      reason: "cover-art-generation",
      job_id: null,
      metadata_json: { project_id: projectId },
      created_at: now,
    });
    if (ledgerError) {
      console.error("[generate/cover-art] ledger insert", ledgerError);
    }
  }

  const { data: assetRow, error: insertError } = await supabase
    .from("project_assets")
    .insert({
      project_id: projectId,
      user_id: user.id,
      kind: "cover_art",
      label: "Cover art",
      status: "processing",
      asset_type: "cover-art",
      created_at: now,
    })
    .select("id")
    .single();

  if (insertError || !assetRow) {
    if (!isElite) {
      await supabase
        .from("profiles")
        .update({
          credits: credits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
    return NextResponse.json(
      { error: "Could not create asset" },
      { status: 500 }
    );
  }

  const assetId = assetRow.id as string;

  const promptParts = [
    "Professional album cover art",
    project.name ? `for "${project.name}"` : "",
    (project.genre as string) ? `Genre: ${project.genre}` : "",
    (project.mood as string) ? `Mood: ${project.mood}` : "",
  ].filter(Boolean);
  const prompt =
    promptParts.join(". ") || "Professional album cover art, high quality, square format.";

  let imageUrl: string;
  try {
    const replicate = new Replicate({ auth: token });
    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: { prompt },
    });
    const raw =
      Array.isArray(output) ? output[0] : typeof output === "string" ? output : null;
    imageUrl = raw != null && typeof raw === "string" ? raw : "";
  } catch (e) {
    console.error("[generate/cover-art] Replicate error", e);
    await supabase
      .from("project_assets")
      .update({
        status: "failure",
        error_message: e instanceof Error ? e.message : "Generation failed",
      })
      .eq("id", assetId)
      .eq("user_id", user.id);
    if (!isElite) {
      await supabase
        .from("profiles")
        .update({
          credits: credits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      await supabase.from("credit_ledger").insert({
        user_id: user.id,
        delta: 1,
        reason: "job_refund",
        job_id: null,
        metadata_json: { note: "cover-art-generation failed" },
        created_at: new Date().toISOString(),
      });
    }
    return NextResponse.json(
      { error: "Cover art generation failed" },
      { status: 502 }
    );
  }

  if (!imageUrl || !imageUrl.startsWith("http")) {
    await supabase
      .from("project_assets")
      .update({
        status: "failure",
        error_message: "No image URL from model",
      })
      .eq("id", assetId)
      .eq("user_id", user.id);
    if (!isElite) {
      await supabase
        .from("profiles")
        .update({ credits: credits, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      await supabase.from("credit_ledger").insert({
        user_id: user.id,
        delta: 1,
        reason: "job_refund",
        metadata_json: { note: "cover-art no image url" },
        created_at: new Date().toISOString(),
      });
    }
    return NextResponse.json(
      { error: "No image returned from model" },
      { status: 502 }
    );
  }

  let imageBuffer: ArrayBuffer;
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("Failed to download image");
    imageBuffer = await res.arrayBuffer();
  } catch (e) {
    console.error("[generate/cover-art] image fetch", e);
    await supabase
      .from("project_assets")
      .update({
        status: "failure",
        error_message: "Failed to download generated image",
      })
      .eq("id", assetId)
      .eq("user_id", user.id);
    if (!isElite) {
      await supabase
        .from("profiles")
        .update({ credits: credits, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      await supabase.from("credit_ledger").insert({
        user_id: user.id,
        delta: 1,
        reason: "job_refund",
        metadata_json: { note: "cover-art download failed" },
        created_at: new Date().toISOString(),
      });
    }
    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 502 }
    );
  }

  const storagePath = `${user.id}/${projectId}/${assetId}.png`;

  const { error: uploadError } = await supabase.storage
    .from("cover-art")
    .upload(storagePath, imageBuffer, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("[generate/cover-art] storage upload", uploadError);
    await supabase
      .from("project_assets")
      .update({
        status: "failure",
        error_message: uploadError.message,
      })
      .eq("id", assetId)
      .eq("user_id", user.id);
    if (!isElite) {
      await supabase
        .from("profiles")
        .update({ credits: credits, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      await supabase.from("credit_ledger").insert({
        user_id: user.id,
        delta: 1,
        reason: "job_refund",
        metadata_json: { note: "cover-art upload failed" },
        created_at: new Date().toISOString(),
      });
    }
    return NextResponse.json(
      { error: "Failed to store cover art" },
      { status: 500 }
    );
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("cover-art")
    .createSignedUrl(storagePath, 3600);

  if (signedError || !signed?.signedUrl) {
    console.error("[generate/cover-art] signed url", signedError);
    await supabase
      .from("project_assets")
      .update({
        status: "success",
        url: null,
        file_path: storagePath,
        file_name: `${assetId}.png`,
        mime_type: "image/png",
        asset_type: "cover-art",
      })
      .eq("id", assetId)
      .eq("user_id", user.id);
  } else {
    const { error: updateErr } = await supabase
      .from("project_assets")
      .update({
        status: "success",
        url: signed.signedUrl,
        file_url: signed.signedUrl,
        file_path: storagePath,
        file_name: `${assetId}.png`,
        mime_type: "image/png",
        asset_type: "cover-art",
        error_message: null,
      })
      .eq("id", assetId)
      .eq("user_id", user.id);

    if (updateErr) {
      console.error("[generate/cover-art] asset update", updateErr);
    }
  }

  const { data: asset, error: assetFetchError } = await supabase
    .from("project_assets")
    .select("*")
    .eq("id", assetId)
    .eq("user_id", user.id)
    .single();

  if (assetFetchError || !asset) {
    return NextResponse.json(
      { error: "Asset created but could not be returned" },
      { status: 500 }
    );
  }

  const urlToReturn = asset.url ?? signed?.signedUrl ?? null;
  return NextResponse.json({
    asset: { ...asset, url: urlToReturn },
    url: urlToReturn,
  });
}

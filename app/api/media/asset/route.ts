import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/media/asset?assetId=...
 * Returns a fresh 1h signed URL for a project_assets row
 * that belongs to the authenticated user.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const assetId = url.searchParams.get("assetId");

  if (!assetId) {
    return NextResponse.json(
      { error: "assetId is required" },
      { status: 400 }
    );
  }

  const { data: asset, error: assetError } = await supabase
    .from("project_assets")
    .select("id, user_id, file_path, url, asset_type")
    .eq("id", assetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (assetError) {
    console.error("[media/asset] load asset", assetError);
    return NextResponse.json(
      { error: "Could not load asset" },
      { status: 500 }
    );
  }

  if (!asset) {
    return NextResponse.json(
      { error: "Asset not found" },
      { status: 404 }
    );
  }

  // If we don't have a file_path (legacy rows), just return existing URL.
  if (!asset.file_path) {
    if (!asset.url) {
      return NextResponse.json(
        { error: "Asset has no file path or URL" },
        { status: 400 }
      );
    }
    return NextResponse.json({ url: asset.url });
  }

  // Decide bucket based on asset_type; default to assets.
  const assetType = (asset.asset_type as string | null) ?? null;
  const bucket =
    assetType === "reference-audio" ? "user-uploads" : "assets";

  const { data: signed, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(asset.file_path as string, 3600);

  if (signedError || !signed?.signedUrl) {
    console.error("[media/asset] signed url", signedError);
    return NextResponse.json(
      { error: "Failed to create signed URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signed.signedUrl });
}


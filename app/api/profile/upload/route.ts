import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const ALLOWED_TYPES = ["avatar", "banner"] as const;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * POST: Upload profile picture or cover art.
 * FormData: { type: "avatar" | "banner", file: File }
 * Returns { url: string } on success.
 */
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
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const type = formData.get("type");
  if (!type || !ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])) {
    return NextResponse.json(
      { error: "type must be avatar or banner" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be 5MB or smaller" },
      { status: 400 }
    );
  }
  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and GIF are allowed" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `profile/${user.id}/${type}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("assets")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (uploadError) {
    console.error("[profile/upload] storage", uploadError);
    return NextResponse.json(
      { error: uploadError.message || "Upload failed" },
      { status: 500 }
    );
  }

  const { data: urlData, error: signedError } = await supabase.storage
    .from("assets")
    .createSignedUrl(path, 3600);
  if (signedError || !urlData?.signedUrl) {
    console.error("[profile/upload] signed url", signedError);
    return NextResponse.json(
      { error: "Could not create signed URL" },
      { status: 500 }
    );
  }
  const url = urlData.signedUrl;

  const column = type === "avatar" ? "avatar_url" : "banner_url";
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      [column]: url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[profile/upload] profiles update", updateError);
    return NextResponse.json(
      { error: "Could not update profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url });
}

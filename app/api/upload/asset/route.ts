import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/upload/asset
 * FormData: { file: File, folder?: string }
 * Uploads to the private "assets" bucket and returns a 1h signed URL + storage path.
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
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 50MB)" },
      { status: 400 }
    );
  }

  const folderRaw = (formData.get("folder") as string | null) ?? "";
  const folder = folderRaw.replace(/^\/+|\/+$/g, "") || "uploads";
  const fileExt = file.name.split(".").pop() || "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${folder}/${Date.now()}-${safeName}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("assets")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[upload/asset] storage upload", uploadError);
    return NextResponse.json(
      { error: uploadError.message || "Failed to upload file" },
      { status: 500 }
    );
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("assets")
    .createSignedUrl(filePath, 3600);

  if (signedError || !signed?.signedUrl) {
    console.error("[upload/asset] signed url", signedError);
    return NextResponse.json(
      { error: "Failed to create signed URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: signed.signedUrl,
    path: filePath,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });
}


"use client";

import { supabase } from "./supabaseClient";

/**
 * Upload a File to the Supabase "assets" bucket and return its public URL.
 *
 * The file is stored under an optional folder prefix plus a timestamped name
 * to reduce the chance of collisions.
 */
export async function uploadAssetToBucket(
  file: File,
  options?: { folder?: string }
): Promise<string> {
  const folder = options?.folder?.replace(/^\/+|\/+$/g, "") || "uploads";
  const fileExt = file.name.split(".").pop() || "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${folder}/${Date.now()}-${safeName}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("assets")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      uploadError.message || "Failed to upload file to Supabase storage."
    );
  }

  const { data } = supabase.storage.from("assets").getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error("Supabase did not return a public URL for the uploaded file.");
  }

  return data.publicUrl;
}


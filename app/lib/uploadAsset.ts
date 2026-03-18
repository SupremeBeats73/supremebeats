"use client";

/**
 * Upload a File to the server, which stores it in the private
 * Supabase `assets` bucket and returns a signed URL plus metadata.
 *
 * The browser never talks directly to Supabase Storage.
 */
export async function uploadAssetToBucket(
  file: File,
  options?: { folder?: string }
): Promise<{ url: string; path: string }> {
  const folder = options?.folder?.replace(/^\/+|\/+$/g, "") || "uploads";

  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const res = await fetch("/api/upload/asset", {
    method: "POST",
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url || !data?.path) {
    const message =
      (data?.error as string) ||
      `Upload failed with status ${res.status}`;
    throw new Error(message);
  }

  return { url: data.url as string, path: data.path as string };
}


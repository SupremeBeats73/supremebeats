import type { SupabaseClient } from "@supabase/supabase-js";

function extractSignedObjectPath(url: string): string | null {
  // Supabase signed URL format:
  // .../storage/v1/object/sign/<bucket>/<path>?token=...
  const marker = "/storage/v1/object/sign/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const after = url.slice(idx + marker.length);
  const [bucketAndPath] = after.split("?");
  if (!bucketAndPath) return null;
  // bucketAndPath starts with "<bucket>/<path>"
  const slash = bucketAndPath.indexOf("/");
  if (slash === -1) return null;
  const path = bucketAndPath.slice(slash + 1);
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export async function resolveAssetsSignedUrl(
  supabase: SupabaseClient,
  raw: string | null | undefined
): Promise<string | null> {
  if (!raw) return null;

  // Preferred: we store the stable object path (e.g. profile/<uid>/avatar.jpg)
  const path =
    raw.startsWith("profile/") ? raw : extractSignedObjectPath(raw) ?? null;

  if (!path) return raw;

  const { data } = await supabase.storage.from("assets").createSignedUrl(path, 3600);
  return data?.signedUrl ?? raw;
}


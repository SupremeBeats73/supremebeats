import { notFound } from "next/navigation";
import Link from "next/link";
import MicBadge from "@/app/components/MicBadge";
import { createClient } from "@/utils/supabase/server";
import { normalizeUsername } from "@/app/lib/usernameUtils";

function normalizeMicTier(
  v: string | null | undefined,
  isAdmin?: boolean | null
): "bronze" | "silver" | "gold" {
  if (isAdmin) return "gold";
  if (!v) return "bronze";
  const s = String(v).toLowerCase();
  if (s === "gold" || s === "elite") return "gold";
  if (s === "silver") return "silver";
  return "bronze";
}

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

type CreatorProfileRow = {
  id: string;
  display_name: string | null;
  bio: string | null;
  mic_tier: string | null;
  updated_at: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  profile_prefs: unknown;
  is_admin: boolean | null;
};

async function maybeRefreshSignedUrl(raw: string | null): Promise<string | null> {
  if (!raw) return null;
  const path = extractSignedObjectPath(raw);
  if (!path) return raw;
  const supabase = await createClient();
  const { data } = await supabase.storage.from("assets").createSignedUrl(path, 3600);
  return data?.signedUrl ?? raw;
}

export default async function PublicCreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const slugTrimmed = typeof slug === "string" ? slug.trim() : "";
  if (!slugTrimmed) notFound();

  // Primary: Gold Mic custom slug in profile_prefs; fallback: display_name (username).
  // For historical/mocked slugs, also try hyphen→underscore normalization.
  const slugCandidate = normalizeUsername(slugTrimmed.replace(/-/g, "_"));

  const { data: byCustomSlug } = await supabase
    .from("profiles")
    .select("id, display_name, bio, mic_tier, updated_at, avatar_url, banner_url, profile_prefs, is_admin")
    .eq("profile_prefs->>customSlug", slugTrimmed)
    .limit(1)
    .maybeSingle();

  const { data: byDisplayName } = byCustomSlug
    ? { data: null as CreatorProfileRow | null }
    : await supabase
        .from("profiles")
        .select("id, display_name, bio, mic_tier, updated_at, avatar_url, banner_url, profile_prefs, is_admin")
        .ilike("display_name", slugCandidate)
        .limit(1)
        .maybeSingle();

  const row = (byCustomSlug ?? byDisplayName) as CreatorProfileRow | null;
  if (!row?.id) notFound();

  const username = (row.display_name as string) || slugCandidate || "creator";
  const micTier = normalizeMicTier(row.mic_tier, row.is_admin);
  const profileImageUrl = await maybeRefreshSignedUrl((row.avatar_url as string) ?? null);
  const bannerImageUrl = await maybeRefreshSignedUrl((row.banner_url as string) ?? null);
  const joinDate = row.updated_at
    ? new Date(row.updated_at as string).toLocaleDateString()
    : "—";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--muted)] hover:text-white"
          >
            ← Back
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
          >
            Create on SupremeBeats
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]">
          <div
            className="h-36 bg-gradient-to-br from-[var(--deep-purple)] to-[var(--purple-mid)] sm:h-44"
            style={{
              backgroundImage: bannerImageUrl ? `url(${bannerImageUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <div className="relative px-5 pb-6 pt-12 sm:px-6">
            <div
              className="absolute left-5 top-0 h-20 w-20 -translate-y-1/2 overflow-hidden rounded-full border-2 border-[var(--background)] bg-[var(--purple-mid)] ring-1 ring-white/10 sm:left-6"
              style={{
                backgroundImage: profileImageUrl ? `url(${profileImageUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-label="Creator profile picture"
            >
              {!profileImageUrl && (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--neon-green)]">
                  {String(username).slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-white sm:text-2xl">
                  <span className="truncate">{username}</span>
                  <MicBadge tier={micTier} size="sm" />
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">Joined {joinDate}</p>
              </div>
            </div>

            {row.bio && (
              <p className="mt-4 text-sm leading-relaxed text-white/90">
                {String(row.bio)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Creations
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Public tracks and pins are coming next. For now, this page shows your identity and visuals.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Connect
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Follow, collab, and marketplace links will appear here when social features ship.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


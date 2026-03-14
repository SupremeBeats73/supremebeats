"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import MicBadge from "../../components/MicBadge";
import UserBadge from "../../components/UserBadge";
import { MOCK_PUBLIC_CREATORS, MOCK_FEED_TRACKS } from "../../lib/mockFeed";
import type { PublicCreatorProfile } from "../../lib/types";

export default function PublicCreatorPage() {
  const params = useParams();
  const slug = params.slug as string;
  const creator = MOCK_PUBLIC_CREATORS[slug];
  const pinnedTracks = creator
    ? MOCK_FEED_TRACKS.filter((t) => creator.pinnedTrackIds.includes(t.id))
    : [];

  if (!creator) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-16">
        <p className="text-[var(--muted)]">Creator not found.</p>
        <Link href="/dashboard/feed" className="mt-4 inline-block text-sm text-[var(--neon-green)] hover:underline">
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-white/5 bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-white">SupremeBeats</Link>
          <Link href="/login" className="text-sm text-[var(--muted)] hover:text-white">Log in</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Banner + avatar */}
        <div className="mb-6 overflow-hidden rounded-xl border border-[var(--card-border)]">
          <div
            className="h-40 bg-gradient-to-br from-[var(--deep-purple)] to-[var(--purple-mid)] sm:h-48"
            style={{
              backgroundImage: creator.bannerImageUrl ? `url(${creator.bannerImageUrl})` : undefined,
              backgroundSize: "cover",
            }}
          />
          <div className="relative border-t border-white/5 bg-[var(--card-bg)] px-6 pb-6 pt-14">
            <div
              className="absolute left-6 top-0 h-24 w-24 -translate-y-1/2 rounded-full border-2 border-[var(--background)] bg-[var(--purple-mid)] flex items-center justify-center text-2xl font-bold text-[var(--neon-green)]"
              style={{
                backgroundImage: creator.profileImageUrl ? `url(${creator.profileImageUrl})` : undefined,
                backgroundSize: "cover",
              }}
            >
              {!creator.profileImageUrl && creator.username.slice(0, 1)}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="flex items-center gap-2 text-xl font-bold text-white">
                  {creator.username}
                  <UserBadge userId={creator.id} />
                </h1>
                <p className="text-sm text-[var(--muted)]">{creator.reputationSummary}</p>
              </div>
              <button
                type="button"
                className="rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
              >
                Follow
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Followers" value={creator.followers} />
          <StatCard label="Following" value={creator.following} />
          <StatCard label="Total plays" value={creator.totalPlays.toLocaleString()} />
          <StatCard label="Rating" value={creator.weightedRating.toFixed(1)} />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <MicBadge tier={creator.micTier} />
          <span className="text-sm text-[var(--muted)]">Level {creator.creatorLevel}</span>
        </div>

        {creator.bio && (
          <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">Bio</h2>
            <p className="text-sm text-white">{creator.bio}</p>
          </div>
        )}

        <div className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Pinned tracks
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {pinnedTracks.map((t) => (
            <Link
              key={t.id}
              href="/dashboard/feed"
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition hover:border-[var(--purple-glow)]/25"
            >
              <p className="font-semibold text-white">{t.title}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{t.plays.toLocaleString()} plays · ★ {t.weightedRating}</p>
            </Link>
          ))}
        </div>

        {creator.featuredCollabsPlaceholder && (
          <div className="mt-8 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/50 p-6 text-center">
            <p className="text-sm text-[var(--muted)]">Featured collaborators — coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

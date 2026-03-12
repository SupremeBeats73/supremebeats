"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import FeedCard from "../../components/FeedCard";
import { DISCOVERY_TABS } from "../../lib/constants";
import { MOCK_FEED_TRACKS } from "../../lib/mockFeed";
import type { DiscoveryTabId, FeedTrack } from "../../lib/types";

const PAGE_SIZE = 6;

export default function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<DiscoveryTabId>("trending");
  const [page, setPage] = useState(1);
  const [tracks] = useState<FeedTrack[]>(MOCK_FEED_TRACKS);
  const currentUserId = user?.id ?? null;

  const displayTracks = tracks.slice(0, page * PAGE_SIZE);
  const hasMore = displayTracks.length < tracks.length;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Feed</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Discover tracks. Performance shown; algorithm details are not exposed.
      </p>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-white/5 pb-4">
        {DISCOVERY_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[var(--purple-mid)]/40 text-[var(--neon-green)]"
                : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayTracks.map((track) => (
          <FeedCard
            key={track.id}
            track={track}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

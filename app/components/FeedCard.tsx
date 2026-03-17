"use client";

import { useState } from "react";
import Link from "next/link";
import MicBadge from "./MicBadge";
import UserBadge from "./UserBadge";
import { RATING_LISTENING_THRESHOLD_PLACEHOLDER } from "../lib/constants";
import type { FeedTrack, MicTierId } from "../lib/types";

interface FeedCardProps {
  track: FeedTrack;
  currentUserId: string | null;
  onRate?: (trackId: string, value: number) => void;
  onSave?: (trackId: string) => void;
  onLike?: (trackId: string) => void;
}

export default function FeedCard({
  track,
  currentUserId,
  onRate,
  onSave,
  onLike,
}: FeedCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [saved, setSaved] = useState(track.saved);
  const [likes, setLikes] = useState(track.likes);
  const isOwnTrack = currentUserId === track.creatorId;
  /** Users cannot rate their own track. Listening threshold (e.g. 50% of track) enforced later. */
  const canRate = !isOwnTrack;
  const listeningThresholdNote = `Listen ${Math.round(RATING_LISTENING_THRESHOLD_PLACEHOLDER * 100)}% to rate (enforced later)`;

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(track.id);
  };

  const handleLike = () => {
    setLikes((n) => n + 1);
    onLike?.(track.id);
  };

  const handleRate = (value: number) => {
    if (!canRate) return;
    setUserRating(value);
    onRate?.(track.id, value);
  };

  return (
    <article className="glass-panel glass-panel--status rounded-xl overflow-hidden transition-all hover:shadow-[var(--glass-shadow-status)]">
      {/* Audio preview area */}
      <div className="relative aspect-video bg-gradient-to-br from-[var(--deep-purple)] to-[var(--purple-mid)]/80 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-[var(--neon-green)]"
        >
          {isPlaying ? "‖" : "▶"}
        </button>
        <span className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs text-[var(--muted)]">
          Preview
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white">{track.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
          <Link
            href={`/creator/${track.creatorSlug}`}
            className="text-[var(--purple-glow)] hover:underline"
          >
            {track.creatorName}
          </Link>
          <UserBadge userId={track.creatorId} micTier={track.micTier} />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MicBadge tier={track.micTier as MicTierId} size="sm" />
          <span className="text-xs text-[var(--muted)]">{track.plays.toLocaleString()} plays</span>
          <span className="text-xs text-[var(--muted)]">★ {track.weightedRating.toFixed(1)} ({track.totalRatings})</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
          <span>{track.likes} likes</span>
          <span>{track.commentsCount} comments</span>
          <span className="rounded bg-white/5 px-1.5 py-0.5">{track.engagementIndicator}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canRate && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleRate(v)}
                  className={`rounded p-0.5 text-sm ${userRating !== null && v <= userRating ? "text-amber-400" : "text-[var(--muted)] hover:text-amber-400"}`}
                >
                  ★
                </button>
              ))}
            </div>
          )}
          {isOwnTrack && (
            <span className="text-xs text-[var(--muted)]">Your track — rating disabled</span>
          )}
          <button
            type="button"
            onClick={handleLike}
            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
          >
            ♥ {likes}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`rounded border px-2 py-1 text-xs ${saved ? "border-[var(--neon-green)]/40 bg-[var(--neon-green)]/10 text-[var(--neon-green)]" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
        {canRate && (
          <p className="mt-2 text-xs text-[var(--muted)]">{listeningThresholdNote}</p>
        )}
      </div>
    </article>
  );
}

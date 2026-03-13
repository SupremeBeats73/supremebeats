"use client";

import { useState } from "react";
import MicBadge from "./MicBadge";
import type { DiscoveryTrack } from "../lib/discoveryFeed";
import type { MicTierId } from "../lib/types";

const DEFAULT_ARTWORK =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop";

interface SupremeCardProps {
  track: DiscoveryTrack;
  isPlaying: boolean;
  onPlay: (track: DiscoveryTrack) => void;
  onLike?: (track: DiscoveryTrack) => void;
  onComment?: (track: DiscoveryTrack) => void;
  onShare?: (track: DiscoveryTrack) => void;
}

export default function SupremeCard({
  track,
  isPlaying,
  onPlay,
  onLike,
  onComment,
  onShare,
}: SupremeCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(track.likes);
  const artwork = track.artworkUrl || DEFAULT_ARTWORK;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => !prev);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    onLike?.(track);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.(track);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share && track.audioUrl) {
      navigator.share({
        title: track.title,
        text: `Listen to ${track.title} by ${track.creatorName}`,
        url: window.location.href,
      }).catch(() => {});
    }
    onShare?.(track);
  };

  return (
    <article className="group relative overflow-hidden rounded-xl border border-[#2e1065]/60 bg-black/60 backdrop-blur-md transition-all duration-300 hover:border-[var(--purple-glow)]/40 hover:shadow-[0_0_32px_rgba(124,58,237,0.2)]">
      {/* Artwork with hover zoom */}
      <div className="relative aspect-square overflow-hidden bg-[#0f0a1a]">
        <img
          src={artwork}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        {/* Play button overlay */}
        <button
          type="button"
          onClick={() => onPlay(track)}
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/30 bg-black/50 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:border-[var(--neon-green)] hover:bg-[var(--neon-green)] hover:text-black hover:shadow-[0_0_24px_rgba(34,197,94,0.5)]"
        >
          {isPlaying ? (
            <span className="text-xl font-bold">‖</span>
          ) : (
            <span className="ml-0.5 text-xl font-bold">▶</span>
          )}
        </button>
      </div>

      <div className="p-4">
        <h3 className="truncate font-semibold text-white">{track.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--muted)]">{track.creatorName}</span>
          <MicBadge tier={track.micTier as MicTierId} size="sm" />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              liked
                ? "border-red-500/50 bg-red-500/20 text-red-400"
                : "border-white/10 bg-white/5 text-[var(--muted)] hover:border-white/20 hover:text-white"
            }`}
          >
            <span>♥</span>
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            onClick={handleComment}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-white/20 hover:text-white"
          >
            <span>💬</span>
            <span>{track.commentsCount}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-[var(--muted)] transition-colors hover:border-white/20 hover:text-white"
            title="Share"
          >
            ↗
          </button>
        </div>
      </div>
    </article>
  );
}

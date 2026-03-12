"use client";

import { useState } from "react";
import type { VisualVideoStyle } from "../lib/types";

const VIDEO_STYLES: { id: VisualVideoStyle; label: string }[] = [
  { id: "youtube_16_9", label: "16:9 YouTube" },
  { id: "anime_loop", label: "Anime loop" },
  { id: "abstract_motion", label: "Abstract motion" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "ambient_minimalist", label: "Ambient minimalist" },
  { id: "cinematic_nature", label: "Cinematic nature" },
];

interface VisualEngineSectionProps {
  projectId: string;
  onGenerateVideo: (style: VisualVideoStyle) => Promise<void>;
  onGenerateThumbnail: (overlayText: string) => Promise<void>;
  onGenerateCoverArt: (overlayText: string) => Promise<void>;
  videoGenerating?: boolean;
  thumbnailGenerating?: boolean;
  coverGenerating?: boolean;
}

export default function VisualEngineSection({
  projectId,
  onGenerateVideo,
  onGenerateThumbnail,
  onGenerateCoverArt,
  videoGenerating = false,
  thumbnailGenerating = false,
  coverGenerating = false,
}: VisualEngineSectionProps) {
  const [selectedStyle, setSelectedStyle] = useState<VisualVideoStyle>("youtube_16_9");
  const [thumbnailText, setThumbnailText] = useState("");
  const [coverText, setCoverText] = useState("");

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
        Visual Engine
      </h2>
      <p className="mb-6 text-xs text-[var(--muted)]">
        YouTube-optimized video, thumbnails, and cover art. Editable text overlays.
      </p>

      {/* Video style + generate */}
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium text-[var(--muted)]">Video style</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {VIDEO_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => setSelectedStyle(style.id)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                selectedStyle === style.id
                  ? "border-[var(--neon-green)]/50 bg-[var(--neon-green)]/10 text-[var(--neon-green)]"
                  : "border-white/10 bg-white/5 text-[var(--muted)] hover:border-white/20 hover:text-white"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onGenerateVideo(selectedStyle)}
            disabled={videoGenerating}
            className="rounded-xl bg-[var(--purple-glow)]/80 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[var(--purple-glow)] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-60"
          >
            {videoGenerating ? "Generating video…" : "Generate video"}
          </button>
          <span className="text-xs text-[var(--muted)]">16:9 optimized</span>
        </div>
      </div>

      {/* Thumbnail: preview with editable text overlay + generate */}
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium text-[var(--muted)]">Thumbnail (text overlay)</p>
        <div className="flex flex-wrap gap-6">
          <div className="w-full sm:w-72">
            <div className="aspect-video rounded-lg border border-white/10 bg-gradient-to-br from-[var(--deep-purple)] to-[var(--purple-mid)] overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <span className="text-center text-lg font-bold text-white drop-shadow-lg">
                  {thumbnailText || "Your title"}
                </span>
              </div>
            </div>
            <input
              type="text"
              value={thumbnailText}
              onChange={(e) => setThumbnailText(e.target.value)}
              placeholder="Overlay text"
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onGenerateThumbnail(thumbnailText || "Thumbnail")}
              disabled={thumbnailGenerating}
              className="mt-2 w-full rounded-lg bg-[var(--neon-green)]/20 px-3 py-2 text-sm font-medium text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)]/30 disabled:opacity-60"
            >
              {thumbnailGenerating ? "Generating…" : "Generate thumbnail"}
            </button>
          </div>
        </div>
      </div>

      {/* Cover art: square preview with editable text overlay + generate */}
      <div>
        <p className="mb-3 text-xs font-medium text-[var(--muted)]">Cover art (text overlay)</p>
        <div className="flex flex-wrap gap-6">
          <div className="w-full sm:w-56">
            <div className="aspect-square rounded-lg border border-white/10 bg-gradient-to-br from-[var(--purple-mid)] to-[var(--deep-purple)] overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <span className="text-center text-base font-bold text-white drop-shadow-lg">
                  {coverText || "Album"}
                </span>
              </div>
            </div>
            <input
              type="text"
              value={coverText}
              onChange={(e) => setCoverText(e.target.value)}
              placeholder="Overlay text"
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onGenerateCoverArt(coverText || "Cover")}
              disabled={coverGenerating}
              className="mt-2 w-full rounded-lg bg-[var(--neon-green)]/20 px-3 py-2 text-sm font-medium text-[var(--neon-green)] transition-colors hover:bg-[var(--neon-green)]/30 disabled:opacity-60"
            >
              {coverGenerating ? "Generating…" : "Generate cover art"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

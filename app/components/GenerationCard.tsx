"use client";

import { useMemo, useRef, useState } from "react";
import { useProjects } from "../context/ProjectsContext";
import type { ProjectAssetKind, AssetStatus } from "../lib/types";

interface GenerationCardProps {
  title: string;
  description: string;
  icon: string;
  onGenerate: () => Promise<void>;
  disabled?: boolean;
  /** For showing latest completed result preview */
  projectId?: string | null;
  kind?: ProjectAssetKind;
}

export default function GenerationCard({
  title,
  description,
  icon,
  onGenerate,
  disabled,
  projectId,
  kind,
}: GenerationCardProps) {
  const [status, setStatus] = useState<AssetStatus | "idle">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { getAssets } = useProjects();

  const handleClick = async () => {
    if (status === "processing" || disabled) return;
    setStatus("processing");
    setError(null);
    try {
      await onGenerate();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setStatus("failure");
      setTimeout(() => {
        setStatus("idle");
        setError(null);
      }, 4000);
    }
  };

  const isProcessing = status === "processing";
  const isSuccess = status === "success";
  const isFailure = status === "failure";

  const latestResultUrl = useMemo(() => {
    if (!projectId || !kind) return null;
    const assets = getAssets(projectId);
    const match = assets.find(
      (a) => a.kind === kind && a.status === "success" && a.url,
    );
    return match?.url ?? null;
  }, [getAssets, projectId, kind]);

  const isImage =
    latestResultUrl &&
    /\.(png|jpe?g|gif|webp|avif)$/i.test(new URL(latestResultUrl).pathname);
  const isAudio =
    latestResultUrl &&
    /\.(mp3|wav|ogg|m4a|flac)$/i.test(new URL(latestResultUrl).pathname);

  const handleTogglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      void el.play();
      setIsPlaying(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`group flex flex-col rounded-xl border text-left transition-all duration-300 ${
        isSuccess
          ? "border-[var(--neon-green)]/50 bg-[var(--neon-green)]/5 shadow-[0_0_32px_rgba(34,197,94,0.35)]"
          : isFailure
            ? "border-red-500/40 bg-red-500/10 shadow-[0_0_28px_rgba(248,113,113,0.35)]"
            : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--purple-glow)]/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.35)]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""} ${
        isProcessing ? "cursor-wait" : ""
      }`}
    >
      <div className="flex-1 p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-2xl opacity-90">{icon}</span>
          <h3 className="font-bold text-white">{title}</h3>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-[var(--muted)]">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            {isProcessing && "Processing…"}
            {isSuccess && "Completed"}
            {isFailure && "Failed"}
            {status === "idle" && "Generate"}
          </span>
          {isProcessing && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--neon-green)]" />
          )}
          {isSuccess && (
            <span className="text-[var(--neon-green)] drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">
              ✓
            </span>
          )}
          {isFailure && <span className="text-red-400">✕</span>}
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        {isSuccess && latestResultUrl && (isImage || isAudio) && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3 shadow-[0_0_22px_rgba(15,23,42,0.9)] transition-colors group-hover:border-[var(--neon-green)]/40 group-hover:bg-black/60">
            {isImage && (
              <div className="overflow-hidden rounded-md border border-white/5">
                <img
                  src={latestResultUrl}
                  alt={`${title} result`}
                  className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
            )}
            {isAudio && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePlay();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--neon-green)] text-sm font-semibold text-black shadow-[0_0_18px_rgba(34,197,94,0.6)] transition-transform hover:scale-105"
                >
                  {isPlaying ? "‖" : "▶"}
                </button>
                <div className="flex-1">
                  <div className="mb-1 h-10 rounded-md bg-gradient-to-r from-[var(--deep-purple)]/60 via-[var(--neon-green)]/40 to-[var(--deep-purple)]/60 px-2 py-1">
                    <div className="flex h-full items-end justify-between gap-0.5">
                      {Array.from({ length: 42 }).map((_, i) => (
                        <div
                          // eslint-disable-next-line react/no-array-index-key
                          key={i}
                          className="flex-1 rounded-sm bg-[var(--neon-green)]/40 opacity-80"
                          style={{
                            height: `${30 + Math.sin(i * 0.7) * 18 + Math.cos(i * 0.33) * 10}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    Preview render
                  </p>
                </div>
                <audio
                  ref={audioRef}
                  src={latestResultUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}
        {isSuccess && latestResultUrl && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                try {
                  window.open(latestResultUrl, "_blank");
                } catch {
                  // no-op
                }
              }}
              className="rounded-lg border border-[var(--neon-green)]/40 bg-black/60 px-3 py-1.5 text-[11px] font-medium text-[var(--neon-green)] shadow-[0_0_16px_rgba(34,197,94,0.4)] transition-colors hover:bg-[var(--neon-green)] hover:text-black"
            >
              Download
            </button>
          </div>
        )}
      </div>
    </button>
  );
}

"use client";

import { useState } from "react";
import type { ProjectAssetKind, AssetStatus } from "../lib/types";

interface GenerationCardProps {
  title: string;
  description: string;
  icon: string;
  onGenerate: () => Promise<void>;
  disabled?: boolean;
}

export default function GenerationCard({
  title,
  description,
  icon,
  onGenerate,
  disabled,
}: GenerationCardProps) {
  const [status, setStatus] = useState<AssetStatus | "idle">("idle");
  const [error, setError] = useState<string | null>(null);

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
      setTimeout(() => { setStatus("idle"); setError(null); }, 4000);
    }
  };

  const isProcessing = status === "processing";
  const isSuccess = status === "success";
  const isFailure = status === "failure";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`group rounded-xl border text-left transition-all duration-300 ${
        isSuccess
          ? "border-[var(--neon-green)]/50 bg-[var(--neon-green)]/10"
          : isFailure
            ? "border-red-500/40 bg-red-500/10"
            : "border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--purple-glow)]/30 hover:shadow-[0_0_24px_rgba(124,58,237,0.1)]"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${isProcessing ? "cursor-wait" : ""}`}
    >
      <div className="p-5">
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
            {isSuccess && "Done"}
            {isFailure && "Failed"}
            {status === "idle" && "Generate"}
          </span>
          {isProcessing && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--neon-green)]" />
          )}
          {isSuccess && (
            <span className="text-[var(--neon-green)]">✓</span>
          )}
          {isFailure && (
            <span className="text-red-400">✕</span>
          )}
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </div>
    </button>
  );
}

"use client";

import { useState, useCallback } from "react";
import type { YouTubePackageData } from "../lib/types";

interface YouTubePackagingPanelProps {
  projectId: string;
  projectName: string;
  data: YouTubePackageData | undefined;
  onGenerate: () => Promise<void>;
  generating: boolean;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="rounded-lg border border-[var(--purple-glow)]/30 bg-[#0f0a1a]/80 px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[var(--neon-green)]/50 hover:shadow-[0_0_12px_rgba(34,197,94,0.25)]"
    >
      {copied ? "Copied" : "One-Click Copy"}
    </button>
  );
}

function ReadinessScoreVisual({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-[var(--muted)]">
          SEO Optimized
        </span>
        <span className="font-semibold text-white">{score}/100</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full border border-white/10 bg-[#0f0a1a]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--neon-green)] transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            boxShadow: "0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.3)",
          }}
        />
      </div>
    </div>
  );
}

export default function YouTubePackagingPanel({
  projectId,
  projectName,
  data,
  onGenerate,
  generating,
}: YouTubePackagingPanelProps) {
  void projectId;
  if (!data) {
    return (
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[0_0_28px_rgba(124,58,237,0.12)] backdrop-blur-sm">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          YouTube packaging
        </h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Generate an SEO-optimized title, description, tags, and hashtags for &quot;{projectName}&quot;.
        </p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)] disabled:opacity-60"
        >
          {generating ? "Generating…" : "Generate YouTube Strategy"}
        </button>
      </div>
    );
  }

  const tagsText = data.tags.join(", ");
  const hashtagsText = data.hashtags.join(" ");

  const textAreaBase =
    "rounded-lg border border-white/10 bg-[#0f0a1a] px-3 py-2.5 text-sm text-white placeholder-[var(--muted)] focus:border-[var(--purple-glow)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--purple-glow)]/30 transition-colors";

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[0_0_28px_rgba(124,58,237,0.12)] backdrop-blur-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          YouTube packaging
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            className="text-xs text-[var(--muted)] hover:text-white disabled:opacity-60"
          >
            {generating ? "Regenerating…" : "Regenerate"}
          </button>
        </div>
      </div>

      {/* Readiness Score visual */}
      <div className="mb-6 rounded-lg border border-[var(--purple-glow)]/20 bg-black/30 p-4">
        <ReadinessScoreVisual score={data.readinessScore} />
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">SEO title</label>
            <CopyButton text={data.title} label="title" />
          </div>
          <p className={`${textAreaBase} min-h-[2.5rem]`}>{data.title}</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">Description</label>
            <CopyButton text={data.description} label="description" />
          </div>
          <pre
            className={`max-h-36 overflow-auto whitespace-pre-wrap font-sans ${textAreaBase}`}
          >
            {data.description}
          </pre>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">Tags</label>
            <CopyButton text={tagsText} label="tags" />
          </div>
          <p className={textAreaBase}>{tagsText}</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">Hashtags</label>
            <CopyButton text={hashtagsText} label="hashtags" />
          </div>
          <p className={textAreaBase}>{hashtagsText}</p>
        </div>
      </div>
    </div>
  );
}

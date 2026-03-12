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
      className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--neon-green)]/20 hover:border-[var(--neon-green)]/40"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function YouTubePackagingPanel({
  projectId,
  projectName,
  data,
  onGenerate,
  generating,
}: YouTubePackagingPanelProps) {
  if (!data) {
    return (
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
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
          {generating ? "Generating…" : "Generate packaging"}
        </button>
      </div>
    );
  }

  const tagsText = data.tags.join(", ");
  const hashtagsText = data.hashtags.join(" ");

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          YouTube packaging
        </h2>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              data.readinessScore >= 80
                ? "bg-[var(--neon-green)]/20 text-[var(--neon-green)]"
                : data.readinessScore >= 60
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-[var(--muted)]/20 text-[var(--muted)]"
            }`}
          >
            Readiness: {data.readinessScore}/100
          </span>
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

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">SEO title</label>
            <CopyButton text={data.title} label="title" />
          </div>
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
            {data.title}
          </p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">Description</label>
            <CopyButton text={data.description} label="description" />
          </div>
          <pre className="max-h-32 overflow-auto rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white whitespace-pre-wrap font-sans">
            {data.description}
          </pre>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">Tags</label>
            <CopyButton text={tagsText} label="tags" />
          </div>
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
            {tagsText}
          </p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--muted)]">Hashtags</label>
            <CopyButton text={hashtagsText} label="hashtags" />
          </div>
          <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
            {hashtagsText}
          </p>
        </div>
      </div>
    </div>
  );
}

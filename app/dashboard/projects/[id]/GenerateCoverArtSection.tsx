"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CoverArtAsset = {
  id: string;
  url: string | null;
  status: string;
  label?: string;
};

export default function GenerateCoverArtSection({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ asset: CoverArtAsset; url: string | null } | null>(null);

  const handleGenerate = async () => {
    if (loading) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate/cover-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to generate cover art");
        return;
      }
      setResult({ asset: data.asset, url: data.url ?? data.asset?.url ?? null });
      router.refresh();
    } catch (e) {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  };

  const displayUrl = result?.url ?? result?.asset?.url ?? null;

  return (
    <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 backdrop-blur-sm">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        Cover art
      </h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="shrink-0 rounded-lg border border-[var(--purple-mid)] bg-black/40 px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--neon-green)] hover:text-[var(--neon-green)] disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate Cover Art"}
        </button>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {displayUrl && result && (
          <div className="min-w-0">
            <p className="mb-2 text-xs text-[var(--muted)]">Generated cover</p>
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-white/10 bg-white/5"
            >
              <img
                src={displayUrl}
                alt={result.asset?.label ?? "Cover art"}
                className="h-32 w-32 object-cover sm:h-40 sm:w-40"
              />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

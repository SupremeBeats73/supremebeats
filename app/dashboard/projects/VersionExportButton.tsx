"use client";

import { useState } from "react";

function sanitizeFileBase(name: string): string {
  const s = name.replace(/[^\w\s\-]/g, "").trim().replace(/\s+/g, "_");
  return s.slice(0, 100) || "SupremeBeats_version";
}

type VersionExportButtonProps = {
  versionId: string;
  /** Base filename without extension (e.g. project + version label). */
  fileBaseName?: string;
};

export default function VersionExportButton({
  versionId,
  fileBaseName,
}: VersionExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/export/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        console.error("[VersionExportButton] export failed", data?.error);
        return;
      }
      const url = data.url as string;
      const base = sanitizeFileBase(fileBaseName ?? "SupremeBeats_version");
      try {
        const audioRes = await fetch(url);
        if (!audioRes.ok) throw new Error("bad response");
        const blob = await audioRes.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `${base}.mp3`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      } catch {
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base}.mp3`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border-2 border-[var(--neon-green)] bg-transparent px-2.5 py-1 text-xs font-semibold text-[var(--neon-green)] shadow-[0_0_10px_rgba(34,197,94,0.25)] transition hover:bg-[var(--neon-green)]/10 disabled:opacity-60"
    >
      {loading ? "Downloading…" : "Download"}
    </button>
  );
}


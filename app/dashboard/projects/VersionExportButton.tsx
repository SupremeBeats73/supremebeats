"use client";

import { useState } from "react";

export default function VersionExportButton({ versionId }: { versionId: string }) {
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
        // eslint-disable-next-line no-console
        console.error("[VersionExportButton] export failed", data?.error);
        return;
      }
      const url = data.url as string;
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-[var(--purple-mid)] bg-black/40 px-2.5 py-1 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--neon-green)] hover:text-[var(--neon-green)] disabled:opacity-60"
    >
      {loading ? "Exporting…" : "Export"}
    </button>
  );
}


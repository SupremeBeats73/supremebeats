"use client";

import { useState } from "react";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import { logAdminAction } from "../../lib/adminActions";
import { useAuth } from "../../context/AuthContext";

const MOCK_TRACKS = [
  { id: "t1", title: "Midnight Drive", creatorId: "c1", status: "visible", featured: false, pinned: false },
  { id: "t2", title: "Neon Pulse", creatorId: "c2", status: "visible", featured: false, pinned: false },
];

export default function AdminTracksPage() {
  const { user: adminUser } = useAuth();
  const [tracks, setTracks] = useState(MOCK_TRACKS);
  const [confirm, setConfirm] = useState<{ trackId: string; action: "hide" | "remove" } | null>(null);

  const handleHide = (trackId: string) => {
    setConfirm({ trackId, action: "hide" });
  };
  const handleRemove = (trackId: string) => {
    setConfirm({ trackId, action: "remove" });
  };

  const onConfirm = () => {
    if (!confirm || !adminUser) return;
    logAdminAction({
      action: confirm.action === "hide" ? "track_hide" : "track_remove",
      adminId: adminUser.id,
      targetId: confirm.trackId,
    });
    if (confirm.action === "remove") {
      setTracks((prev) => prev.filter((t) => t.id !== confirm.trackId));
    } else {
      setTracks((prev) =>
        prev.map((t) => (t.id === confirm.trackId ? { ...t, status: "hidden" as const } : t))
      );
    }
    setConfirm(null);
  };

  const toggleFeature = (trackId: string) => {
    if (!adminUser) return;
    const t = tracks.find((x) => x.id === trackId);
    const next = !t?.featured;
    logAdminAction({
      action: next ? "track_feature" : "track_unfeature",
      adminId: adminUser.id,
      targetId: trackId,
    });
    setTracks((prev) =>
      prev.map((x) => (x.id === trackId ? { ...x, featured: next } : x))
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Tracks</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">Hide, remove, or feature tracks.</p>

      <div className="space-y-3">
        {tracks.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
          >
            <div>
              <p className="font-medium text-white">{t.title}</p>
              <p className="text-xs text-[var(--muted)]">{t.id} · {t.status}{t.featured ? " · Featured" : ""}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleFeature(t.id)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/5"
              >
                {t.featured ? "Unfeature" : "Feature"}
              </button>
              {t.status === "visible" && (
                <button
                  type="button"
                  onClick={() => handleHide(t.id)}
                  className="rounded-lg border border-amber-500/50 px-3 py-1.5 text-sm text-amber-400 hover:bg-amber-500/10"
                >
                  Hide
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(t.id)}
                className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmActionModal
        open={!!confirm}
        title={confirm?.action === "remove" ? "Remove track" : "Hide track"}
        message={
          confirm?.action === "remove"
            ? "Permanently remove this track? This cannot be undone."
            : "Hide this track from discovery and feed? It can be unhidden later."
        }
        confirmLabel={confirm?.action === "remove" ? "Remove" : "Hide"}
        variant="danger"
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

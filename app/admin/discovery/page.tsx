"use client";

import { useState } from "react";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import { logAdminAction } from "../../lib/adminActions";
import { useAuth } from "../../context/AuthContext";

const MOCK_HOMEPAGE_TRACKS = [
  { id: "t1", title: "Midnight Drive", pinned: false },
  { id: "t2", title: "Neon Pulse", pinned: true },
];

export default function AdminDiscoveryPage() {
  const { user: adminUser } = useAuth();
  const [tracks, setTracks] = useState(MOCK_HOMEPAGE_TRACKS);
  const [rankingFrozen, setRankingFrozen] = useState(false);
  const [confirmFreeze, setConfirmFreeze] = useState<boolean | null>(null);

  const togglePin = (trackId: string) => {
    if (!adminUser) return;
    const t = tracks.find((x) => x.id === trackId);
    const next = !t?.pinned;
    logAdminAction({
      action: next ? "homepage_pin" : "homepage_unpin",
      adminId: adminUser.id,
      targetId: trackId,
    });
    setTracks((prev) =>
      prev.map((x) => (x.id === trackId ? { ...x, pinned: next } : x))
    );
  };

  const handleToggleRankingFreeze = () => {
    setConfirmFreeze(!rankingFrozen);
  };

  const onConfirmFreeze = () => {
    if (!adminUser || confirmFreeze === null) return;
    logAdminAction({
      action: confirmFreeze ? "ranking_freeze" : "ranking_unfreeze",
      adminId: adminUser.id,
    });
    setRankingFrozen(confirmFreeze);
    setConfirmFreeze(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Discovery</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Pin homepage tracks, freeze ranking eligibility. Ranking math is private.
      </p>

      <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
        <h2 className="text-sm font-medium text-white">Ranking eligibility</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Freeze: new activity will not affect discovery ranking until unfrozen.
        </p>
        <p className="mt-2 text-sm text-white">Status: {rankingFrozen ? "Frozen" : "Active"}</p>
        <button
          type="button"
          onClick={handleToggleRankingFreeze}
          className="mt-3 rounded-lg border border-amber-500/50 px-3 py-1.5 text-sm text-amber-400 hover:bg-amber-500/10"
        >
          {rankingFrozen ? "Unfreeze ranking" : "Freeze ranking"}
        </button>
      </div>

      <h2 className="mb-4 text-sm font-medium text-[var(--muted)]">Homepage tracks</h2>
      <div className="space-y-3">
        {tracks.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
          >
            <p className="font-medium text-white">{t.title}</p>
            <button
              type="button"
              onClick={() => togglePin(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm ${t.pinned ? "bg-[var(--neon-green)]/20 text-[var(--neon-green)]" : "border border-white/20 text-white hover:bg-white/5"}`}
            >
              {t.pinned ? "Unpin" : "Pin to homepage"}
            </button>
          </div>
        ))}
      </div>

      <ConfirmActionModal
        open={confirmFreeze !== null}
        title={confirmFreeze ? "Freeze ranking" : "Unfreeze ranking"}
        message={
          confirmFreeze
            ? "Discovery ranking will be frozen. New plays/ratings will not update positions until unfrozen. Continue?"
            : "Discovery ranking will resume updating. Continue?"
        }
        variant="warning"
        onConfirm={onConfirmFreeze}
        onCancel={() => setConfirmFreeze(null)}
      />
    </div>
  );
}

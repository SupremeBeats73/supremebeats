"use client";

import { useState } from "react";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import { logAdminAction } from "../../lib/adminActions";
import { useAuth } from "../../context/AuthContext";

const MOCK_USERS_TRUST = [
  { id: "u1", email: "creator1@example.com", trustScore: 0.85 },
  { id: "u2", email: "creator2@example.com", trustScore: 0.62 },
];

export default function AdminTrustAbusePage() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState(MOCK_USERS_TRUST);
  const [adjustingUser, setAdjustingUser] = useState<{ id: string; value: number } | null>(null);
  const [confirmEngagement, setConfirmEngagement] = useState<string | null>(null);

  const openAdjust = (id: string, current: number) => {
    setAdjustingUser({ id, value: current });
  };

  const applyTrustAdjust = () => {
    if (!adminUser || !adjustingUser) return;
    logAdminAction({
      action: "trust_adjust",
      adminId: adminUser.id,
      targetId: adjustingUser.id,
      payload: { trustScore: adjustingUser.value },
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === adjustingUser.id ? { ...u, trustScore: adjustingUser.value } : u))
    );
    setAdjustingUser(null);
  };

  const removeSuspiciousEngagement = (userId: string) => {
    setConfirmEngagement(userId);
  };

  const onConfirmRemoveEngagement = () => {
    if (!confirmEngagement || !adminUser) return;
    logAdminAction({
      action: "engagement_remove",
      adminId: adminUser.id,
      targetId: confirmEngagement,
    });
    setConfirmEngagement(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Trust & Abuse</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Manually adjust trust score, remove suspicious engagement. Internal formulas not exposed.
      </p>

      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
          >
            <div>
              <p className="font-medium text-white">{u.email}</p>
              <p className="text-xs text-[var(--muted)]">Trust: {(u.trustScore * 100).toFixed(0)}% (internal)</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openAdjust(u.id, u.trustScore)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/5"
              >
                Adjust trust
              </button>
              <button
                type="button"
                onClick={() => removeSuspiciousEngagement(u.id)}
                className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
              >
                Remove suspicious engagement
              </button>
            </div>
          </div>
        ))}
      </div>

      {adjustingUser && (
        <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <p className="text-sm text-white">Set trust score (0–1)</p>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={adjustingUser.value}
            onChange={(e) => setAdjustingUser((a) => a ? { ...a, value: Number(e.target.value) } : null)}
            className="mt-2 w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={applyTrustAdjust}
              className="rounded-lg bg-[var(--neon-green)] px-3 py-1.5 text-sm text-black"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setAdjustingUser(null)}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ConfirmActionModal
        open={!!confirmEngagement}
        title="Remove suspicious engagement"
        message="Strip flagged plays, likes, or ratings for this user. This may affect their visibility. Continue?"
        variant="danger"
        onConfirm={onConfirmRemoveEngagement}
        onCancel={() => setConfirmEngagement(null)}
      />
    </div>
  );
}

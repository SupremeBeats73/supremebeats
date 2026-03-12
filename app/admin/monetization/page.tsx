"use client";

import { useState } from "react";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import { logAdminAction } from "../../lib/adminActions";
import { useAuth } from "../../context/AuthContext";

const MOCK_USERS_MONETIZATION = [
  { id: "u1", email: "creator1@example.com", monetizationEnabled: true },
];

export default function AdminMonetizationPage() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState(MOCK_USERS_MONETIZATION);
  const [platformFee, setPlatformFee] = useState(5);
  const [creditLimit, setCreditLimit] = useState(1500);
  const [publishLimit, setPublishLimit] = useState(10);
  const [confirmSuspend, setConfirmSuspend] = useState<string | null>(null);
  const [confirmFee, setConfirmFee] = useState(false);
  const [confirmCredits, setConfirmCredits] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const handleSuspendMonetization = (userId: string) => {
    setConfirmSuspend(userId);
  };

  const onConfirmSuspend = () => {
    if (!confirmSuspend || !adminUser) return;
    logAdminAction({
      action: "monetization_suspend",
      adminId: adminUser.id,
      targetId: confirmSuspend,
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === confirmSuspend ? { ...u, monetizationEnabled: false } : u))
    );
    setConfirmSuspend(null);
  };

  const applyPlatformFee = () => {
    if (!adminUser) return;
    logAdminAction({
      action: "platform_fee_adjust",
      adminId: adminUser.id,
      payload: { platformFee },
    });
    setConfirmFee(false);
  };

  const applyCreditLimit = () => {
    if (!adminUser) return;
    logAdminAction({
      action: "credit_limit_adjust",
      adminId: adminUser.id,
      payload: { creditLimit },
    });
    setConfirmCredits(false);
  };

  const applyPublishLimit = () => {
    if (!adminUser) return;
    logAdminAction({
      action: "publish_limit_adjust",
      adminId: adminUser.id,
      payload: { publishLimit },
    });
    setConfirmPublish(false);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Monetization</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Suspend creator monetization, adjust platform fee and limits.
      </p>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-[var(--muted)]">Suspend monetization</h2>
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
            >
              <p className="font-medium text-white">{u.email}</p>
              {u.monetizationEnabled && (
                <button
                  type="button"
                  onClick={() => handleSuspendMonetization(u.id)}
                  className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
                >
                  Suspend monetization
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-[var(--muted)]">Platform fee (%)</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <input
            type="number"
            min={0}
            max={50}
            value={platformFee}
            onChange={(e) => setPlatformFee(Number(e.target.value))}
            className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
          />
          <button
            type="button"
            onClick={() => setConfirmFee(true)}
            className="rounded-lg bg-[var(--neon-green)] px-3 py-1.5 text-sm font-medium text-black"
          >
            Apply
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-[var(--muted)]">Daily credit limit</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <input
            type="number"
            min={0}
            value={creditLimit}
            onChange={(e) => setCreditLimit(Number(e.target.value))}
            className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
          />
          <button
            type="button"
            onClick={() => setConfirmCredits(true)}
            className="rounded-lg bg-[var(--neon-green)] px-3 py-1.5 text-sm font-medium text-black"
          >
            Apply
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-[var(--muted)]">Publish limit (per period)</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <input
            type="number"
            min={0}
            value={publishLimit}
            onChange={(e) => setPublishLimit(Number(e.target.value))}
            className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
          />
          <button
            type="button"
            onClick={() => setConfirmPublish(true)}
            className="rounded-lg bg-[var(--neon-green)] px-3 py-1.5 text-sm font-medium text-black"
          >
            Apply
          </button>
        </div>
      </section>

      <ConfirmActionModal
        open={!!confirmSuspend}
        title="Suspend monetization"
        message="This user will not be able to earn or receive payouts until reinstated. Continue?"
        variant="danger"
        onConfirm={onConfirmSuspend}
        onCancel={() => setConfirmSuspend(null)}
      />
      <ConfirmActionModal
        open={confirmFee}
        title="Update platform fee"
        message={`Set platform fee to ${platformFee}%?`}
        variant="warning"
        onConfirm={applyPlatformFee}
        onCancel={() => setConfirmFee(false)}
      />
      <ConfirmActionModal
        open={confirmCredits}
        title="Update credit limit"
        message={`Set daily credit limit to ${creditLimit}?`}
        variant="warning"
        onConfirm={applyCreditLimit}
        onCancel={() => setConfirmCredits(false)}
      />
      <ConfirmActionModal
        open={confirmPublish}
        title="Update publish limit"
        message={`Set publish limit to ${publishLimit}?`}
        variant="warning"
        onConfirm={applyPublishLimit}
        onCancel={() => setConfirmPublish(false)}
      />
    </div>
  );
}

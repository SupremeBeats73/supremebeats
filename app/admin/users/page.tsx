"use client";

import { useState } from "react";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import { logAdminAction } from "../../lib/adminActions";
import { useAuth } from "../../context/AuthContext";

const MOCK_USERS = [
  { id: "u1", email: "creator1@example.com", status: "active" },
  { id: "u2", email: "creator2@example.com", status: "active" },
];

export default function AdminUsersPage() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState(MOCK_USERS);
  const [confirm, setConfirm] = useState<{ userId: string; action: "suspend" } | null>(null);

  const handleSuspend = (userId: string) => {
    setConfirm({ userId, action: "suspend" });
  };

  const onConfirmSuspend = () => {
    if (!confirm || !adminUser) return;
    logAdminAction({
      action: "user_suspend",
      adminId: adminUser.id,
      targetId: confirm.userId,
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === confirm.userId ? { ...u, status: "suspended" as const } : u))
    );
    setConfirm(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Users</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">Review and suspend accounts.</p>

      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
          >
            <div>
              <p className="font-medium text-white">{u.email}</p>
              <p className="text-xs text-[var(--muted)]">{u.id} · {u.status}</p>
            </div>
            {u.status === "active" && (
              <button
                type="button"
                onClick={() => handleSuspend(u.id)}
                className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
              >
                Suspend
              </button>
            )}
          </div>
        ))}
      </div>

      <ConfirmActionModal
        open={!!confirm}
        title="Suspend user"
        message="This will suspend the user account. They will not be able to log in until unsuspended. Continue?"
        confirmLabel="Suspend"
        variant="danger"
        onConfirm={onConfirmSuspend}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

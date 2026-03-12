"use client";

import { useState } from "react";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import { logAdminAction } from "../../lib/adminActions";
import { useAuth } from "../../context/AuthContext";

const MOCK_REPORTS = [
  { id: "r1", type: "track", targetId: "t1", reason: "Spam", status: "pending" },
  { id: "r2", type: "user", targetId: "u2", reason: "Abuse", status: "pending" },
];

export default function AdminReportsPage() {
  const { user: adminUser } = useAuth();
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [confirmDismiss, setConfirmDismiss] = useState<string | null>(null);

  const handleReview = (reportId: string, action: "dismiss" | "uphold") => {
    if (!adminUser) return;
    logAdminAction({
      action: "report_review",
      adminId: adminUser.id,
      targetId: reportId,
      payload: { action },
    });
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: action } : r)));
    setConfirmDismiss(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Reports</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">Review flagged activity.</p>

      <div className="space-y-3">
        {reports.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{r.type} · {r.reason}</p>
                <p className="text-xs text-[var(--muted)]">ID: {r.targetId} · {r.status}</p>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDismiss(r.id)}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/5"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(r.id, "uphold")}
                    className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    Uphold
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmActionModal
        open={!!confirmDismiss}
        title="Dismiss report"
        message="Mark this report as reviewed and dismissed?"
        confirmLabel="Dismiss"
        variant="default"
        onConfirm={() => confirmDismiss && handleReview(confirmDismiss, "dismiss")}
        onCancel={() => setConfirmDismiss(null)}
      />
    </div>
  );
}

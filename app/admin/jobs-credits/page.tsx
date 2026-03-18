"use client";

import { useEffect, useState } from "react";

type GenerationJob = {
  id: string;
  user_id: string;
  project_id: string;
  job_type: string;
  provider: string;
  provider_job_id: string | null;
  status: string;
  error_message: string | null;
  input_json: unknown;
  output_json: unknown;
  created_at: string;
  updated_at: string;
};

type LedgerEntry = {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  job_id: string | null;
  stripe_session_id: string | null;
  created_at: string;
};

export default function AdminJobsCreditsPage() {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/jobs-credits", { credentials: "include" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data.error as string) || `HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setJobs(data.jobs ?? []);
          setLedger(data.ledger ?? []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (s: string) =>
    new Date(s).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-0">
        <h1 className="mb-2 text-xl font-bold text-white sm:text-2xl">
          Jobs & Credits
        </h1>
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-0">
        <h1 className="mb-2 text-xl font-bold text-white sm:text-2xl">
          Jobs & Credits
        </h1>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-0">
      <h1 className="mb-2 text-xl font-bold text-white sm:text-2xl">
        Jobs & Credits
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Generation jobs and credit ledger (joined by job_id). Last 200 of each.
      </p>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Generation jobs
        </h2>

        {/* Mobile list (stacked cards) */}
        <div className="sm:hidden">
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--muted)]">
              No jobs yet.
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-white" title={j.id}>
                        {j.id}
                      </p>
                      <p className="mt-1 text-sm text-white">{j.job_type}</p>
                    </div>
                    <span
                      className={
                        j.status === "success"
                          ? "text-emerald-400"
                          : j.status === "failed"
                            ? "text-red-400"
                            : "text-amber-400"
                      }
                    >
                      {j.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--muted)]">User</span>
                      <span className="font-mono text-[var(--muted)]">
                        {j.user_id.slice(0, 8)}…
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--muted)]">Project</span>
                      <span className="font-mono text-[var(--muted)]">
                        {j.project_id.slice(0, 8)}…
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--muted)]">Created</span>
                      <span className="text-[var(--muted)]">
                        {formatDate(j.created_at)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[var(--muted)]">Error</span>
                      <span
                        className="max-w-[70%] truncate text-right text-[var(--muted)]"
                        title={j.error_message ?? undefined}
                      >
                        {j.error_message ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] sm:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
                <th className="p-3 font-medium">Job ID</th>
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Project</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Error</th>
                <th className="p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-[var(--muted)]">
                    No jobs yet.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr
                    key={j.id}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="p-3 font-mono text-xs text-white">{j.id}</td>
                    <td className="p-3 font-mono text-xs text-[var(--muted)]">
                      {j.user_id.slice(0, 8)}…
                    </td>
                    <td className="p-3 font-mono text-xs text-[var(--muted)]">
                      {j.project_id.slice(0, 8)}…
                    </td>
                    <td className="p-3 text-white">{j.job_type}</td>
                    <td className="p-3">
                      <span
                        className={
                          j.status === "success"
                            ? "text-emerald-400"
                            : j.status === "failed"
                              ? "text-red-400"
                              : "text-amber-400"
                        }
                      >
                        {j.status}
                      </span>
                    </td>
                    <td
                      className="max-w-[160px] truncate p-3 text-[var(--muted)]"
                      title={j.error_message ?? undefined}
                    >
                      {j.error_message ?? "—"}
                    </td>
                    <td className="p-3 text-[var(--muted)]">
                      {formatDate(j.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Credit ledger
        </h2>

        {/* Mobile list (stacked cards) */}
        <div className="sm:hidden">
          {ledger.length === 0 ? (
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--muted)]">
              No ledger entries yet.
            </div>
          ) : (
            <div className="space-y-2">
              {ledger.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate font-mono text-xs text-[var(--muted)]"
                        title={e.id}
                      >
                        {e.id.slice(0, 16)}…
                      </p>
                      <p className="mt-1 text-sm text-white">{e.reason}</p>
                    </div>
                    <span className={e.delta < 0 ? "text-red-400" : "text-emerald-400"}>
                      {e.delta > 0 ? "+" : ""}
                      {e.delta}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--muted)]">User</span>
                      <span className="font-mono text-[var(--muted)]">
                        {e.user_id.slice(0, 8)}…
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--muted)]">Job</span>
                      <span className="font-mono text-[var(--muted)]" title={e.job_id ?? undefined}>
                        {e.job_id ? `${e.job_id.slice(0, 16)}…` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--muted)]">Created</span>
                      <span className="text-[var(--muted)]">
                        {formatDate(e.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] sm:block">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--muted)]">
                <th className="p-3 font-medium">ID</th>
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Delta</th>
                <th className="p-3 font-medium">Reason</th>
                <th className="p-3 font-medium">Job ID</th>
                <th className="p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-[var(--muted)]">
                    No ledger entries yet.
                  </td>
                </tr>
              ) : (
                ledger.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-[var(--card-border)] last:border-0"
                  >
                    <td className="p-3 font-mono text-xs text-[var(--muted)]">
                      {e.id.slice(0, 8)}…
                    </td>
                    <td className="p-3 font-mono text-xs text-[var(--muted)]">
                      {e.user_id.slice(0, 8)}…
                    </td>
                    <td className="p-3">
                      <span className={e.delta < 0 ? "text-red-400" : "text-emerald-400"}>
                        {e.delta > 0 ? "+" : ""}{e.delta}
                      </span>
                    </td>
                    <td className="p-3 text-white">{e.reason}</td>
                    <td className="p-3 font-mono text-xs text-[var(--muted)]">
                      {e.job_id ? (
                        <span title={e.job_id}>{e.job_id.slice(0, 16)}…</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-[var(--muted)]">{formatDate(e.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

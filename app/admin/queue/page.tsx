"use client";

import { useJobs } from "../../context/JobsContext";
import { JOB_LIMITS } from "../../lib/jobConfig";
import type { Job, JobStatus } from "../../lib/types";

export default function AdminQueuePage() {
  const { jobs, getJobs, retryJob, cancelJob, automationPaused, setAutomationPaused } = useJobs();
  const allJobs = getJobs();
  const active: Job[] = allJobs.filter((j) =>
    ["queued", "processing"].includes(j.status)
  );
  const failed: Job[] = allJobs.filter((j) => j.status === "failed");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-0">
      <h1 className="mb-2 text-xl font-bold text-white sm:text-2xl">
        Queue monitor
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Live queue view. Retry failed (max {JOB_LIMITS.maxRetries} retries), cancel stuck, pause automation.
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={automationPaused}
            onChange={(e) => setAutomationPaused(e.target.checked)}
            className="rounded border-white/20"
          />
          <span className="text-sm text-white">Pause automation globally</span>
        </label>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Active (queued / processing)
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No active jobs.</p>
        ) : (
          <div className="space-y-2">
            {active.map((j) => (
              <JobRow
                key={j.job_id}
                job={j}
                onCancel={() => cancelJob(j.job_id)}
                canRetry={false}
                onRetry={() => {}}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Failed
        </h2>
        {failed.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No failed jobs.</p>
        ) : (
          <div className="space-y-2">
            {failed.map((j) => (
              <JobRow
                key={j.job_id}
                job={j}
                onCancel={() => cancelJob(j.job_id)}
                canRetry={j.retry_count < JOB_LIMITS.maxRetries}
                onRetry={() => retryJob(j.job_id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          All jobs (last 50)
        </h2>

        {/* Mobile list */}
        <div className="sm:hidden">
          <div className="space-y-2">
            {allJobs.slice(-50).reverse().map((j) => (
              <div
                key={j.job_id}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-white" title={j.job_id}>
                      {j.job_id}
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {j.job_type}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {j.project_id}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={j.status} />
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      retries: {j.retry_count}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="text-[var(--muted)]">
                    user {j.user_id.slice(0, 8)}…
                  </span>
                  <span className="text-[var(--muted)]">
                    {new Date(j.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 text-[var(--muted)]">ID</th>
                <th className="p-3 text-[var(--muted)]">User</th>
                <th className="p-3 text-[var(--muted)]">Project</th>
                <th className="p-3 text-[var(--muted)]">Type</th>
                <th className="p-3 text-[var(--muted)]">Status</th>
                <th className="p-3 text-[var(--muted)]">Retries</th>
                <th className="p-3 text-[var(--muted)]">Created</th>
              </tr>
            </thead>
            <tbody>
              {allJobs.slice(-50).reverse().map((j) => (
                <tr key={j.job_id} className="border-b border-white/5">
                  <td className="p-3 font-mono text-xs text-white">{j.job_id.slice(0, 16)}…</td>
                  <td className="p-3 text-white">{j.user_id.slice(0, 8)}…</td>
                  <td className="p-3 text-white">{j.project_id}</td>
                  <td className="p-3 text-white">{j.job_type}</td>
                  <td className="p-3">
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="p-3 text-white">{j.retry_count}</td>
                  <td className="p-3 text-[var(--muted)]">{new Date(j.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function JobRow({
  job,
  onCancel,
  canRetry,
  onRetry,
}: {
  job: Job;
  onCancel: () => void;
  canRetry: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
      <div>
        <p className="font-mono text-xs text-white">{job.job_id}</p>
        <p className="text-sm text-[var(--muted)]">
          {job.job_type} · {job.project_id} · {job.credit_cost} credits
        </p>
      </div>
      <div className="flex gap-2">
        {(["queued", "processing"].includes(job.status) && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
          >
            Cancel
          </button>
        ))}
        {job.status === "failed" && canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-[var(--neon-green)]/50 px-3 py-1.5 text-sm text-[var(--neon-green)] hover:bg-[var(--neon-green)]/10"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  const styles: Record<JobStatus, string> = {
    queued: "bg-amber-500/20 text-amber-400",
    processing: "bg-blue-500/20 text-blue-400",
    completed: "bg-[var(--neon-green)]/20 text-[var(--neon-green)]",
    failed: "bg-red-500/20 text-red-400",
    cancelled: "bg-[var(--muted)]/20 text-[var(--muted)]",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}

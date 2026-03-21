"use client";

import Link from "next/link";
import OverviewCard from "../components/OverviewCard";
import MicTierCard from "../components/MicTierCard";
import type { DashboardData } from "../lib/dashboardData";

const ELITE_DISPLAY_CREDITS = 999999;

export default function DashboardPageContent({
  data,
}: {
  data: DashboardData | null;
}) {
  if (!data) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  const { profile, projectsCount, recentGenerations } = data;
  const credits = profile?.credits ?? 0;
  const creditsDisplay =
    credits >= ELITE_DISPLAY_CREDITS ? "∞" : String(credits);

  const formatDate = (s: string) =>
    new Date(s).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Dashboard</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Your creator overview. Credits are your live balance (top up in Shop).
        New users get 50 free credits to start.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MicTierCard />
        <OverviewCard
          title="Total projects"
          value={projectsCount}
          subtitle="Tracks in your library"
        />
        <OverviewCard
          title="Credits remaining"
          value={creditsDisplay}
          subtitle="Live balance · use in Studio"
          accent
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/studio"
            className="rounded-xl border border-[var(--purple-glow)]/40 bg-[var(--purple-mid)]/15 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all hover:border-[var(--neon-green)]/50 hover:text-[var(--neon-green)]"
          >
            Open Studio hub
          </Link>
          <Link
            href="/studio/music"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:border-white/25 hover:text-white"
          >
            Music Studio
          </Link>
          <Link
            href="/studio/youtube"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:border-white/25 hover:text-white"
          >
            YouTube Studio
          </Link>
          <Link
            href="/dashboard/projects"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:border-white/25 hover:text-white"
          >
            Projects
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Recent generations
        </h2>
        {recentGenerations.length === 0 ? (
          <p className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--muted)]">
            No generations yet. Create something in{" "}
            <Link href="/studio" className="text-[var(--purple-glow)] hover:underline">
              Studio
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]">
            <ul className="divide-y divide-[var(--card-border)]">
              {recentGenerations.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-[var(--muted)]">
                      {job.id}
                    </p>
                    <p className="text-sm text-white">
                      {job.job_type}
                      <span className="ml-2 text-[var(--muted)]">
                        · {formatDate(job.created_at)}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      job.status === "success"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : job.status === "failed"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {job.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

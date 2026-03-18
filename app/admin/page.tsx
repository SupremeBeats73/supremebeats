import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type AdminStats = {
  totalUsers: number;
  totalProjects: number;
  totalGenerationJobs: number;
  failedGenerationJobs: number;
  totalBillingEvents: number;
  recentBillingEvents: Array<{
    id: string;
    user_id: string | null;
    stripe_event_type: string | null;
    amount: number | null;
    created_at: string;
  }>;
};

async function getAdminStats(): Promise<AdminStats | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  const admin = createClient(url, serviceKey);

  const [
    { count: totalUsers },
    { count: totalProjects },
    { count: totalGenerationJobs },
    { count: failedGenerationJobs },
    { count: totalBillingEvents },
    { data: recentBillingEvents },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("projects").select("*", { count: "exact", head: true }),
    admin.from("generation_jobs").select("*", { count: "exact", head: true }),
    admin
      .from("generation_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    admin.from("billing_events").select("*", { count: "exact", head: true }),
    admin
      .from("billing_events")
      .select("id, user_id, stripe_event_type, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    totalProjects: totalProjects ?? 0,
    totalGenerationJobs: totalGenerationJobs ?? 0,
    failedGenerationJobs: failedGenerationJobs ?? 0,
    totalBillingEvents: totalBillingEvents ?? 0,
    recentBillingEvents: recentBillingEvents ?? [],
  };
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-0">
      <h1 className="mb-2 text-xl font-bold text-white sm:text-2xl">
        Admin overview
      </h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Platform control. Formulas and internal ranking math are not exposed here.
      </p>

      {stats ? (
        <>
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
              Platform stats
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Total users" value={stats.totalUsers} />
              <StatCard label="Total projects" value={stats.totalProjects} />
              <StatCard label="Generation jobs" value={stats.totalGenerationJobs} />
              <StatCard
                label="Failed jobs"
                value={stats.failedGenerationJobs}
                accent
              />
              <StatCard
                label="Billing events"
                value={stats.totalBillingEvents}
              />
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
              Recent billing events (10)
            </h2>

            {/* Mobile list */}
            <div className="sm:hidden">
              {stats.recentBillingEvents.length === 0 ? (
                <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--muted)]">
                  No billing events yet
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentBillingEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs text-white" title={ev.user_id ?? undefined}>
                            {ev.user_id ?? "—"}
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {ev.stripe_event_type ?? "—"}
                          </p>
                        </div>
                        <p className="text-sm text-white">
                          {ev.amount != null ? ev.amount : "—"}
                        </p>
                      </div>
                      <p className="mt-3 text-xs text-[var(--muted)]">
                        {new Date(ev.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[var(--muted)]">
                    <th className="p-3 font-medium">User ID</th>
                    <th className="p-3 font-medium">Event type</th>
                    <th className="p-3 font-medium">Amount</th>
                    <th className="p-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {stats.recentBillingEvents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-[var(--muted)]"
                      >
                        No billing events yet
                      </td>
                    </tr>
                  ) : (
                    stats.recentBillingEvents.map((ev) => (
                      <tr
                        key={ev.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="p-3 font-mono text-xs">
                          {ev.user_id ?? "—"}
                        </td>
                        <td className="p-3">
                          {ev.stripe_event_type ?? "—"}
                        </td>
                        <td className="p-3">
                          {ev.amount != null ? ev.amount : "—"}
                        </td>
                        <td className="p-3 text-[var(--muted)]">
                          {new Date(ev.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <p className="text-sm text-amber-400">
            Stats unavailable. Check SUPABASE_SERVICE_ROLE_KEY is set.
          </p>
        </div>
      )}

      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
        Sections
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card href="/admin/queue" title="Queue" desc="Jobs, retry, cancel, pause automation" />
        <Card href="/admin/users" title="Users" desc="Suspend, review accounts" />
        <Card href="/admin/tracks" title="Tracks" desc="Hide, remove, feature" />
        <Card href="/admin/reports" title="Reports" desc="Flagged activity" />
        <Card href="/admin/analytics" title="Analytics" desc="Growth & revenue" />
        <Card href="/admin/discovery" title="Discovery" desc="Pin, freeze ranking" />
        <Card href="/admin/monetization" title="Monetization" desc="Fees, limits" />
        <Card href="/admin/trust-abuse" title="Trust & Abuse" desc="Trust score, engagement" />
        <Card href="/admin/settings" title="Settings" desc="Platform controls" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 ${
        accent ? "border-amber-500/30" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent ? "text-amber-400" : "text-white"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Card({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition hover:border-red-500/30"
    >
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{desc}</p>
    </Link>
  );
}

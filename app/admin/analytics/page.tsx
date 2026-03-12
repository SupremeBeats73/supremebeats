export default function AdminAnalyticsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Analytics</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Growth and revenue metrics. Internal ranking formulas are not exposed.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <p className="text-xs text-[var(--muted)]">Platform growth</p>
          <p className="mt-2 text-2xl font-bold text-white">—</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Scaffold for real metrics</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <p className="text-xs text-[var(--muted)]">Revenue (aggregate)</p>
          <p className="mt-2 text-2xl font-bold text-white">—</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Scaffold for real metrics</p>
        </div>
      </div>
    </div>
  );
}

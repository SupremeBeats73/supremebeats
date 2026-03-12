import Link from "next/link";

export default function AdminOverviewPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Admin overview</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Platform control. Formulas and internal ranking math are not exposed here.
      </p>
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

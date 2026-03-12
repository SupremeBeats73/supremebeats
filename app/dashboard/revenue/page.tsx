"use client";

import { MOCK_REVENUE, MOCK_ELIGIBILITY } from "../../lib/mockRevenue";

export default function RevenuePage() {
  const r = MOCK_REVENUE;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Revenue</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Earnings and payouts. Payment architecture is modular; connect Stripe when ready.
      </p>

      {/* Eligibility placeholder */}
      <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 backdrop-blur-sm">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Monetization eligibility
        </h2>
        <ul className="space-y-1 text-sm text-[var(--muted)]">
          <li>Silver Mic or above: {MOCK_ELIGIBILITY.silverMicOrAbove ? "✓" : "—"}</li>
          <li>Verified email: {MOCK_ELIGIBILITY.verifiedEmail ? "✓" : "—"}</li>
          <li>No trust violations: {MOCK_ELIGIBILITY.noTrustViolations ? "✓" : "—"}</li>
          <li>Engagement threshold: {MOCK_ELIGIBILITY.engagementThreshold ? "✓" : "—"}</li>
        </ul>
      </div>

      {/* Revenue breakdown */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RevCard title="Total revenue" value={`$${r.totalRevenue}`} accent />
        <RevCard title="Monthly revenue" value={`$${r.monthlyRevenue}`} />
        <RevCard title="Beat sales" value={`$${r.beatSales}`} />
        <RevCard title="Tips" value={`$${r.tips}`} />
        <RevCard title="Supporter revenue" value={`$${r.supporterRevenue}`} />
        <RevCard title="Platform fees" value={`-$${r.platformFees}`} />
        <RevCard title="Net earnings" value={`$${r.netEarnings}`} accent />
      </div>

      <div className="mb-8 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/50 p-6 text-center">
        <p className="text-sm text-[var(--muted)]">Payout history — placeholder (connect Stripe for real payouts)</p>
      </div>
      <div className="mb-8 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/50 p-6 text-center">
        <p className="text-sm text-[var(--muted)]">Collab revenue split — placeholder</p>
      </div>

      {/* Track-level analytics */}
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
        Track performance
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <p className="text-xs text-[var(--muted)]">Plays vs purchases</p>
          <p className="mt-1 text-lg font-semibold text-white">1,240 plays · 12 purchases</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <p className="text-xs text-[var(--muted)]">Conversion rate</p>
          <p className="mt-1 text-lg font-semibold text-white">~1%</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <p className="text-xs text-[var(--muted)]">Follower growth</p>
          <p className="mt-1 text-lg font-semibold text-white">+24 this month</p>
        </div>
        <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/50 p-5">
          <p className="text-xs text-[var(--muted)]">Rating vs sales</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Placeholder</p>
        </div>
        <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/50 p-5">
          <p className="text-xs text-[var(--muted)]">Promotion ROI</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Placeholder</p>
        </div>
      </div>
    </div>
  );
}

function RevCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 ${
        accent ? "border-[var(--neon-green)]/20" : ""
      }`}
    >
      <p className="text-xs text-[var(--muted)]">{title}</p>
      <p className={`mt-2 text-xl font-bold ${accent ? "text-[var(--neon-green)]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

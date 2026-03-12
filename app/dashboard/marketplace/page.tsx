"use client";

import Link from "next/link";

const MOCK_LISTINGS = [
  { id: "1", title: "Midnight Drive", basic: 29, premium: 99, exclusive: 499 },
  { id: "2", title: "Neon Pulse", basic: 24, premium: 79, exclusive: 399 },
];

export default function MarketplacePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Marketplace</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        List beats and licenses. Checkout is scaffolded — connect Stripe for real payments.
      </p>

      <div className="mb-8 flex flex-wrap gap-4">
        <button
          type="button"
          className="rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
        >
          Create listing
        </button>
        <Link
          href="/dashboard/revenue"
          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5"
        >
          Revenue
        </Link>
      </div>

      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
        Your listings
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {MOCK_LISTINGS.map((l) => (
          <div
            key={l.id}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 backdrop-blur-sm"
          >
            <h3 className="font-semibold text-white">{l.title}</h3>
            <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">
              <li>Basic: ${l.basic}</li>
              <li>Premium: ${l.premium}</li>
              <li>Exclusive: ${l.exclusive}</li>
            </ul>
            <p className="mt-3 text-xs text-[var(--muted)]">Listing page & checkout — placeholder</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
        Fan support (placeholders)
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <h3 className="font-semibold text-white">One-time tip</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Fans can send a one-time tip. Connect Stripe to enable.</p>
          <button type="button" className="mt-3 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-[var(--muted)]">
            Configure (placeholder)
          </button>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <h3 className="font-semibold text-white">Monthly supporter</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Recurring subscription. Connect Stripe to enable.</p>
          <button type="button" className="mt-3 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-[var(--muted)]">
            Configure (placeholder)
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setError(data.error ?? "Could not open billing portal");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Billing</h1>
      <p className="text-[var(--muted)]">
        Manage your subscription, payment method, and invoices.
      </p>

      <div className="glass-panel glass-panel--status mt-8 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white">Manage subscription</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Cancel, change plan, or download invoices in Stripe’s secure portal.
        </p>
        {error && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openPortal}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:bg-[var(--neon-green-dim)] disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Opening…
              </>
            ) : (
              "Open billing portal"
            )}
          </button>
          <Link
            href="/dashboard/shop"
            className="text-sm text-[var(--muted)] underline hover:text-white"
          >
            Go to Supreme Shop
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    subtitle: "Free",
    credits: "5 credits/day",
    mic: null,
    features: ["5 credits daily", "Core creation tools", "Community feed"],
    price: null,
    cta: "Current plan",
    highlighted: false,
    borderClass: "border-white/10",
    glowClass: "",
  },
  {
    id: "professional",
    name: "Professional",
    subtitle: "Supreme Pro",
    credits: "500 credits/month",
    mic: "Silver Mic",
    features: ["500 credits/month", "Silver Mic status", "Priority support"],
    price: 19,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTH ?? "price_pro_month",
    cta: "Subscribe",
    highlighted: true,
    borderClass: "border-[var(--purple-glow)]/50",
    glowClass: "shadow-[0_0_32px_rgba(124,58,237,0.25)]",
  },
  {
    id: "elite",
    name: "Elite",
    subtitle: "Creator Gold",
    credits: "Unlimited credits",
    mic: "Gold Mic",
    features: ["Unlimited credits", "Gold Mic status", "Marketplace access", "Early features"],
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTH ?? "price_elite_month",
    cta: "Subscribe",
    highlighted: true,
    borderClass: "border-[var(--neon-green)]/60",
    glowClass: "shadow-[0_0_32px_rgba(34,197,94,0.3)]",
  },
];

const TOPUPS = [
  { label: "100 credits", credits: 100, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_100 ?? "price_topup_100", amount: 499 },
  { label: "500 credits", credits: 500, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_500 ?? "price_topup_500", amount: 1999 },
  { label: "1,000 credits", credits: 1000, priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_1000 ?? "price_topup_1000", amount: 3499 },
];

export default function ShopPage() {
  const { user } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [redirectLabel, setRedirectLabel] = useState("");

  const handleCheckout = async (priceId: string, mode: "subscription" | "payment", metadata: Record<string, string>) => {
    if (!user?.id) return;
    setRedirecting(true);
    setRedirectLabel("Redirecting to Stripe…");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode, userId: user.id, metadata }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error ?? "Checkout failed");
    } catch (e) {
      setRedirecting(false);
      console.error(e);
      alert(e instanceof Error ? e.message : "Checkout failed");
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #050508 0%, #0f0a1a 30%, #1a0f2e 60%, #0f0a1a 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {redirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div
            className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--neon-green)] border-t-transparent"
            style={{ boxShadow: "0 0 24px rgba(34,197,94,0.5)" }}
          />
          <p className="mt-4 text-sm font-medium text-white">{redirectLabel}</p>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-white">Supreme Shop</h1>
        <p className="mb-8 text-sm text-[var(--muted)]">
          Credits & tier. Go Pro or go Gold.
        </p>

        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-xl border bg-black/80 p-6 backdrop-blur-sm ${tier.borderClass} ${tier.glowClass}`}
            >
              <h2 className="text-lg font-bold text-white">{tier.name}</h2>
              <p className="mt-1 text-xs uppercase tracking-wider text-[var(--muted)]">
                {tier.subtitle}
              </p>
              <p className="mt-3 text-sm text-[var(--neon-green)]">{tier.credits}</p>
              {tier.mic && (
                <p className="mt-1 text-xs text-[var(--muted)]">{tier.mic}</p>
              )}
              <ul className="mt-4 space-y-2 text-xs text-[var(--muted)]">
                {tier.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <div className="mt-6">
                {tier.price != null ? (
                  <>
                    <p className="text-2xl font-bold text-white">
                      ${tier.price}
                      <span className="text-sm font-normal text-[var(--muted)]">/mo</span>
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        handleCheckout(tier.priceId!, "subscription", {
                          plan: tier.id,
                          credits: tier.id === "professional" ? "500" : "unlimited",
                        })
                      }
                      disabled={redirecting}
                      className="mt-4 w-full rounded-xl bg-[var(--neon-green)] py-2.5 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_20px_var(--neon-glow)] disabled:opacity-60"
                    >
                      {tier.cta}
                    </button>
                  </>
                ) : (
                  <p className="py-2.5 text-center text-sm text-[var(--muted)]">
                    {tier.cta}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <section className="rounded-xl border border-white/10 bg-black/60 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-bold text-white">Buy Credits</h2>
          <p className="mb-6 text-sm text-[var(--muted)]">
            One-time top-ups. Credits never expire.
          </p>
          <div className="flex flex-wrap gap-4">
            {TOPUPS.map((t) => (
              <div
                key={t.priceId}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-4"
              >
                <p className="font-semibold text-white">{t.label}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  ${(t.amount / 100).toFixed(2)} one-time
                </p>
                <button
                  type="button"
                  onClick={() =>
                    handleCheckout(t.priceId, "payment", {
                      type: "topup",
                      credits: String(t.credits),
                    })
                  }
                  disabled={redirecting || !user}
                  className="mt-3 rounded-lg bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)] disabled:opacity-60"
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-[var(--muted)]">
          <Link href="/dashboard" className="hover:text-white">
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

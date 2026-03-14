"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import PricingGrid from "../components/PricingGrid";

export default function PricingPage() {
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #050508 0%, #0f0a1a 30%, #1a0f2e 60%, #0f0a1a 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold text-white">Pricing</h1>
        <p className="mb-8 text-sm text-[var(--muted)]">
          Coins for generations and Elite for unlimited access.
        </p>
        <PricingGrid userId={user?.id} />
        <p className="mt-8 text-center text-sm text-[var(--muted)]">
          <Link href="/dashboard" className="hover:text-white">
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

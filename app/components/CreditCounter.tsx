"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { isEliteUser } from "../lib/admin";

export default function CreditCounter() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [micTier, setMicTier] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      // Avoid synchronous setState inside effect body.
      const id = window.setTimeout(() => {
        setCredits(null);
        setMicTier(null);
      }, 0);
      return () => window.clearTimeout(id);
    }

    let cancelled = false;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("credits, mic_tier")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setCredits(typeof data?.credits === "number" ? data.credits : 0);
      setMicTier(data?.mic_tier ?? null);
    };

    fetchProfile();

    const channel = supabase
      .channel(`credit-counter-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as { credits?: number; mic_tier?: string } | undefined;
          if (row) {
            if (typeof row.credits === "number") setCredits(row.credits);
            if (row.mic_tier !== undefined) setMicTier(row.mic_tier);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (!user) return null;

  const isElite = isEliteUser(user.email ?? null, micTier);
  const isGold = micTier === "gold" || (micTier != null && String(micTier).trim().toLowerCase() === "elite") || isElite;
  const isSilver = !isGold && micTier === "silver";

  const borderGlowClass = isGold
    ? "border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
    : isSilver
      ? "border-purple-400/50 shadow-[0_0_12px_rgba(192,132,252,0.35)]"
      : "border-white/10";

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border bg-black/40 px-2.5 py-1.5 backdrop-blur-sm ${borderGlowClass}`}
    >
      <Image
        src="/images/coin.png"
        alt=""
        width={20}
        height={20}
        className="shrink-0 object-contain"
        unoptimized
      />
      <span className="min-w-[1.5rem] text-right text-sm font-semibold text-white tabular-nums">
        {isElite ? "∞" : credits !== null ? credits : "—"}
      </span>
      <Link
        href="/dashboard/shop"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-white/10 hover:text-[var(--neon-green)]"
        aria-label="Buy more credits"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import { isEliteUser } from "../lib/admin";

const BADGE_SIZE = 18;

type ProfileMicRow = {
  mic_tier: string | null;
  is_admin: boolean | null;
};

interface UserBadgeProps {
  userId: string;
  /** When provided (e.g. from feed JOIN), skip fetch and render instantly. */
  micTier?: string | null;
  /** When provided (e.g. current user's profile), Elite check uses email so admin list shows Gold Mic. */
  userEmail?: string | null;
}

export default function UserBadge({ userId, micTier: micTierProp, userEmail }: UserBadgeProps) {
  const [fetchedTier, setFetchedTier] = useState<string | null>(null);
  const [fetchedIsAdmin, setFetchedIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // If mic tier is provided (e.g. JOIN results), skip fetching entirely.
    // This avoids unnecessary state updates during effect execution.
    if (micTierProp !== undefined || !userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("mic_tier, is_admin")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      const row = data as unknown as ProfileMicRow | null;
      setFetchedTier(row?.mic_tier ?? null);
      setFetchedIsAdmin(Boolean(row?.is_admin));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, micTierProp]);

  const micTier = micTierProp !== undefined ? micTierProp : fetchedTier;
  const isGold =
    micTier === "gold" ||
    (micTier != null && String(micTier).trim().toLowerCase() === "elite") ||
    isEliteUser(userEmail ?? null, micTier, fetchedIsAdmin);
  const isSilver = !isGold && micTier === "silver";
  if (!isGold && !isSilver) return null;
  const tooltip = isGold
    ? "Verified Gold Mic Creator"
    : "Verified Silver Mic Creator";
  const src = isGold ? "/images/tier-gold.png" : "/images/tier_silver.png";
  const glowClass = isGold
    ? "animate-pulse drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
    : "drop-shadow-[0_0_6px_rgba(192,132,252,0.5)]";

  return (
    <span
      className={`inline-flex shrink-0 align-middle ${glowClass}`}
      title={tooltip}
      role="img"
      aria-label={tooltip}
    >
      <Image
        src={src}
        alt=""
        width={BADGE_SIZE}
        height={BADGE_SIZE}
        className="object-contain"
        unoptimized
        style={{ width: BADGE_SIZE, height: BADGE_SIZE, verticalAlign: "middle" }}
      />
    </span>
  );
}

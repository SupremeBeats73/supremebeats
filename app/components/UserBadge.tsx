"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import { isEliteUser } from "../lib/admin";

const BADGE_SIZE = 18;

interface UserBadgeProps {
  userId: string;
  /** When provided (e.g. from feed JOIN), skip fetch and render instantly. */
  micTier?: string | null;
  /** When provided (e.g. current user's profile), Elite check uses email so admin list shows Gold Mic. */
  userEmail?: string | null;
}

export default function UserBadge({ userId, micTier: micTierProp, userEmail }: UserBadgeProps) {
  const [fetchedTier, setFetchedTier] = useState<string | null>(null);

  useEffect(() => {
    if (micTierProp !== undefined || !userId) {
      setFetchedTier(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("mic_tier")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      setFetchedTier(data?.mic_tier ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, micTierProp]);

  const micTier = micTierProp !== undefined ? micTierProp : fetchedTier;
  const isGold =
    micTier === "gold" ||
    (micTier != null && String(micTier).trim().toLowerCase() === "elite") ||
    (userEmail != null && isEliteUser(userEmail, micTier));
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

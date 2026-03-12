"use client";

import MicBadge from "./MicBadge";
import type { MicTierId, MicTierProgress as MicTierProgressType } from "../lib/types";
import { MIC_TIERS } from "../lib/constants";

const TIER_ORDER: MicTierId[] = ["bronze", "silver", "gold"];

interface MicTierProgressProps {
  data: MicTierProgressType;
}

export default function MicTierProgress({ data }: MicTierProgressProps) {
  const nextTierIndex = TIER_ORDER.indexOf(data.current) + 1;
  const nextTier = nextTierIndex < TIER_ORDER.length ? TIER_ORDER[nextTierIndex] : null;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 backdrop-blur-sm">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        Mic tier progress
      </h3>
      <div className="mb-4 flex items-center gap-3">
        <MicBadge tier={data.current} />
        {nextTier && (
          <span className="text-sm text-[var(--muted)]">
            → {MIC_TIERS[nextTier].label}
          </span>
        )}
      </div>
      {nextTier && (
        <div className="mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--neon-green)] transition-all"
              style={{ width: `${data.progressToNext}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">{data.progressToNext}% to next tier</p>
        </div>
      )}
      <p className="mb-2 text-xs font-medium text-[var(--muted)]">Qualification (indicators only)</p>
      <ul className="space-y-1 text-xs text-[var(--muted)]">
        <li>Authentic tracks: {data.authenticTracksPlaceholder}+</li>
        <li>Engagement consistency: met</li>
        <li>Weighted rating: {data.weightedRatingPlaceholder}+</li>
        <li>Trust: internal metric</li>
      </ul>
    </div>
  );
}

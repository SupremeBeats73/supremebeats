import type { MicTierId } from "../lib/types";
import { MIC_TIERS, MIC_TIER_COLORS } from "../lib/constants";

interface MicBadgeProps {
  tier: MicTierId;
  size?: "sm" | "md";
}

export default function MicBadge({ tier, size = "md" }: MicBadgeProps) {
  const { short } = MIC_TIERS[tier];
  const color = MIC_TIER_COLORS[tier];
  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span
      className={`rounded font-semibold ${sizeClass} ${color} bg-white/5 border border-white/10`}
      title={MIC_TIERS[tier].label}
    >
      {short} Mic
    </span>
  );
}

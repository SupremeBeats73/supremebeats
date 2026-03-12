import type { MicTierId } from "./types";

export const MIC_TIERS: Record<MicTierId, { label: string; short: string }> = {
  bronze: { label: "Bronze Mic", short: "Bronze" },
  silver: { label: "Silver Mic", short: "Silver" },
  gold: { label: "Gold Mic", short: "Gold" },
};

export const MIC_TIER_COLORS: Record<MicTierId, string> = {
  bronze: "text-amber-600",
  silver: "text-gray-300",
  gold: "text-amber-400",
};

export const DISCOVERY_TABS = [
  { id: "trending" as const, label: "Trending" },
  { id: "top_rated" as const, label: "Top Rated" },
  { id: "rising" as const, label: "Rising" },
  { id: "featured" as const, label: "Featured" },
];

/** Scaffold: require listening this fraction of track before rating (enforcement later) */
export const RATING_LISTENING_THRESHOLD_PLACEHOLDER = 0.5;

import type { CollabRecommendation } from "./types";

export const COLLAB_TYPE_LABELS: Record<string, string> = {
  remix: "Remix a track",
  use_beat: "Use this beat",
  invite: "Invite collaborator",
  co_production: "Co-production",
  feature_vocalist: "Feature vocalist",
  feature_instrumentalist: "Feature instrumentalist",
};

export const MOCK_RECOMMENDATIONS: CollabRecommendation[] = [
  {
    creatorId: "c2",
    creatorName: "Luna Drift",
    creatorSlug: "luna-drift",
    micTier: "silver",
    matchScore: 88,
    sharedGenres: ["Lo-Fi", "R&B"],
    recentTrackPreview: "Neon Pulse",
  },
  {
    creatorId: "c3",
    creatorName: "Echo Wave",
    creatorSlug: "echo-wave",
    micTier: "gold",
    matchScore: 92,
    sharedGenres: ["Electronic", "Pop"],
    recentTrackPreview: "Skyline",
  },
];

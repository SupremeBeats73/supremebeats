import type { DashboardCustomization, PublicProfileCustomization, MicTierProgress } from "./types";

export const MOCK_MIC_TIER_PROGRESS: MicTierProgress = {
  current: "silver",
  progressToNext: 65,
  authenticTracksPlaceholder: 12,
  engagementConsistencyPlaceholder: 1,
  weightedRatingPlaceholder: 4.2,
  trustScorePlaceholder: 0.82,
};

export const MOCK_DASHBOARD_CUSTOMIZATION: DashboardCustomization = {
  defaultLandingTab: "overview",
  widgetOrder: ["credits", "projects", "feed", "revenue"],
  visibleWidgets: ["credits", "projects", "feed", "revenue"],
  compactMode: false,
  expandedAnalytics: false,
  darkThemeVariant: "default",
  accentColor: "green",
  pinnedProjectIds: [],
  pinnedCollaboratorIds: [],
};

export const MOCK_PROFILE_CUSTOMIZATION: PublicProfileCustomization = {
  bannerImageUrl: null,
  accentColor: "green",
  layoutStyle: "grid",
  featuredTrackId: null,
  collabShowcaseEnabled: true,
  advancedUnlocked: false,
  customCtaLabel: null,
  customSlug: null,
};

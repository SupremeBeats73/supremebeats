/**
 * User profile model — structured for future Supabase profiles table.
 * Visible and placeholder fields as specified.
 */
export interface UserProfile {
  id: string;
  username: string;
  profileImageUrl: string | null;
  bannerImageUrl: string | null;
  bio: string | null;
  followers: number;
  following: number;
  totalPlays: number;
  weightedRating: number;
  engagementScore: number;
  creatorLevel: number;
  micTier: string;
  /** Visible reputation summary (e.g. "Rising Creator") */
  reputationSummary: string;
  /** Hidden — not shown in UI; placeholder for internal trust */
  trustScorePlaceholder?: number;
  /** Placeholder for future revenue data */
  revenueSummaryPlaceholder?: string;
  joinDate: string; // ISO date
}

export interface DashboardOverview {
  creditsRemaining: number;
  projectsCount: number;
  recentRendersCount: number;
  followers: number;
  plays: number;
  ratingAverage: number;
  micTier: string;
  micTierProgress: number; // 0–100
}

// ——— AI Studio & Projects ———

export type ProjectAssetKind =
  | "beat"
  | "full_song"
  | "vocals"
  | "stems"
  | "thumbnail"
  | "cover_art"
  | "video"
  | "youtube_package"
  | "version"
  | "automation_placeholder"
  | "collab_placeholder";

export type AssetStatus = "pending" | "processing" | "success" | "failure";

export interface Project {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  key: string;
  mood: string;
  duration: number; // seconds
  instruments: string[];
  referenceUploads: string[]; // placeholder: stored paths/ids for future uploads
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAsset {
  id: string;
  projectId: string;
  kind: ProjectAssetKind;
  label: string;
  /** URL or placeholder identifier for future integration */
  url: string | null;
  status: AssetStatus;
  createdAt: string;
  errorMessage?: string | null;
}

// ——— YouTube Packaging ———

export interface YouTubePackageData {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  readinessScore: number; // 0–100
  generatedAt: string;
}

// ——— Visual Engine ———

export type VisualVideoStyle =
  | "youtube_16_9"
  | "anime_loop"
  | "abstract_motion"
  | "cyberpunk"
  | "ambient_minimalist"
  | "cinematic_nature";

// ——— Community & Feed (Phase 5) ———

export type DiscoveryTabId = "trending" | "top_rated" | "rising" | "featured";

export type MicTierId = "bronze" | "silver" | "gold";

export interface FeedTrack {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  creatorSlug: string;
  micTier: MicTierId;
  plays: number;
  weightedRating: number;
  totalRatings: number;
  likes: number;
  commentsCount: number;
  saved: boolean;
  /** Engagement indicator — abstract, no formula exposed */
  engagementIndicator: string;
  audioPreviewUrl: string | null;
}

export interface PublicCreatorProfile {
  id: string;
  username: string;
  slug: string;
  profileImageUrl: string | null;
  bannerImageUrl: string | null;
  bio: string | null;
  followers: number;
  following: number;
  totalPlays: number;
  weightedRating: number;
  micTier: MicTierId;
  creatorLevel: number;
  reputationSummary: string;
  pinnedTrackIds: string[];
  featuredCollabsPlaceholder: boolean;
}

// ——— Reputation & Mic Tiers (Phase 6) ———

export interface MicTierProgress {
  current: MicTierId;
  progressToNext: number; // 0–100
  /** Qualification placeholders — not exact formulas */
  authenticTracksPlaceholder: number;
  engagementConsistencyPlaceholder: number;
  weightedRatingPlaceholder: number;
  trustScorePlaceholder: number;
}

export interface DashboardCustomization {
  defaultLandingTab: string;
  widgetOrder: string[];
  visibleWidgets: string[];
  compactMode: boolean;
  expandedAnalytics: boolean;
  darkThemeVariant: "default" | "warmer" | "cooler";
  accentColor: string;
  pinnedProjectIds: string[];
  pinnedCollaboratorIds: string[];
}

export interface PublicProfileCustomization {
  bannerImageUrl: string | null;
  accentColor: string;
  layoutStyle: "grid" | "list";
  featuredTrackId: string | null;
  collabShowcaseEnabled: boolean;
  /** Gold Mic+: animated header, custom CTA, custom slug, marketplace carousel */
  advancedUnlocked: boolean;
  customCtaLabel: string | null;
  customSlug: string | null;
}

// ——— Monetization (Phase 7) ———

export type LicenseType = "basic" | "premium" | "exclusive";

export interface MarketplaceListing {
  id: string;
  trackId: string;
  creatorId: string;
  basicPrice: number;
  premiumPrice: number;
  exclusivePrice: number;
}

export interface MonetizationEligibilityPlaceholder {
  silverMicOrAbove: boolean;
  verifiedEmail: boolean;
  noTrustViolations: boolean;
  engagementThreshold: boolean;
}

export interface RevenueSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  beatSales: number;
  tips: number;
  supporterRevenue: number;
  platformFees: number;
  netEarnings: number;
}

// ——— Collaboration (Phase 8) ———

export type CollabType = "remix" | "use_beat" | "invite" | "co_production" | "feature_vocalist" | "feature_instrumentalist";

export interface CollabRecommendation {
  creatorId: string;
  creatorName: string;
  creatorSlug: string;
  micTier: MicTierId;
  matchScore: number; // 0–100, abstract
  sharedGenres: string[];
  recentTrackPreview: string | null;
}

// ——— Generation jobs & safety (Phase 10) ———

export type JobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export type JobType =
  | "beat"
  | "full_song"
  | "vocals"
  | "stems"
  | "thumbnail"
  | "cover_art"
  | "video"
  | "youtube_package"
  | "version"
  | "automation_batch";

export interface Job {
  job_id: string;
  user_id: string;
  project_id: string;
  job_type: JobType;
  credit_cost: number;
  status: JobStatus;
  retry_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error_message?: string | null;
  /** Automation cannot trigger automation */
  triggered_by_automation?: boolean;
}

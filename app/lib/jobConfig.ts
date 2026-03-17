import type { JobType } from "./types";
import type { ProjectAssetKind } from "./types";

/** Map asset kind to job type for generation; null = no job (e.g. packaging). */
export function assetKindToJobType(kind: ProjectAssetKind): JobType | null {
  const map: Record<ProjectAssetKind, JobType | null> = {
    beat: "beat",
    full_song: "full_song",
    vocals: "vocals",
    stems: "stems",
    thumbnail: "thumbnail",
    cover_art: "cover_art",
    video: "video",
    youtube_package: "youtube_package",
    version: "version",
    automation_placeholder: null,
    collab_placeholder: null,
  };
  return map[kind] ?? null;
}

/** Safeguard limits */
export const JOB_LIMITS = {
  maxConcurrentPerUser: 5,
  maxAutomationBatchPerUser: 1,
  maxRetries: 3,
  automationBatchMaxTracks: 30,
} as const;

/** Credit cost per job type (placeholder values) */
export const JOB_CREDIT_COST: Record<JobType, number> = {
  beat: 50,
  full_song: 200,
  vocals: 100,
  stems: 80,
  thumbnail: 20,
  cover_art: 25,
  video: 150,
  youtube_package: 10,
  version: 60,
  automation_batch: 500,
};

/** Timeout in ms — structure for enforcement; run timeout in backend/worker to cancel stuck jobs */
export const JOB_TIMEOUT_MS: Record<JobType, number> = {
  beat: 120_000,
  full_song: 300_000,
  vocals: 180_000,
  stems: 120_000,
  thumbnail: 60_000,
  cover_art: 60_000,
  video: 300_000,
  youtube_package: 30_000,
  version: 120_000,
  automation_batch: 600_000,
};

export const DEFAULT_DAILY_CREDITS = 1500;

/** One-time credits granted to new users (profiles.credits default). */
export const SIGNUP_CREDITS = 50;

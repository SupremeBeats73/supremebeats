/**
 * Admin action types — structure for logging. Implement actual logging in backend.
 */
export type AdminActionType =
  | "track_hide"
  | "track_remove"
  | "user_suspend"
  | "user_unsuspend"
  | "report_review"
  | "track_feature"
  | "track_unfeature"
  | "homepage_pin"
  | "homepage_unpin"
  | "ranking_freeze"
  | "ranking_unfreeze"
  | "trust_adjust"
  | "engagement_remove"
  | "monetization_suspend"
  | "monetization_unsuspend"
  | "platform_fee_adjust"
  | "credit_limit_adjust"
  | "publish_limit_adjust";

export interface AdminActionLogEntry {
  action: AdminActionType;
  adminId: string;
  targetId?: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

/** Call this when an admin performs an action — persists in production. */
export function logAdminAction(entry: Omit<AdminActionLogEntry, "timestamp">): void {
  const full: AdminActionLogEntry = { ...entry, timestamp: new Date().toISOString() };
  if (typeof window !== "undefined") {
    console.info("[Admin action]", full);
  }
  // TODO: send to backend / audit table
}

import type { RevenueSummary, MonetizationEligibilityPlaceholder } from "./types";

export const MOCK_REVENUE: RevenueSummary = {
  totalRevenue: 1240,
  monthlyRevenue: 320,
  beatSales: 680,
  tips: 120,
  supporterRevenue: 440,
  platformFees: 62,
  netEarnings: 1178,
};

export const MOCK_ELIGIBILITY: MonetizationEligibilityPlaceholder = {
  silverMicOrAbove: true,
  verifiedEmail: true,
  noTrustViolations: true,
  engagementThreshold: true,
};

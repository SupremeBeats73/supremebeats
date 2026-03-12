"use client";

import { useJobs } from "../context/JobsContext";
import OverviewCard from "../components/OverviewCard";
import MicTierProgress from "../components/MicTierProgress";
import { MOCK_MIC_TIER_PROGRESS } from "../lib/mockUserPrefs";
import { DEFAULT_DAILY_CREDITS } from "../lib/jobConfig";

// Mock overview data — replace with Supabase when ready
const MOCK_OVERVIEW = {
  projectsCount: 7,
  recentRendersCount: 3,
  followers: 42,
  plays: 12800,
  ratingAverage: 4.7,
};

export default function DashboardPage() {
  const { creditsRemaining } = useJobs();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Dashboard</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Your creator overview. Credits refresh daily.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          title="Credits remaining"
          value={creditsRemaining}
          subtitle={`${DEFAULT_DAILY_CREDITS} free daily`}
          accent
        />
        <OverviewCard
          title="Projects"
          value={MOCK_OVERVIEW.projectsCount}
          subtitle="Total saved"
        />
        <OverviewCard
          title="Recent renders"
          value={MOCK_OVERVIEW.recentRendersCount}
          subtitle="Last 7 days"
        />
        <OverviewCard
          title="Followers"
          value={MOCK_OVERVIEW.followers}
        />
        <OverviewCard
          title="Total plays"
          value={MOCK_OVERVIEW.plays.toLocaleString()}
        />
        <OverviewCard
          title="Rating average"
          value={MOCK_OVERVIEW.ratingAverage}
          subtitle="Weighted"
        />
      </div>
      <div className="mt-8">
        <MicTierProgress data={MOCK_MIC_TIER_PROGRESS} />
      </div>
    </div>
  );
}

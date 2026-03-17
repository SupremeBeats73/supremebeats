"use client";

import { useJobs } from "../context/JobsContext";
import OverviewCard from "../components/OverviewCard";
import MicTierProgress from "../components/MicTierProgress";
import MicTierCard from "../components/MicTierCard";
import CreatorStats from "../components/CreatorStats";
import { MOCK_MIC_TIER_PROGRESS } from "../lib/mockUserPrefs";

// Placeholder overview data — replace with Supabase/backend when wired
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
      <p className="mb-2 text-sm text-[var(--muted)]">
        Your creator overview. Credits are your live balance (top up in Shop). New users get 50 free credits to start.
      </p>
      <p className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        <strong>Placeholder data:</strong> Project count, recent renders, followers, plays, rating average, and mic tier progress use demo values until the backend is connected. Credits are your real balance from profile.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MicTierCard />
        <CreatorStats />
        <OverviewCard
          title="Credits remaining"
          value={creditsRemaining >= 999999 ? "∞" : creditsRemaining}
          subtitle="Live balance · use in Studio"
          accent
        />
        <OverviewCard
          title="Projects"
          value={MOCK_OVERVIEW.projectsCount}
          subtitle="Total saved · placeholder"
        />
        <OverviewCard
          title="Recent renders"
          value={MOCK_OVERVIEW.recentRendersCount}
          subtitle="Last 7 days · placeholder"
        />
        <OverviewCard
          title="Followers"
          value={MOCK_OVERVIEW.followers}
          subtitle="Placeholder"
        />
        <OverviewCard
          title="Total plays"
          value={MOCK_OVERVIEW.plays.toLocaleString()}
          subtitle="Placeholder"
        />
        <OverviewCard
          title="Rating average"
          value={MOCK_OVERVIEW.ratingAverage}
          subtitle="Weighted · placeholder"
        />
      </div>
      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">Mic tier progress · placeholder until backend wired</span>
        </div>
        <MicTierProgress data={MOCK_MIC_TIER_PROGRESS} />
      </div>
    </div>
  );
}

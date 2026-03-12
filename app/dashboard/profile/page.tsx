"use client";

import { useAuth } from "../../context/AuthContext";
import MicBadge from "../../components/MicBadge";
import MicTierProgress from "../../components/MicTierProgress";
import { MOCK_MIC_TIER_PROGRESS } from "../../lib/mockUserPrefs";
import type { UserProfile } from "../../lib/types";

// Mock profile — replace with Supabase profile fetch when ready
function getMockProfile(userId: string, email: string): UserProfile {
  return {
    id: userId,
    username: email.split("@")[0] || "creator",
    profileImageUrl: null,
    bannerImageUrl: null,
    bio: "Music creator. Create. Compete. Rise.",
    followers: 42,
    following: 28,
    totalPlays: 12800,
    weightedRating: 4.7,
    engagementScore: 78,
    creatorLevel: 12,
    micTier: "Mic 4",
    reputationSummary: "Rising Creator",
    trustScorePlaceholder: 0.85, // hidden
    revenueSummaryPlaceholder: "—", // placeholder
    joinDate: "2025-01-15",
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const profile: UserProfile | null = user
    ? getMockProfile(user.id, user.email ?? "")
    : null;

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Profile</h1>

      {/* Banner + avatar */}
      <div className="mb-6 overflow-hidden rounded-xl border border-[var(--card-border)]">
        <div
          className="h-32 bg-gradient-to-br from-[var(--deep-purple)] to-[var(--purple-mid)] sm:h-40"
          style={{
            backgroundImage: profile.bannerImageUrl
              ? `url(${profile.bannerImageUrl})`
              : undefined,
            backgroundSize: "cover",
          }}
        />
        <div className="relative border-t border-white/5 bg-[var(--card-bg)] px-6 pb-6 pt-12">
          <div
            className="absolute left-6 top-0 h-20 w-20 -translate-y-1/2 rounded-full border-2 border-[var(--background)] bg-[var(--purple-mid)] flex items-center justify-center text-2xl font-bold text-[var(--neon-green)]"
            style={{
              backgroundImage: profile.profileImageUrl
                ? `url(${profile.profileImageUrl})`
                : undefined,
              backgroundSize: "cover",
            }}
          >
            {!profile.profileImageUrl && profile.username.slice(0, 1).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-white">{profile.username}</h2>
          <p className="text-sm text-[var(--muted)]">
            {profile.reputationSummary} · Joined {new Date(profile.joinDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Bio
          </h3>
          <p className="text-sm text-white">{profile.bio}</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Followers" value={profile.followers} />
        <StatCard label="Following" value={profile.following} />
        <StatCard label="Total plays" value={profile.totalPlays.toLocaleString()} />
        <StatCard label="Weighted rating" value={profile.weightedRating} />
        <StatCard label="Engagement score" value={profile.engagementScore} />
        <StatCard label="Creator level" value={profile.creatorLevel} />
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <p className="text-xs text-[var(--muted)]">Mic tier</p>
          <div className="mt-1">
            <MicBadge tier="silver" size="sm" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <MicTierProgress data={MOCK_MIC_TIER_PROGRESS} />
      </div>

      {/* Reputation (visible) */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Reputation
        </h3>
        <p className="text-white">{profile.reputationSummary}</p>
      </div>

      {/* Trust score and revenue are placeholders — not rendered in UI per spec (hidden) */}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          accent ? "text-[var(--neon-green)]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

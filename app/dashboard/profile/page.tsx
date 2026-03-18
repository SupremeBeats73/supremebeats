"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import MicBadge from "../../components/MicBadge";
import UserBadge from "../../components/UserBadge";
import { supabase } from "../../lib/supabaseClient";
import type { UserProfile } from "../../lib/types";

function normalizeMicTier(v: string | null | undefined): "bronze" | "silver" | "gold" {
  if (!v) return "bronze";
  const s = String(v).toLowerCase();
  if (s === "gold" || s === "elite") return "gold";
  if (s === "silver") return "silver";
  return "bronze";
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    void Promise.resolve(
      supabase
        .from("profiles")
        .select("id, display_name, bio, mic_tier, updated_at, avatar_url, banner_url")
        .eq("id", user.id)
        .maybeSingle()
    ).then(({ data }) => {
        if (data) {
          const rawDisplayName = (data.display_name as string) ?? null;
          const effectiveUsername =
            (rawDisplayName && rawDisplayName.trim()) ||
            user.email?.split("@")[0] ||
            "creator";
          setProfile({
            id: data.id,
            username: effectiveUsername,
            profileImageUrl: (data.avatar_url as string) ?? null,
            bannerImageUrl: (data.banner_url as string) ?? null,
            bio: (data.bio as string) ?? null,
            followers: 0,
            following: 0,
            totalPlays: 0,
            weightedRating: 0,
            engagementScore: 0,
            creatorLevel: 1,
            micTier: normalizeMicTier(data.mic_tier),
            reputationSummary: "Creator",
            trustScorePlaceholder: 0,
            revenueSummaryPlaceholder: "—",
            joinDate: data.updated_at ? new Date(data.updated_at).toISOString().slice(0, 10) : "—",
          });
        } else {
          setProfile({
            id: user.id,
            username: user.email?.split("@")[0] ?? "creator",
            profileImageUrl: null,
            bannerImageUrl: null,
            bio: null,
            followers: 0,
            following: 0,
            totalPlays: 0,
            weightedRating: 0,
            engagementScore: 0,
            creatorLevel: 1,
            micTier: "bronze",
            reputationSummary: "Creator",
            trustScorePlaceholder: 0,
            revenueSummaryPlaceholder: "—",
            joinDate: "—",
          });
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user?.id, user?.email]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-[var(--muted)]">Loading profile…</p>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={`/creator/${encodeURIComponent(profile.username)}`}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--neon-green)]/50"
          >
            View public profile
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--neon-green)]/50"
          >
            Edit profile
          </Link>
        </div>
      </div>

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
          <Link
            href="/dashboard/settings#profile-picture"
            className="group absolute left-6 top-0 h-20 w-20 -translate-y-1/2 rounded-full border-2 border-[var(--background)] bg-[var(--purple-mid)] flex items-center justify-center text-2xl font-bold text-[var(--neon-green)] ring-transparent transition-all hover:ring-2 hover:ring-[var(--neon-green)]/60"
            style={{
              backgroundImage: profile.profileImageUrl
                ? `url(${profile.profileImageUrl})`
                : undefined,
              backgroundSize: "cover",
            }}
            aria-label="Edit profile picture"
          >
            {!profile.profileImageUrl && profile.username.slice(0, 1).toUpperCase()}
            <span className="pointer-events-none absolute inset-0 rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            {profile.username}
            <UserBadge userId={profile.id} userEmail={user?.email ?? null} />
          </h2>
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
            <MicBadge tier={profile.micTier as "bronze" | "silver" | "gold"} size="sm" />
          </div>
        </div>
      </div>

      {/* Reputation (visible) */}
      <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Reputation
        </h3>
        <p className="text-white">{profile.reputationSummary}</p>
      </div>

      {/* Account details — private, only visible to you (email not shown publicly) */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Account details (private)
        </h3>
        <p className="text-sm text-[var(--muted)]">
          Email: <span className="text-white">{user.email ?? "—"}</span>
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Your email is only visible here. Your username is what others see on the site.
        </p>
      </div>
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

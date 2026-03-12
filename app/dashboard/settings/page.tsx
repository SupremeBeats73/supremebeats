"use client";

import { useState } from "react";
import MicTierProgress from "../../components/MicTierProgress";
import { MOCK_MIC_TIER_PROGRESS, MOCK_DASHBOARD_CUSTOMIZATION, MOCK_PROFILE_CUSTOMIZATION } from "../../lib/mockUserPrefs";
import type { DashboardCustomization, PublicProfileCustomization } from "../../lib/types";

export default function SettingsPage() {
  const [dashboard, setDashboard] = useState<DashboardCustomization>(MOCK_DASHBOARD_CUSTOMIZATION);
  const [profile, setProfile] = useState<PublicProfileCustomization>(MOCK_PROFILE_CUSTOMIZATION);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Settings</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Dashboard and profile customization. No custom HTML; styling does not affect ranking.
      </p>

      <div className="mb-8">
        <MicTierProgress data={MOCK_MIC_TIER_PROGRESS} />
      </div>

      {/* Dashboard customization */}
      <section className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Dashboard customization
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Default landing tab</label>
            <select
              value={dashboard.defaultLandingTab}
              onChange={(e) => setDashboard((d) => ({ ...d, defaultLandingTab: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--neon-green)]/50 focus:outline-none"
            >
              <option value="overview">Overview</option>
              <option value="studio">Studio</option>
              <option value="feed">Feed</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={dashboard.compactMode}
              onChange={(e) => setDashboard((d) => ({ ...d, compactMode: e.target.checked }))}
              className="rounded border-white/20"
            />
            <span className="text-sm text-white">Compact mode</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={dashboard.expandedAnalytics}
              onChange={(e) => setDashboard((d) => ({ ...d, expandedAnalytics: e.target.checked }))}
              className="rounded border-white/20"
            />
            <span className="text-sm text-white">Expanded analytics</span>
          </label>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Dark theme variant</label>
            <select
              value={dashboard.darkThemeVariant}
              onChange={(e) => setDashboard((d) => ({ ...d, darkThemeVariant: e.target.value as "default" | "warmer" | "cooler" }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--neon-green)]/50 focus:outline-none"
            >
              <option value="default">Default</option>
              <option value="warmer">Warmer</option>
              <option value="cooler">Cooler</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Accent color</label>
            <select
              value={dashboard.accentColor}
              onChange={(e) => setDashboard((d) => ({ ...d, accentColor: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--neon-green)]/50 focus:outline-none"
            >
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="cyan">Cyan</option>
            </select>
          </div>
          <p className="text-xs text-[var(--muted)]">Pin projects and collaborators from their pages.</p>
        </div>
      </section>

      {/* Public profile customization */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Public profile customization
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Layout style</label>
            <select
              value={profile.layoutStyle}
              onChange={(e) => setProfile((p) => ({ ...p, layoutStyle: e.target.value as "grid" | "list" }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--neon-green)]/50 focus:outline-none"
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Accent color</label>
            <select
              value={profile.accentColor}
              onChange={(e) => setProfile((p) => ({ ...p, accentColor: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[var(--neon-green)]/50 focus:outline-none"
            >
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="cyan">Cyan</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={profile.collabShowcaseEnabled}
              onChange={(e) => setProfile((p) => ({ ...p, collabShowcaseEnabled: e.target.checked }))}
              className="rounded border-white/20"
            />
            <span className="text-sm text-white">Collab showcase</span>
          </label>
          {profile.advancedUnlocked && (
            <>
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">Custom CTA button (Gold Mic+)</label>
                <input
                  type="text"
                  value={profile.customCtaLabel ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, customCtaLabel: e.target.value || null }))}
                  placeholder="e.g. Book me"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--muted)]">Custom profile URL slug</label>
                <input
                  type="text"
                  value={profile.customSlug ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, customSlug: e.target.value || null }))}
                  placeholder="your-slug"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none"
                />
              </div>
              <p className="text-xs text-[var(--muted)]">Animated header, marketplace carousel: Gold Mic only.</p>
            </>
          )}
          {!profile.advancedUnlocked && (
            <p className="text-xs text-[var(--muted)]">Unlock advanced (animated header, custom CTA, custom URL) with Gold Mic.</p>
          )}
        </div>
      </section>
    </div>
  );
}

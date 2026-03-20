"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import CustomSelect from "../../components/CustomSelect";
import { normalizeUsername } from "../../lib/usernameUtils";
import { supabase } from "../../lib/supabaseClient";
import { resolveAssetsSignedUrl } from "../../lib/storageSignedUrls";
import type { DashboardCustomization, PublicProfileCustomization } from "../../lib/types";

type ProfilesPrefsRow = {
  avatar_url: string | null;
  banner_url: string | null;
  dashboard_prefs: DashboardCustomization | null;
  profile_prefs: PublicProfileCustomization | null;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardCustomization>({
    defaultLandingTab: "overview",
    widgetOrder: [],
    visibleWidgets: [],
    compactMode: false,
    expandedAnalytics: false,
    darkThemeVariant: "default",
    accentColor: "green",
    pinnedProjectIds: [],
    pinnedCollaboratorIds: [],
  });
  const [profile, setProfile] = useState<PublicProfileCustomization>({
    bannerImageUrl: null,
    accentColor: "green",
    layoutStyle: "grid",
    featuredTrackId: null,
    collabShowcaseEnabled: false,
    advancedUnlocked: false,
    customCtaLabel: null,
    customSlug: null,
  });
  const [username, setUsername] = useState("");
  const [usernameChangesRemaining, setUsernameChangesRemaining] = useState<number>(1);
  const [usernameLoading, setUsernameLoading] = useState(true);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSuccess, setPrefsSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile/username")
      .then((res) => res.json())
      .then((data) => {
        setUsername(data.username ?? "");
        setUsernameChangesRemaining(
          typeof data.display_name_changes_remaining === "number"
            ? data.display_name_changes_remaining
            : 1
        );
      })
      .catch(() => setUsername(""))
      .finally(() => setUsernameLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    void Promise.resolve(
      supabase
        .from("profiles")
        .select("avatar_url, banner_url, dashboard_prefs, profile_prefs")
        .eq("id", user.id)
        .maybeSingle()
    ).then(({ data }) => {
      const row = data as unknown as ProfilesPrefsRow | null;

      void Promise.resolve(resolveAssetsSignedUrl(supabase, row?.avatar_url ?? null)).then((u) => setAvatarUrl(u));
      void Promise.resolve(resolveAssetsSignedUrl(supabase, row?.banner_url ?? null)).then((u) => setBannerUrl(u));

      const dashboardPrefs = row?.dashboard_prefs ?? null;
      const profilePrefs = row?.profile_prefs ?? null;
      if (dashboardPrefs && typeof dashboardPrefs === "object") {
        setDashboard((prev) => ({ ...prev, ...(dashboardPrefs as Partial<DashboardCustomization>) }));
      }
      if (profilePrefs && typeof profilePrefs === "object") {
        setProfile((prev) => ({ ...prev, ...(profilePrefs as Partial<PublicProfileCustomization>) }));
      }
    }).catch(() => {});
  }, [user?.id]);

  const handleSavePreferences = async () => {
    if (!user?.id || prefsSaving) return;
    setPrefsError(null);
    setPrefsSuccess(false);
    setPrefsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          dashboard_prefs: dashboard,
          profile_prefs: profile,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) {
        setPrefsError(error.message || "Could not save settings");
        return;
      }
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 2500);
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleUsernameBlur = () => {
    setUsername((prev) => normalizeUsername(prev));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    setUploadError(null);
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.set("type", "avatar");
      form.set("file", file);
      const res = await fetch("/api/profile/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }
      setAvatarUrl(data.url);
    } catch {
      setUploadError("Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    setUploadError(null);
    setBannerUploading(true);
    try {
      const form = new FormData();
      form.set("type", "banner");
      form.set("file", file);
      const res = await fetch("/api/profile/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }
      setBannerUrl(data.url);
    } catch {
      setUploadError("Upload failed");
    } finally {
      setBannerUploading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(false);
    const normalized = normalizeUsername(username);
    if (!normalized) {
      setUsernameError("Username cannot be empty.");
      return;
    }
    setUsernameSaving(true);
    try {
      const res = await fetch("/api/profile/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.error ?? "Could not update username.");
        return;
      }
      setUsername(data.username ?? normalized);
      setUsernameChangesRemaining(0);
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch {
      setUsernameError("Could not update username.");
    } finally {
      setUsernameSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-0">
      <h1 className="mb-2 text-xl font-bold text-white sm:text-2xl">Settings</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Dashboard and profile customization. No custom HTML; styling does not affect ranking.
      </p>

      {/* Profile picture & cover art */}
      <section
        id="profile-picture"
        className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm"
      >
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Profile picture & cover
        </h2>
        <p className="mb-4 text-xs text-[var(--muted)]">
          Shown on your profile. JPEG, PNG, WebP, or GIF, max 5MB each.
        </p>
        {uploadError && (
          <p className="mb-3 text-sm text-red-400">{uploadError}</p>
        )}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div>
            <p className="mb-2 text-xs text-[var(--muted)]">Profile picture</p>
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/10 bg-[var(--purple-mid)] flex items-center justify-center text-2xl font-bold text-[var(--neon-green)]"
                style={{
                  backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                  backgroundSize: "cover",
                }}
              >
                {!avatarUrl && user?.email?.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => avatarInputRef.current?.click()}
                  className="min-h-[44px] rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10 disabled:opacity-50"
                >
                  {avatarUploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs text-[var(--muted)]">Cover art</p>
            <div className="overflow-hidden rounded-lg border border-white/10 bg-[var(--deep-purple)]/50 h-24 sm:h-28">
              <div
                className="h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                }}
              />
            </div>
            <div className="mt-2">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleBannerChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={bannerUploading}
                onClick={() => bannerInputRef.current?.click()}
                className="min-h-[44px] rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10 disabled:opacity-50"
              >
                {bannerUploading ? "Uploading…" : "Upload cover"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Account / Username — visible only to you; shown on site instead of email */}
      <section className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Account
        </h2>
        <p className="mb-4 text-xs text-[var(--muted)]">
          Your username is shown publicly (e.g. on the feed and profile). No spaces — use an underscore. Special characters are allowed.
        </p>
        <p className="mb-4 text-xs text-amber-400/90">
          You can only change your username once.
        </p>
        {usernameLoading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : (
          <form onSubmit={handleUsernameSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--muted)]">Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={handleUsernameBlur}
                placeholder="my_username"
                disabled={usernameChangesRemaining < 1}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </label>
            {usernameChangesRemaining < 1 && (
              <p className="text-xs text-[var(--muted)]">
                You have used your one username change.
              </p>
            )}
            {usernameError && (
              <p className="text-sm text-red-400">{usernameError}</p>
            )}
            {usernameSuccess && (
              <p className="text-sm text-[var(--neon-green)]">Username saved.</p>
            )}
            <button
              type="submit"
              disabled={usernameSaving || usernameChangesRemaining < 1}
              className="min-h-[44px] rounded-lg bg-[var(--neon-green)] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {usernameSaving ? "Saving…" : "Save username"}
            </button>
          </form>
        )}
      </section>

      {/* Dashboard customization */}
      <section className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Dashboard customization
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Default landing tab</label>
            <CustomSelect
              aria-label="Default landing tab"
              value={dashboard.defaultLandingTab}
              onChange={(next) =>
                setDashboard((d) => ({ ...d, defaultLandingTab: next as DashboardCustomization["defaultLandingTab"] }))
              }
              options={[
                { value: "overview", label: "Overview" },
                { value: "studio", label: "Studio" },
                { value: "feed", label: "Feed" },
                { value: "revenue", label: "Revenue" },
              ]}
            />
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
            <CustomSelect
              aria-label="Dark theme variant"
              value={dashboard.darkThemeVariant}
              onChange={(next) =>
                setDashboard((d) => ({
                  ...d,
                  darkThemeVariant: next as DashboardCustomization["darkThemeVariant"],
                }))
              }
              options={[
                { value: "default", label: "Default" },
                { value: "warmer", label: "Warmer" },
                { value: "cooler", label: "Cooler" },
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Accent color</label>
            <CustomSelect
              aria-label="Dashboard accent color"
              value={dashboard.accentColor}
              onChange={(next) =>
                setDashboard((d) => ({
                  ...d,
                  accentColor: next as DashboardCustomization["accentColor"],
                }))
              }
              options={[
                { value: "green", label: "Green" },
                { value: "purple", label: "Purple" },
                { value: "cyan", label: "Cyan" },
              ]}
            />
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
            <CustomSelect
              aria-label="Profile layout style"
              value={profile.layoutStyle}
              onChange={(next) =>
                setProfile((p) => ({
                  ...p,
                  layoutStyle: next as PublicProfileCustomization["layoutStyle"],
                }))
              }
              options={[
                { value: "grid", label: "Grid" },
                { value: "list", label: "List" },
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Accent color</label>
            <CustomSelect
              aria-label="Public profile accent color"
              value={profile.accentColor}
              onChange={(next) =>
                setProfile((p) => ({
                  ...p,
                  accentColor: next as PublicProfileCustomization["accentColor"],
                }))
              }
              options={[
                { value: "green", label: "Green" },
                { value: "purple", label: "Purple" },
                { value: "cyan", label: "Cyan" },
              ]}
            />
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

      {/* Save bar */}
      <div className="mt-8 flex flex-col items-stretch justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="text-sm">
          <p className="text-white">Save settings</p>
          <p className="text-xs text-[var(--muted)]">
            Applies dashboard and public profile customization.
          </p>
          {prefsError && <p className="mt-2 text-sm text-red-400">{prefsError}</p>}
          {prefsSuccess && <p className="mt-2 text-sm text-[var(--neon-green)]">Saved.</p>}
        </div>
        <button
          type="button"
          onClick={handleSavePreferences}
          disabled={prefsSaving || !user?.id}
          className="w-full min-h-[44px] rounded-lg bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
        >
          {prefsSaving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

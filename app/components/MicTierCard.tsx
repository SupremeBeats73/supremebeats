"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { MicTierId } from "../lib/types";
import { MIC_TIERS } from "../lib/constants";

const TIER_ORDER: MicTierId[] = ["bronze", "silver", "gold"];

/** Minimum project (track) count to reach each tier. */
const TIER_TRACK_THRESHOLDS: Record<MicTierId, number> = {
  bronze: 5,
  silver: 15,
  gold: 30,
};

function normalizeMicTier(value: string | null | undefined): MicTierId {
  if (!value) return "bronze";
  const v = value.toString().toLowerCase();
  if (v === "gold" || v === "elite" || v.includes("gold")) return "gold";
  if (v === "silver" || v.includes("silver")) return "silver";
  if (v === "bronze" || v.includes("bronze")) return "bronze";
  return "bronze";
}

const TIER_STYLES: Record<
  MicTierId,
  { gradient: string; glow: string; barBg: string; label: string }
> = {
  bronze: {
    gradient:
      "from-amber-700 via-amber-600 to-amber-800",
    glow: "0 0 24px rgba(217,119,6,0.4), 0 0 48px rgba(180,83,9,0.2)",
    barBg: "rgba(217,119,6,0.5)",
    label: "Bronze Mic",
  },
  silver: {
    gradient:
      "from-slate-300 via-slate-100 to-slate-400",
    glow: "0 0 24px rgba(148,163,184,0.5), 0 0 48px rgba(226,232,240,0.25)",
    barBg: "rgba(148,163,184,0.5)",
    label: "Silver Mic",
  },
  gold: {
    gradient:
      "from-yellow-400 via-amber-300 to-yellow-600",
    glow: "0 0 24px rgba(250,204,21,0.5), 0 0 48px rgba(245,158,11,0.25)",
    barBg: "rgba(250,204,21,0.5)",
    label: "Gold Mic",
  },
};

export default function MicTierCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [micTier, setMicTier] = useState<MicTierId>("bronze");
  const [projectsCount, setProjectsCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [profileRes, projectsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("mic_tier")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);
        if (cancelled) return;
        const tierFromProfile =
          profileRes.data?.mic_tier != null
            ? normalizeMicTier(profileRes.data.mic_tier as string)
            : null;
        const count = projectsRes.count ?? 0;
        setProjectsCount(count);
        if (tierFromProfile) {
          setMicTier(tierFromProfile);
        } else {
          if (count >= TIER_TRACK_THRESHOLDS.gold) setMicTier("gold");
          else if (count >= TIER_TRACK_THRESHOLDS.silver) setMicTier("silver");
          else if (count >= TIER_TRACK_THRESHOLDS.bronze) setMicTier("bronze");
          else setMicTier("bronze"); // show Bronze as target; progress will show X/5 until Bronze
        }
      } catch (e) {
        if (!cancelled && process.env.NODE_ENV === "development") {
          console.error("[MicTierCard] Failed to load profile/projects", e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const { progressLabel, progressPct, displayTier } = useMemo(() => {
    const bronzeThresh = TIER_TRACK_THRESHOLDS.bronze;
    const current = micTier;
    const idx = TIER_ORDER.indexOf(current);

    if (projectsCount < bronzeThresh) {
      return {
        progressLabel: `${projectsCount}/${bronzeThresh} tracks until ${MIC_TIERS.bronze.label}`,
        progressPct: Math.min(100, Math.round((projectsCount / bronzeThresh) * 100)),
        displayTier: null as MicTierId | null,
      };
    }

    const nextTier = idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
    const currentThresh = TIER_TRACK_THRESHOLDS[current];
    const nextThresh = nextTier ? TIER_TRACK_THRESHOLDS[nextTier] : currentThresh;
    const needForNext = nextThresh - currentThresh;
    const haveTowardNext = Math.max(0, projectsCount - currentThresh);
    const pct = nextTier && needForNext > 0
      ? Math.min(100, Math.round((haveTowardNext / needForNext) * 100))
      : 100;
    const label = nextTier
      ? `${haveTowardNext}/${needForNext} tracks until ${MIC_TIERS[nextTier].label}`
      : "Max tier reached";
    return {
      progressLabel: label,
      progressPct: pct,
      displayTier: current,
    };
  }, [micTier, projectsCount]);

  const style = displayTier != null ? TIER_STYLES[displayTier] : {
    gradient: "from-[var(--muted)]/80 to-white/10",
    glow: "0 0 16px rgba(255,255,255,0.08)",
    barBg: "rgba(148,163,184,0.35)",
    label: "Earning your mic",
  };

  if (loading) {
    return (
      <div className="glass-panel glass-panel--status rounded-xl p-5">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-white/10" />
        <div className="mb-4 h-10 w-32 animate-pulse rounded-lg bg-white/10" />
        <div className="mb-2 h-2 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div
      className="glass-panel glass-panel--status rounded-xl p-5"
      style={{ boxShadow: style.glow }}
    >
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        Mic tier
      </h3>
      <div
        className={`mb-4 inline-block rounded-lg bg-gradient-to-br ${style.gradient} px-4 py-2.5 font-bold text-black/90 shadow-lg`}
        style={{ boxShadow: style.glow }}
      >
        {style.label}
      </div>
      <div className="space-y-2">
        <div className="relative h-2.5 overflow-hidden rounded-full border border-white/10 bg-[#0f0a1a]">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              backgroundColor: style.barBg,
              boxShadow: style.glow,
            }}
          />
        </div>
        <p className="text-xs text-[var(--muted)]">{progressLabel}</p>
      </div>
    </div>
  );
}

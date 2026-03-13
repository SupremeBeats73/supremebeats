"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const CARD_BORDER = "#2e1065";
const DURATION_MS = 1200;
const TICK_MS = 20;

function useCountUp(end: number, start = 0, enabled: boolean) {
  const [value, setValue] = useState(start);
  const startRef = useRef<number>(start);
  const endRef = useRef<number>(end);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    endRef.current = end;
    startRef.current = value;
    startTimeRef.current = null;
  }, [end]);

  useEffect(() => {
    if (!enabled || end <= start) {
      setValue(end);
      return;
    }
    let rafId: number;
    const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
    const animate = (now: number) => {
      if (startTimeRef.current == null) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / DURATION_MS, 1);
      const eased = easeOutQuart(t);
      const current = Math.round(startRef.current + (endRef.current - startRef.current) * eased);
      setValue(current);
      if (t < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, end, start]);

  return value;
}

function useCountUpFloat(end: number, decimals: number, enabled: boolean) {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const endRef = useRef(end);

  useEffect(() => {
    endRef.current = end;
  }, [end]);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }
    let rafId: number;
    const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
    const animate = (now: number) => {
      if (startTimeRef.current == null) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / DURATION_MS, 1);
      const eased = easeOutQuart(t);
      const current = Number((endRef.current * eased).toFixed(decimals));
      setValue(current);
      if (t < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, end, decimals]);

  return value;
}

export default function CreatorStats() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trustScorePct, setTrustScorePct] = useState(98);
  const [engagementRating, setEngagementRating] = useState(4.8);
  const [totalPlays, setTotalPlays] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setReady(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setReady(false);
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("trust_score, rating, plays")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          const trust = data.trust_score != null ? Number(data.trust_score) : null;
          setTrustScorePct(trust != null && trust <= 1 ? Math.round(trust * 100) : (trust ?? 98));
          const rating = data.rating != null ? Number(data.rating) : null;
          setEngagementRating(rating != null ? Math.min(5, Math.max(0, rating)) : 4.8);
          const plays = data.plays != null ? Number(data.plays) : null;
          setTotalPlays(plays != null && !Number.isNaN(plays) ? plays : 0);
        }
      } catch (e) {
        if (!cancelled && process.env.NODE_ENV === "development") {
          console.error("[CreatorStats] Failed to load profile", e);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const animatedTrust = useCountUp(trustScorePct, 0, ready && !loading);
  const animatedEngagement = useCountUpFloat(engagementRating, 1, ready && !loading);
  const animatedPlays = useCountUp(totalPlays, 0, ready && !loading);

  if (loading) {
    return (
      <div
        className="rounded-xl border bg-black/90 p-5 backdrop-blur-sm"
        style={{ borderColor: CARD_BORDER }}
      >
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border bg-black/90 p-5 backdrop-blur-sm"
      style={{ borderColor: CARD_BORDER, boxShadow: `0 0 20px ${CARD_BORDER}40` }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-white/5 bg-[#0f0a1a]/80 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Trust Score
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: "var(--neon-green)", textShadow: "0 0 20px rgba(34,197,94,0.5)" }}
            >
              {animatedTrust}%
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--neon-green)]/40 bg-[var(--neon-green)]/10 px-2 py-0.5 text-xs font-medium text-[var(--neon-green)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--neon-green)]" />
              Verified
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#0f0a1a]/80 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Engagement Score
          </p>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: "var(--neon-green)", textShadow: "0 0 20px rgba(34,197,94,0.5)" }}
          >
            {animatedEngagement}
            <span className="text-lg font-normal text-[var(--muted)]">/5.0</span>
          </span>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Based on ratings</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#0f0a1a]/80 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Total Plays
          </p>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: "var(--neon-green)", textShadow: "0 0 20px rgba(34,197,94,0.5)" }}
          >
            {animatedPlays.toLocaleString()}
          </span>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Track plays</p>
        </div>
      </div>
    </div>
  );
}

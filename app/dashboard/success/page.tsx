"use client";

import { useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

const CONFETTI_COLORS = [
  "#facc15", "#eab308", "#f59e0b", "#fbbf24", "#fde047",
  "#a855f7", "#9333ea", "#7c3aed", "#c084fc", "#e879f9",
  "#fafafa", "#e2e8f0",
];

function Confetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2.5 + Math.random() * 1.5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle absolute top-0 -translate-x-1/2"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1.2 : 0.6),
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: Math.random() > 0.7 ? "50%" : 2,
          }}
        />
      ))}
    </div>
  );
}

export default function DashboardSuccessPage() {
  const { user } = useAuth();
  const updatedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || updatedRef.current) return;
    updatedRef.current = true;
    supabase
      .from("profiles")
      .update({ mic_tier: "gold", updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .then(({ error }) => {
        if (error) console.error("[dashboard/success] mic_tier update", error);
      });
  }, [user?.id]);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(135deg, #050508 0%, #0f0a1a 25%, #1a0f2e 50%, #1e1025 75%, #0f0a1a 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      <Confetti />

      <div
        className="relative z-10 max-w-xl rounded-3xl border-2 border-amber-400/40 bg-black/70 px-8 py-12 text-center shadow-2xl backdrop-blur-md"
        style={{
          boxShadow: "0 0 60px rgba(250,204,21,0.15), 0 0 120px rgba(168,85,247,0.1), inset 0 0 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-5xl shadow-lg"
          style={{ boxShadow: "0 0 40px rgba(250,204,21,0.4), 0 0 80px rgba(168,85,247,0.2)" }}
        >
          🎤
        </div>
        <h1
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
          style={{ textShadow: "0 0 24px rgba(250,204,21,0.3)" }}
        >
          Welcome to the Gold Mic Tier
        </h1>
        <p className="mt-4 text-lg text-amber-200/90">
          You&apos;re in. Unlimited creativity, Gold status, and full access to the studio.
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Your profile is updated — the Gold Mic is live across SupremeBeats.
        </p>
        <Link
          href="/dashboard/studio"
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-base font-bold text-black shadow-lg transition-all hover:from-amber-300 hover:to-amber-400 hover:shadow-amber-500/30"
          style={{ boxShadow: "0 0 32px rgba(250,204,21,0.35)" }}
        >
          Go to Studio
        </Link>
      </div>
    </div>
  );
}

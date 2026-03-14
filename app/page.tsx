"use client";

import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SectionWrapper from "./components/SectionWrapper";
import FeatureCard from "./components/FeatureCard";
import CTAButton from "./components/CTAButton";
import CreatorCard from "./components/CreatorCard";
import TrackCard from "./components/TrackCard";
import PricingGrid from "./components/PricingGrid";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabaseClient";

const FEATURES = [
  {
    title: "AI Studio",
    description:
      "Generate beats and full tracks with AI. From idea to finished track in minutes.",
  },
  {
    title: "Visual Engine",
    description:
      "Stunning visuals for your music. Covers, visuals, and thumbnails that stand out.",
  },
  {
    title: "YouTube Growth Toolkit",
    description:
      "Titles, descriptions, tags, and strategies to grow your channel and reach.",
  },
  {
    title: "Creator Network",
    description:
      "Connect with producers and artists. Collaborate, compete, and rise together.",
  },
  {
    title: "Smart Discovery",
    description:
      "Get your music in front of the right ears. Algorithm-aware discovery tools.",
  },
  {
    title: "Mic Tier Progression",
    description:
      "Level up your mic tier. Unlock perks and credibility as you create and engage.",
  },
  {
    title: "Monetization",
    description:
      "Turn your creations into revenue. Clear paths to earn from your music.",
  },
  {
    title: "1500 Free Credits Daily",
    description:
      "Generous daily credits so you can create every day without blocking your flow.",
  },
];

const MOCK_CREATORS = [
  { name: "Nova Beats", plays: "12.4k", rating: 4.9, micTier: "Mic 5", engagement: "High" },
  { name: "Luna Drift", plays: "8.2k", rating: 4.8, micTier: "Mic 4", engagement: "Medium" },
  { name: "Echo Wave", plays: "24.1k", rating: 5.0, micTier: "Mic 5", engagement: "High" },
];

const MOCK_TRACKS = [
  { title: "Midnight Drive", creator: "Nova Beats", plays: "5.2k", rating: 4.9, micBadge: "Mic 5", engagement: "High" },
  { title: "Neon Pulse", creator: "Luna Drift", plays: "3.1k", rating: 4.7, micBadge: "Mic 4", engagement: "Medium" },
  { title: "Skyline", creator: "Echo Wave", plays: "9.8k", rating: 5.0, micBadge: "Mic 5", engagement: "High" },
];

type CreatorCardData = {
  name: string;
  plays: string;
  rating: number;
  micTier: string;
  engagement: string;
};

type TrackCardData = {
  title: string;
  creator: string;
  plays: string;
  rating: number;
  micBadge: string;
  engagement: string;
};

function FeatureIcon() {
  return (
    <span className="text-2xl opacity-90" aria-hidden>
      ◆
    </span>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<CreatorCardData[]>(MOCK_CREATORS);
  const [tracks, setTracks] = useState<TrackCardData[]>(MOCK_TRACKS);

  useEffect(() => {
    let isMounted = true;

    const loadFromSupabase = async () => {
      try {
        const [
          { data: trackRows, error: tracksError },
          { data: profileRows, error: profilesError },
        ] = await Promise.all([
          supabase
            .from("tracks")
            .select("id,title,creator_name,plays,rating,mic_badge,engagement")
            .limit(3),
          supabase
            .from("profiles")
            .select("id,display_name,plays,rating,mic_tier,engagement")
            .limit(3),
        ]);

        if (!tracksError && trackRows && trackRows.length > 0 && isMounted) {
          setTracks(
            trackRows.map((t: any) => ({
              title: t.title ?? "Untitled track",
              creator: t.creator_name ?? "Unknown creator",
              plays: String(t.plays ?? "0"),
              rating: Number(t.rating ?? 0),
              micBadge: t.mic_badge ?? "Mic 1",
              engagement: t.engagement ?? "Medium",
            })),
          );
        }

        if (!profilesError && profileRows && profileRows.length > 0 && isMounted) {
          setCreators(
            profileRows.map((p: any) => ({
              name: p.display_name ?? "Unknown creator",
              plays: String(p.plays ?? "0"),
              rating: Number(p.rating ?? 0),
              micTier: p.mic_tier ?? "Mic 1",
              engagement: p.engagement ?? "Medium",
            })),
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "[Home] Failed to load creators / tracks from Supabase",
            error,
          );
        }
      }
    };

    loadFromSupabase();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(135deg, #050508 0%, #0f0a1a 25%, #1a0f2e 50%, #0a1810 75%, #050508 100%)",
          backgroundSize: "400% 400%",
          animation: "gradient-shift 18s ease infinite",
        }}
      >
        <Navbar />

        {/* Hero */}
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 pt-24 pb-16 text-center sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_0_40px_rgba(34,197,94,0.2)] sm:text-5xl md:text-6xl lg:text-7xl">
              Create. Compete. Rise.
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)] sm:text-xl md:mt-6">
              The AI-powered music creator network.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:mt-12">
              <CTAButton href="/signup">Enter SupremeBeats</CTAButton>
              <CTAButton href="/signup" variant="secondary">
                Start Creating
              </CTAButton>
            </div>
          </div>
        </section>

        {/* Features */}
        <SectionWrapper id="features">
          <h2 className="mb-4 text-center text-2xl font-bold text-white sm:text-3xl">
            Built for creators
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-[var(--muted)]">
            Tools and community to make, share, and grow your music.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <FeatureCard
                key={f.title}
                title={f.title}
                description={f.description}
                icon={<FeatureIcon />}
              />
            ))}
          </div>
        </SectionWrapper>

        {/* Pricing */}
        <section className="border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02] py-24 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                Level Up Your <span className="text-[var(--neon-green)]">Vibe</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-[var(--muted)]">
                Choose a credit pack or upgrade to Elite status to unlock unlimited
                AI generations and high-fidelity stem exports.
              </p>
            </div>
            <PricingGrid userId={user?.id} />
            <p className="mt-8 text-center text-sm text-[var(--muted)]">
              All purchases are secure and handled by Stripe. Credits are added
              instantly.
            </p>
          </div>
        </section>

        {/* Mock creator & track cards */}
        <SectionWrapper className="border-t border-white/5">
          <h2 className="mb-4 text-center text-2xl font-bold text-white sm:text-3xl">
            Creators & tracks
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-[var(--muted)]">
            See what the community is making. Plays, ratings, mic tiers, and more.
          </p>
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((c) => (
              <CreatorCard
                key={c.name}
                name={c.name}
                plays={c.plays}
                rating={c.rating}
                micTier={c.micTier}
                engagement={c.engagement}
              />
            ))}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t) => (
              <TrackCard
                key={t.title}
                title={t.title}
                creator={t.creator}
                plays={t.plays}
                rating={t.rating}
                micBadge={t.micBadge}
                engagement={t.engagement}
              />
            ))}
          </div>
        </SectionWrapper>

        {/* Final CTA */}
        <SectionWrapper>
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-12 text-center backdrop-blur-sm sm:px-10 sm:py-16">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to rise?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
              Join the network. Get 1500 free credits daily. Start creating today.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <CTAButton href="/signup">Enter SupremeBeats</CTAButton>
              <CTAButton href="/signup" variant="secondary">
                Start Creating
              </CTAButton>
            </div>
          </div>
        </SectionWrapper>

        <Footer />
      </div>
    </>
  );
}

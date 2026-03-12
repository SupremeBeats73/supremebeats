"use client";

import Link from "next/link";
import MicBadge from "../../components/MicBadge";
import { COLLAB_TYPE_LABELS, MOCK_RECOMMENDATIONS } from "../../lib/mockCollabs";
import type { CollabType } from "../../lib/types";

const COLLAB_TYPES: CollabType[] = [
  "remix",
  "use_beat",
  "invite",
  "co_production",
  "feature_vocalist",
  "feature_instrumentalist",
];

export default function CollabsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Collabs</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Collaborate on tracks. Shared workspace and AI matching — demo scaffolding.
      </p>

      {/* Collab type actions */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Start a collab
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLLAB_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-left transition hover:border-[var(--purple-glow)]/30"
            >
              <span className="font-medium text-white">{COLLAB_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Shared workspace scaffolding */}
      <section className="mb-10 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Shared project workspace
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-[var(--muted)]">Collaborator list</p>
            <p className="mt-1 text-sm text-white">— Scaffold</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-[var(--muted)]">Version history</p>
            <p className="mt-1 text-sm text-white">— Scaffold</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-[var(--muted)]">Contribution log</p>
            <p className="mt-1 text-sm text-white">— Scaffold</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-[var(--muted)]">Revenue split settings</p>
            <p className="mt-1 text-sm text-white">— Scaffold</p>
          </div>
        </div>
      </section>

      {/* AI Collab Matching */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          AI Collab Matching
        </h2>
        <p className="mb-4 text-xs text-[var(--muted)]">
          Recommendations by genre, BPM, mood, audience, engagement, mic tier, trust. Match score is abstract.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {MOCK_RECOMMENDATIONS.map((rec) => (
            <div
              key={rec.creatorId}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 backdrop-blur-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-white">{rec.creatorName}</h3>
                <MicBadge tier={rec.micTier} size="sm" />
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Match: {rec.matchScore}% · {rec.sharedGenres.join(", ")}
              </p>
              {rec.recentTrackPreview && (
                <p className="mt-1 text-xs text-[var(--muted)]">Recent: {rec.recentTrackPreview}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-[var(--neon-green)] px-3 py-1.5 text-xs font-medium text-black hover:bg-[var(--neon-green-dim)]"
                >
                  Invite
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/5"
                >
                  Message
                </button>
                <Link
                  href={`/creator/${rec.creatorSlug}`}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/5"
                >
                  View profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Anti-spam placeholders */}
      <section className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/50 p-6">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Collaboration rules (placeholders)
        </h2>
        <ul className="space-y-1 text-xs text-[var(--muted)]">
          <li>Invite limits — enforced later</li>
          <li>Trust-sensitive invite access</li>
          <li>Repeated rejection lowers priority</li>
          <li>Automation cannot send invites</li>
        </ul>
      </section>
    </div>
  );
}

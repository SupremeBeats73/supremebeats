import Link from "next/link";

export const metadata = {
  title: "Studio",
};

export default function StudioHubPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--neon-green)]">
        SupremeBeats
      </p>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Studio
      </h1>
      <p className="mb-10 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
        Choose your workspace — produce tracks with AI in Music Studio, or craft
        titles, descriptions, and packaging for YouTube in YouTube Studio.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/studio/music"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f0a1a] via-[#0a0812] to-[#050508] p-8 shadow-[0_0_40px_rgba(124,58,237,0.15)] transition hover:border-[var(--purple-glow)]/50 hover:shadow-[0_0_48px_rgba(124,58,237,0.25)]"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--purple-mid)]/20 blur-3xl transition group-hover:bg-[var(--purple-mid)]/30"
            aria-hidden
          />
          <div className="relative">
            <span className="mb-3 inline-flex rounded-lg border border-[var(--neon-green)]/30 bg-[var(--neon-green)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--neon-green)]">
              Audio
            </span>
            <h2 className="mb-2 text-2xl font-bold text-white">Music Studio</h2>
            <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
              Project settings, generate beats or full songs, waveform playback,
              version history, and export — all in one flow.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--neon-green)]">
              Enter Music Studio
              <span aria-hidden className="transition group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </Link>

        <Link
          href="/studio/youtube"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1208] via-[#0a0812] to-[#050508] p-8 shadow-[0_0_40px_rgba(34,197,94,0.08)] transition hover:border-[var(--neon-green)]/35 hover:shadow-[0_0_48px_rgba(34,197,94,0.12)]"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--neon-green)]/10 blur-3xl transition group-hover:bg-[var(--neon-green)]/15"
            aria-hidden
          />
          <div className="relative">
            <span className="mb-3 inline-flex rounded-lg border border-[var(--purple-glow)]/40 bg-[var(--purple-mid)]/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90">
              Growth
            </span>
            <h2 className="mb-2 text-2xl font-bold text-white">YouTube Studio</h2>
            <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
              Generate SEO-ready titles, descriptions, tags, hashtags, and thumbnail
              direction for your project.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--purple-glow)]">
              Enter YouTube Studio
              <span aria-hidden className="transition group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

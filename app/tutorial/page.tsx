import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.supremebeatsstudio.com";
const tutorialUrl = `${siteUrl.replace(/\/$/, "")}/tutorial`;

export const metadata: Metadata = {
  title: "How to Use SupremeBeats Studio",
  description: "Learn how to navigate and use SupremeBeats Studio: dashboard, AI music creation in Studio, projects, profile, and more. Tutorial video included.",
  alternates: { canonical: tutorialUrl },
  openGraph: {
    title: "How to Use SupremeBeats Studio | Tutorial",
    description: "Learn how to navigate and use SupremeBeats Studio. Step-by-step guide and tutorial video.",
    url: tutorialUrl,
    siteName: "SupremeBeats Studio",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-white">
          How to Use SupremeBeats Studio
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Navigate the site and create music in a few steps
        </p>

        <div className="mt-10 space-y-10 text-[var(--muted)]">
          {/* Tutorial video section — set NEXT_PUBLIC_TUTORIAL_VIDEO_ID to your YouTube video ID to show the embed */}
          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Tutorial video
            </h2>
            <p className="mb-4 text-sm leading-relaxed">
              Watch a walkthrough of SupremeBeats Studio and creating your first track.
            </p>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/60">
              {process.env.NEXT_PUBLIC_TUTORIAL_VIDEO_ID ? (
                <iframe
                  title="SupremeBeats Studio tutorial"
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${process.env.NEXT_PUBLIC_TUTORIAL_VIDEO_ID}?rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[var(--muted)]">
                  <span className="text-4xl opacity-50">▶</span>
                  <p>Tutorial video coming soon.</p>
                  <p className="text-xs">
                    Set <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_TUTORIAL_VIDEO_ID</code> in your env to your YouTube video ID to show it here.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              1. Dashboard & navigation
            </h2>
            <p className="mb-3 text-sm leading-relaxed">
              Use the left sidebar to move around:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed">
              <li><strong className="text-white">Dashboard</strong> — Overview and quick links</li>
              <li><strong className="text-white">Studio</strong> — Create new AI music and open projects</li>
              <li><strong className="text-white">Projects</strong> — All your tracks and sessions</li>
              <li><strong className="text-white">Feed</strong> — Activity and updates</li>
              <li><strong className="text-white">Collabs</strong> — Collaborations with other creators</li>
              <li><strong className="text-white">Revenue</strong> — Earnings and payouts</li>
              <li><strong className="text-white">Profile</strong> — Your public profile and edit</li>
              <li><strong className="text-white">Supreme Shop</strong> — Credits and purchases</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              2. Creating music in Studio
            </h2>
            <p className="mb-2 text-sm leading-relaxed">
              Go to <Link href="/dashboard/studio" className="text-[var(--neon-green)] hover:underline">Studio</Link> to start a new project or open an existing one. Use &quot;New project&quot; to generate AI-backed tracks, then refine and export from your project.
            </p>
            <p className="text-sm leading-relaxed">
              Your work is saved under <strong className="text-white">Projects</strong> so you can return anytime.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              3. Profile & settings
            </h2>
            <p className="mb-2 text-sm leading-relaxed">
              Your <Link href="/dashboard/profile" className="text-[var(--neon-green)] hover:underline">Profile</Link> is your public creator page. To change your display name, avatar, or cover, open <Link href="/dashboard/settings" className="text-[var(--neon-green)] hover:underline">Settings</Link> (via the link on your profile or from the dashboard).
            </p>
            <p className="text-sm leading-relaxed">
              In Settings you can also manage account and preferences.
            </p>
          </section>

          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <p className="text-center text-sm text-white">
              Ready to create? Head to the dashboard and open Studio.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard/studio"
                className="rounded-lg bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
              >
                Open Studio
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                Dashboard
              </Link>
            </div>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Back to home
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            About
          </Link>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.supremebeatsstudio.com";
const aboutUrl = `${siteUrl.replace(/\/$/, "")}/about`;

export const metadata: Metadata = {
  title: "About",
  description: "SupremeBeats is a premium AI music generation platform that bridges human creativity and AI, with high-fidelity audio tools and an integrated YouTube Suite for global distribution.",
  alternates: { canonical: aboutUrl },
  openGraph: {
    title: "About | SupremeBeats Studio",
    description: "SupremeBeats is a premium AI music generation platform that bridges human creativity and AI, with high-fidelity audio tools and an integrated YouTube Suite for global distribution.",
    url: aboutUrl,
    siteName: "SupremeBeats Studio",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-white">About SupremeBeats</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Premium AI music generation for creators
        </p>

        <div className="mt-10 space-y-8 text-[var(--muted)]">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">AI music generation</h2>
            <p className="text-sm leading-relaxed">
              SupremeBeats is a premium AI music generation platform designed to bridge the gap between human creativity and artificial intelligence. We provide high-fidelity audio tools that allow producers and creators to generate unique compositions in seconds.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">YouTube Suite & distribution</h2>
            <p className="text-sm leading-relaxed">
              Beyond sound, our integrated YouTube Suite offers a complete workflow for content creators—allowing you to sync, optimize, and prepare your audio for global distribution.
            </p>
          </section>

          <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
            <p className="text-center text-sm text-white">
              Join the creator network. Create. Compete. Rise.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-lg bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
              >
                Get started
              </Link>
              <Link
                href="/#features"
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                See features
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
            href="/login"
            className="rounded-lg bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}

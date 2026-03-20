import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const termsUrl = `${siteUrl.replace(/\/$/, "")}/terms`;

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for SupremeBeats Studio — rules and agreement for using the platform.",
  alternates: { canonical: termsUrl },
  openGraph: {
    title: "Terms of Service | SupremeBeats Studio",
    description: "Terms of Service for SupremeBeats Studio — rules and agreement for using the platform.",
    url: termsUrl,
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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>

        <div className="mt-10 space-y-8 text-sm text-[var(--muted)]">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">1. Acceptance</h2>
            <p>
              By accessing or using SupremeBeats Studio (“Service”) at{" "}
              <a href={siteUrl} className="text-[var(--neon-green)] hover:underline">
                {siteUrl.replace(/^https?:\/\//, "")}
              </a>
              , you agree to these Terms of Service (“Terms”). If you do not agree, do not use the Service. We may update these Terms from time to time; continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">2. Use of the Service</h2>
            <p>
              The Service provides an AI-powered music creator platform and social network: tools to create beats and music, a creator feed, profiles, credits, subscriptions, and related features. You must be at least 13 years old (or the applicable age in your country) and able to form a binding contract. You are responsible for your use of the Service and for complying with all applicable laws.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">3. Account</h2>
            <p>
              You may need to register an account. You must provide accurate information and keep your password secure. You are responsible for all activity under your account. Notify us promptly of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">4. Content and conduct</h2>
            <p className="mb-2">You retain ownership of content you create or upload. By posting content on the Service, you grant us a non-exclusive, royalty-free, worldwide license to use, store, display, and distribute that content in connection with operating and promoting the Service. You agree not to:</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Post content that infringes others’ intellectual property or rights, or that is illegal, harmful, or abusive.</li>
              <li>Impersonate others, spam, or manipulate the Service (e.g. fake engagement, scraping).</li>
              <li>Circumvent access controls, abuse credits or billing, or attempt to gain unauthorized access to our or others’ systems or data.</li>
            </ul>
            <p className="mt-2">
              We may remove content or suspend or terminate accounts that violate these Terms or our policies.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">5. Credits and payments</h2>
            <p>
              Credits, subscriptions, and purchases are governed by the terms shown at the point of purchase (e.g. Shop or checkout). Credits and access are for personal use in accordance with the Service. Refunds are handled per our refund policy (e.g. as stated on the Shop or in support). We may change pricing or credit rules with notice where required.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">6. Intellectual property</h2>
            <p>
              SupremeBeats Studio, our logos, and the Service (excluding your content) are owned by us or our licensors. You may not copy, modify, or create derivative works of the Service or our branding without permission.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">7. Disclaimers</h2>
            <p>
              The Service is provided “as is” and “as available.” We do not warrant that it will be uninterrupted, error-free, or free of harmful components. AI-generated content may be imperfect; you use it at your own risk. We are not liable for content posted by users or for how you use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, we and our affiliates, officers, and employees are not liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising from your use of the Service or these Terms. Our total liability for any claim related to the Service or Terms is limited to the amount you paid us in the twelve months before the claim (or one hundred dollars if greater).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">9. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time for violation of these Terms or for any other reason. You may stop using the Service at any time. Provisions that by their nature should survive (e.g. disclaimers, limitation of liability, dispute resolution) will survive termination.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">10. Changes</h2>
            <p>
              We may change these Terms by posting an updated version and updating the “Last updated” date. Material changes may be communicated by email or in-product notice. Continued use after the effective date of changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">11. Governing law and disputes</h2>
            <p>
              These Terms are governed by the laws of the United States (and the State specified in our contact or legal page, if any), without regard to conflict of laws. Any dispute will be resolved in the courts of that jurisdiction, except where prohibited. You may also have rights under your local consumer laws.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-white">12. Contact</h2>
            <p>
              For questions about these Terms, contact us at the support or contact information provided on our website. Our Privacy Policy describes how we handle your data and is incorporated by reference where applicable.
            </p>
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
            href="/privacy"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Privacy Policy
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

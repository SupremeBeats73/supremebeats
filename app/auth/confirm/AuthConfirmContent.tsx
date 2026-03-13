"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const pageStyle = {
  background:
    "linear-gradient(135deg, #050508 0%, #0f0a1a 25%, #1a0f2e 50%, #0a1810 75%, #050508 100%)",
  backgroundSize: "400% 400%",
  animation: "gradient-shift 18s ease infinite",
};

export default function AuthConfirmContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={pageStyle}
    >
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Email confirmed
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Your SupremeBeats account is confirmed. You can now log in and start
          creating.
        </p>
        <div className="mt-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm">
          <p className="text-sm text-white">
            {email ? (
              <>
                You can now sign in with <strong>{email}</strong>.
              </>
            ) : (
              <>You can now sign in with your email and password.</>
            )}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
          >
            Go to Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{
        background:
          "linear-gradient(135deg, #050508 0%, #0f0a1a 25%, #1a0f2e 50%, #0a1810 75%, #050508 100%)",
        backgroundSize: "400% 400%",
        animation: "gradient-shift 18s ease infinite",
      }}
    >
      <Link
        href="/"
        className="absolute left-4 top-4 text-lg font-bold text-white hover:opacity-90"
      >
        SupremeBeats
      </Link>
      <div className="w-full max-w-md px-0 sm:px-2">
        <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p>
        )}
        <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 backdrop-blur-sm sm:mt-8 sm:p-6">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {title.includes("Log") ? (
            <>
              Don’t have an account?{" "}
              <Link href="/signup" className="text-[var(--neon-green)] hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--neon-green)] hover:underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

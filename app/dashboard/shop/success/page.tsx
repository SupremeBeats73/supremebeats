"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionId) {
      // Avoid synchronous setState during effect render.
      const id = window.setTimeout(() => {
        setStatus("error");
        setMessage("Missing session.");
      }, 0);
      return () => window.clearTimeout(id);
    }
    fetch(`/api/checkout/success?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage(
            data.creditsAdded
              ? `Success! ${data.creditsAdded} credits added to your account.`
              : data.plan
                ? "Subscription active. Your tier and credits are updated."
                : "Payment successful."
          );
        } else {
          setStatus("error");
          setMessage(data.error ?? data.message ?? "Something went wrong.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not verify payment.");
      });
  }, [sessionId]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #050508 0%, #0f0a1a 40%, #1a0f2e 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {status === "loading" && (
        <>
          <div
            className="h-14 w-14 animate-spin rounded-full border-2 border-[var(--neon-green)] border-t-transparent"
            style={{ boxShadow: "0 0 28px rgba(34,197,94,0.5)" }}
          />
          <p className="mt-6 text-sm text-[var(--muted)]">Updating your account…</p>
        </>
      )}
      {status === "success" && (
        <div className="max-w-md rounded-2xl border border-[var(--neon-green)]/40 bg-black/60 px-8 py-10 text-center backdrop-blur-md">
          <p className="text-4xl">✓</p>
          <h1 className="mt-4 text-xl font-bold text-white">Payment successful</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Your credits and tier are updated in your profile. Refresh the dashboard to see your new balance.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-xl bg-[var(--neon-green)] px-6 py-3 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
          >
            Back to Dashboard
          </Link>
        </div>
      )}
      {status === "error" && (
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-black/60 px-8 py-10 text-center backdrop-blur-md">
          <p className="text-4xl text-red-400">✕</p>
          <h1 className="mt-4 text-xl font-bold text-white">Something went wrong</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
          <Link
            href="/dashboard/shop"
            className="mt-8 inline-block rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
          >
            Back to Shop
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ShopSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #050508 0%, #0f0a1a 40%, #1a0f2e 100%)",
          }}
        >
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-[var(--neon-green)] border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

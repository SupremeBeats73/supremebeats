"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "missing">(
    "loading"
  );

  useEffect(() => {
    if (!sessionId) {
      setStatus("missing");
      return;
    }

    fetch("/api/checkout/success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.success) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  // Loading: verifying payment with Stripe
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4">
        <div className="text-center">
          <div
            className="mx-auto h-14 w-14 animate-spin rounded-full border-2 border-green-500 border-t-transparent"
            style={{ boxShadow: "0 0 28px rgba(34,197,94,0.5)" }}
          />
          <p className="mt-6 text-sm text-gray-400">
            Verifying your payment…
          </p>
        </div>
      </div>
    );
  }

  // Missing session_id (e.g. direct visit to /success)
  if (status === "missing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="mb-6 text-gray-400">
            No checkout session found. Complete a purchase from the homepage or
            shop to see your success page.
          </p>
          <Link
            href="/pricing"
            className="block w-full rounded-2xl bg-white py-4 font-bold text-black transition hover:bg-gray-200"
          >
            View Pricing
          </Link>
        </div>
      </div>
    );
  }

  // Verification failed
  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-white/5 p-8 text-center">
          <p className="mb-2 text-red-400">We couldn’t verify your payment.</p>
          <p className="mb-8 text-sm text-gray-400">
            Your card may have been charged. If credits or status didn’t update,
            contact support with your receipt.
          </p>
          <div className="space-y-4">
            <Link
              href="/dashboard/shop"
              className="block w-full rounded-2xl bg-white py-4 font-bold text-black transition hover:bg-gray-200"
            >
              Back to Shop
            </Link>
            <Link
              href="/"
              className="block w-full rounded-2xl border border-white/10 bg-transparent py-4 font-bold text-white transition hover:bg-white/5"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Verified success: show congratulations
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
          <svg
            className="h-10 w-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-white">
          Payment Successful!
        </h1>
        <p className="mb-8 text-gray-400">
          Your account has been updated. Your new credits or status should be
          visible in your dashboard now.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard/studio"
            className="block w-full rounded-2xl bg-white py-4 font-bold text-black transition hover:bg-gray-200"
          >
            Go to My Studio
          </Link>
          <Link
            href="/"
            className="block w-full rounded-2xl border border-white/10 bg-transparent py-4 font-bold text-white transition hover:bg-white/5"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050508]">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

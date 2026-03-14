"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"upgrading" | "success" | "error" | "missing">("upgrading");
  const router = useRouter();

  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#22c55e", "#ffffff", "#fbbf24"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#22c55e", "#ffffff", "#fbbf24"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  useEffect(() => {
    if (sessionId == null) {
      setStatus("missing");
      return;
    }

    const verifyAndUpgrade = async () => {
      try {
        const response = await fetch("/api/checkout/success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await response.json();
        if (response.ok && data.success) setStatus("success");
        else setStatus("error");
      } catch {
        setStatus("error");
      }
    };

    verifyAndUpgrade();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <Navbar />

      <main className="flex flex-col items-center justify-center px-4 pt-32 pb-20 text-center">
        <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl">
          <div className="mb-6 text-6xl">🏆</div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to <span className="text-yellow-500">Gold Mic</span> Status!
          </h1>

          {status === "upgrading" && (
            <p className="text-gray-400 animate-pulse">
              Upgrading your account in the database...
            </p>
          )}

          {status === "success" && (
            <>
              <p className="mb-8 text-lg text-gray-300">
                Your account has been upgraded. You now have unlimited credits and
                priority AI generation.
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/studio")}
                className="rounded-full bg-green-500 px-8 py-3 font-bold text-black transition hover:bg-green-400"
              >
                Go to My Studio
              </button>
            </>
          )}

          {status === "error" && (
            <p className="text-red-400">
              There was a slight delay in the database update. Please refresh the
              page or contact support.
            </p>
          )}

          {status === "missing" && (
            <p className="text-red-400">
              No checkout session found. Complete your purchase from the shop to
              get here.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050508]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

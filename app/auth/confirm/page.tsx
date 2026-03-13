import { Suspense } from "react";
import AuthConfirmContent from "./AuthConfirmContent";

const pageStyle = {
  background:
    "linear-gradient(135deg, #050508 0%, #0f0a1a 25%, #1a0f2e 50%, #0a1810 75%, #050508 100%)",
  backgroundSize: "400% 400%",
  animation: "gradient-shift 18s ease infinite",
};

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
          style={pageStyle}
        >
          <p className="text-[var(--muted)]">Loading…</p>
        </div>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}

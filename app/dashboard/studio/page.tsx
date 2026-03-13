import { Suspense } from "react";
import StudioPageContent from "./StudioPageContent";

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 text-2xl font-bold text-white">Studio</h1>
          <p className="mb-6 text-sm text-[var(--muted)]">Loading…</p>
        </div>
      }
    >
      <StudioPageContent />
    </Suspense>
  );
}

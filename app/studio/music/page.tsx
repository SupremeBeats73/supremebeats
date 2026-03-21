import { Suspense } from "react";
import MusicStudioContent from "./MusicStudioContent";

export const metadata = {
  title: "Music Studio",
};

export default function MusicStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-12 text-sm text-[var(--muted)]">Loading Music Studio…</div>
      }
    >
      <MusicStudioContent />
    </Suspense>
  );
}

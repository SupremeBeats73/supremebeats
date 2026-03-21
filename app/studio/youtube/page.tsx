import { Suspense } from "react";
import YoutubeStudioContent from "./YoutubeStudioContent";

export const metadata = {
  title: "YouTube Studio",
};

export default function YoutubeStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-12 text-sm text-[var(--muted)]">Loading YouTube Studio…</div>
      }
    >
      <YoutubeStudioContent />
    </Suspense>
  );
}

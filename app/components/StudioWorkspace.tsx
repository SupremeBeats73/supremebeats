"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../context/ProjectsContext";
import { useJobs } from "../context/JobsContext";
import { assetKindToJobType } from "../lib/jobConfig";

type TransportState = "stopped" | "playing" | "paused";

type StudioWorkspaceProps = {
  /** Optional: URL(s) for stems or mixes to visualize. */
  tracks?: { id: string; label: string; url: string }[];
  /** Optional callback when a new generation finishes. */
  onGenerated?: (payload: { url?: string; jobId?: string }) => void;
  /** Project id to associate with generation (required for /api/generate). */
  projectId?: string;
};

type WaveSurferLike = {
  play: () => void;
  pause: () => void;
  seekTo: (progress: number) => void;
  load: (url: string) => void;
  destroy: () => void;
};

export default function StudioWorkspace({
  tracks = [],
  onGenerated,
  projectId,
}: StudioWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRefs = useRef<WaveSurferLike[]>([]);
  const [transportState, setTransportState] = useState<TransportState>("stopped");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bpm, setBpm] = useState("140");
  const [key, setKey] = useState("C minor");
  const [genre, setGenre] = useState("Trap");
  const [chords, setChords] = useState("C G Am F");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addAsset, updateAssetStatus } = useProjects();
  const { submitJob, completeJob, failJob, creditsRemaining, creditsLoading } = useJobs();

  // Lazy-load wavesurfer.js on the client only.
  useEffect(() => {
    let cancelled = false;
    async function setup() {
      if (!containerRef.current) return;
      if (wavesurferRefs.current.length > 0) return;

      const WaveSurfer = (await import("wavesurfer.js")).default;

      // Create one WaveSurfer instance per track to mimic a multi-track timeline.
      const root = containerRef.current;
      const instances: WaveSurferLike[] = [];

      const sources = tracks.length
        ? tracks
        : [
            {
              id: "main",
              label: "Main Mix",
              url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            },
          ];

      sources.forEach((track) => {
        const lane = document.createElement("div");
        lane.className =
          "mb-2 h-16 rounded-lg border border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden"; // visual lane
        root.appendChild(lane);
        const ws = WaveSurfer.create({
          container: lane,
          waveColor: "#6E2CF2",
          progressColor: "#6E2CF2",
          cursorColor: "#FFFFFF",
          cursorWidth: 1,
          barWidth: 2,
          barGap: 1,
          height: 64,
        }) as unknown as WaveSurferLike;
        ws.load(track.url);
        instances.push(ws);
      });

      if (!cancelled) {
        wavesurferRefs.current = instances;
      } else {
        instances.forEach((ws) => ws.destroy());
      }
    }

    setup();

    return () => {
      cancelled = true;
      wavesurferRefs.current.forEach((ws) => ws.destroy());
      wavesurferRefs.current = [];
    };
  }, [tracks]);

  const handlePlay = () => {
    wavesurferRefs.current.forEach((ws) => ws.play());
    setTransportState("playing");
  };

  const handlePause = () => {
    wavesurferRefs.current.forEach((ws) => ws.pause());
    setTransportState("paused");
  };

  const handleStop = () => {
    wavesurferRefs.current.forEach((ws) => {
      ws.pause();
      ws.seekTo(0);
    });
    setTransportState("stopped");
  };

  const fakeProgress = () => {
    setProgress(0);
    let pct = 0;
    const id = setInterval(() => {
      pct += Math.random() * 12;
      if (pct >= 96) {
        pct = 96;
        clearInterval(id);
      }
      setProgress(Math.min(96, pct));
    }, 350);
    return () => clearInterval(id);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (!projectId) {
      setError("Select or create a project to generate music.");
      return;
    }
    if (!user?.id) {
      setError("You must be signed in to generate music.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    const clear = fakeProgress();

    try {
      const jobType = assetKindToJobType("beat");
      if (!jobType) {
        setError("Generation type is not configured.");
        return;
      }

      const jobResult = await submitJob(user.id, projectId, jobType);
      if (!jobResult.success || !jobResult.jobId) {
        setError(jobResult.error ?? "Job rejected");
        return;
      }

      const jobId = jobResult.jobId;
      const label = `${genre} beat in ${key}`.trim() || "Beat";
      const asset = await addAsset(projectId, "beat", label, "processing");

      const res = await fetch("/api/generate/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          kind: "beat",
          assetId: asset.id,
          jobId,
          jobType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      clear();
      setProgress(100);

      if (!res.ok || !data.url) {
        updateAssetStatus(
          asset.id,
          "failure",
          (data.error as string) ?? "Generation failed"
        );
        if (res.status === 501) {
          setError(
            "AI generation is not configured. Add REPLICATE_API_TOKEN to enable."
          );
        } else {
          setError((data.error as string) ?? "Generation failed");
        }
        failJob(jobId, true);
        return;
      }

      updateAssetStatus(asset.id, "success", undefined, data.url as string);
      completeJob(jobId);

      const url = data.url as string;
      wavesurferRefs.current.forEach((ws) => ws.load(url));
      onGenerated?.({ url, jobId });
    } catch (e) {
      clear();
      const message = e instanceof Error ? e.message : "Generation failed";
      setError(message);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 600);
    }
  };

  const handleSplitStems = async () => {
    if (isSplitting) return;
    if (!projectId) {
      setError("Project id is required to split stems.");
      return;
    }
    setIsSplitting(true);
    setError(null);
    setProgress(0);

    const clear = fakeProgress();

    try {
      const res = await fetch("/api/split-stems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));
      clear();
      setProgress(100);
      if (!res.ok || !data.stems) {
        setError(data.error ?? "Stem split failed");
        return;
      }

      // Create additional lanes for each returned stem
      if (!containerRef.current) return;
      const WaveSurfer = (await import("wavesurfer.js")).default;
      const root = containerRef.current;

      Object.entries(data.stems as Record<string, string>).forEach(([, url]) => {
        if (!url) return;
        const lane = document.createElement("div");
        lane.className =
          "mb-2 h-16 rounded-lg border border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden";
        root.appendChild(lane);
        const ws = WaveSurfer.create({
          container: lane,
          waveColor: "#6E2CF2",
          progressColor: "#6E2CF2",
          cursorColor: "#FFFFFF",
          cursorWidth: 1,
          barWidth: 2,
          barGap: 1,
          height: 64,
        }) as unknown as WaveSurferLike;
        ws.load(url);
        wavesurferRefs.current.push(ws);
      });
    } catch (e) {
      clear();
      setError(e instanceof Error ? e.message : "Stem split failed");
    } finally {
      setTimeout(() => {
        setIsSplitting(false);
        setProgress(0);
      }, 600);
    }
  };

  const isBusy = isGenerating || isSplitting;

  return (
    <div className="glass-panel glass-panel--status relative grid min-w-0 gap-4 rounded-2xl p-4 text-white sm:gap-6 sm:rounded-3xl sm:p-6 md:grid-cols-[1.7fr_1fr]">
      {/* Overlay while generating */}
      {isBusy && (
        <div className="glass-panel absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <p className="text-lg font-semibold text-white">
            {isGenerating ? "Generating your Supreme Beat..." : "Deconstructing Audio..."}
          </p>
          <div className="w-64">
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/60">
              <div
                className="h-full bg-gradient-to-r from-[#6E2CF2] via-[#9B5CFF] to-[#6E2CF2] transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-white/60">{Math.round(progress)}%</p>
          </div>
        </div>
      )}
      {/* Left: multi-track timeline + global transport */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_30px_rgba(110,44,242,0.35)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                Global Transport
              </p>
              <p className="text-sm text-white/70">Control every lane from one place.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6E2CF2]" />
              <span>{transportState === "playing" ? "Playing" : transportState === "paused" ? "Paused" : "Stopped"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handlePlay}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6E2CF2] text-sm font-semibold text-white shadow-[0_0_18px_rgba(110,44,242,0.8)] transition hover:bg-[#8242ff]"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={handlePause}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xs text-white/80 transition hover:bg-white/10"
            >
              ‖
            </button>
            <button
              type="button"
              onClick={handleStop}
              className="flex h-11 min-w-[44px] items-center justify-center rounded-full border border-white/20 bg-black/40 px-3 text-xs font-medium text-white/80 transition hover:bg-white/10"
            >
              Stop
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/40 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Timeline
          </p>
          <div
            ref={containerRef}
            className="flex flex-col rounded-xl bg-gradient-to-br from-[#111111] via-[#141018] to-[#1A1A1A] p-3"
          />
        </div>
      </div>

      {/* Right: generation sidebar */}
      <aside className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_24px_rgba(110,44,242,0.6)]">
        <div>
          <h2 className="mb-1 text-sm font-semibold text-white">Generation Sidebar</h2>
          <p className="mb-4 text-xs text-white/60">
            Set the vibe, then let SupremeBeats craft a new idea. Uses credits and saves to your project.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">BPM</label>
                <input
                  type="number"
                  min={60}
                  max={200}
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-[#6E2CF2] focus:bg-black/60 sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">Key</label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-[#6E2CF2] focus:bg-black/60 sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-xs"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-[#6E2CF2] focus:bg-black/60 sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Chords</label>
              <input
                type="text"
                value={chords}
                onChange={(e) => setChords(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-0 transition focus:border-[#6E2CF2] focus:bg-black/60 sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-xs"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {isGenerating && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-white/60">
                <span>Generating your Supreme Beat...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/60">
                <div
                  className="h-full bg-gradient-to-r from-[#6E2CF2] via-[#9B5CFF] to-[#6E2CF2] transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleSplitStems}
            disabled={isBusy}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#6E2CF2] bg-transparent px-4 py-3 text-sm font-semibold text-[#6E2CF2] sm:py-2 shadow-[0_0_18px_rgba(110,44,242,0.5)] transition hover:bg-[#6E2CF2]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSplitting ? "Splitting Stems…" : "Split Stems"}
          </button>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || (creditsLoading ? false : creditsRemaining < 1)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#6E2CF2] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(110,44,242,0.9)] transition hover:bg-[#8242ff] disabled:cursor-not-allowed disabled:opacity-60 sm:py-2"
          >
            {isGenerating ? "Generating…" : "Generate"}
          </button>
          {!creditsLoading && creditsRemaining < 999999 && (
            <p className="text-[10px] text-white/50">
              {creditsRemaining} credit{creditsRemaining === 1 ? "" : "s"} left
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}


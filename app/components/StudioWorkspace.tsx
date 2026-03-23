"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../context/ProjectsContext";
import { useJobs } from "../context/JobsContext";
import { assetKindToJobType, JOB_CREDIT_COST } from "../lib/jobConfig";

type TransportState = "stopped" | "playing" | "paused";

type StudioWorkspaceProps = {
  /** Optional: URL(s) for stems or mixes to visualize. */
  tracks?: { id: string; label: string; url: string }[];
  /** Optional callback when a new generation finishes. */
  onGenerated?: (payload: { url?: string; jobId?: string }) => void;
  /** Project id to associate with generation (required for /api/generate). */
  projectId?: string;
  /** Seed controls from the saved project (Music Studio). */
  initialBpm?: number;
  initialKey?: string;
  initialGenre?: string;
  /** Persist parent form (project row) before hitting /api/generate/music (reads DB). */
  onPersistBeforeGenerate?: () => Promise<void>;
  /** Hide beat / full song / split stems buttons (use external generation cards). */
  hideGenerationActionButtons?: boolean;
  /** Hide right-hand BPM/Key/Genre/Chords sidebar (e.g. Music Studio form owns those fields). */
  hideGenerationSidebar?: boolean;
};

export type StudioWorkspaceHandle = {
  generateBeat: () => Promise<void>;
  generateFullSong: () => Promise<void>;
  splitStems: () => Promise<void>;
};

type WaveSurferLike = {
  play: () => void;
  pause: () => void;
  seekTo: (progress: number) => void;
  load: (url: string) => void;
  destroy: () => void;
};

const StudioWorkspace = forwardRef<StudioWorkspaceHandle, StudioWorkspaceProps>(
  function StudioWorkspace(
    {
      tracks = [],
      onGenerated,
      projectId,
      initialBpm,
      initialKey,
      initialGenre,
      onPersistBeforeGenerate,
      hideGenerationActionButtons = false,
      hideGenerationSidebar = false,
    },
    ref
  ) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRefs = useRef<WaveSurferLike[]>([]);
  const initInFlightRef = useRef<Promise<void> | null>(null);
  const [transportState, setTransportState] = useState<TransportState>("stopped");
  const [waveReady, setWaveReady] = useState(false);
  const [isWaveLoading, setIsWaveLoading] = useState(false);
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
  const [generatingKind, setGeneratingKind] = useState<"beat" | "full_song" | null>(null);

  useEffect(() => {
    if (initialBpm != null && Number.isFinite(initialBpm)) {
      setBpm(String(initialBpm));
    }
  }, [initialBpm]);
  useEffect(() => {
    if (initialKey != null) setKey(initialKey);
  }, [initialKey]);
  useEffect(() => {
    if (initialGenre != null) setGenre(initialGenre);
  }, [initialGenre]);

  const trackUrlsKey = useMemo(
    () => tracks.map((t) => t.url).join("|"),
    [tracks]
  );

  // Destroy WaveSurfer instances only when the component unmounts.
  useEffect(() => {
    return () => {
      wavesurferRefs.current.forEach((ws) => {
        try {
          ws.destroy();
        } catch {
          // ignore
        }
      });
      wavesurferRefs.current = [];
      setWaveReady(false);
      setIsWaveLoading(false);
    };
  }, []);

  async function ensureWaveSurferInitialized(initialTracks: NonNullable<StudioWorkspaceProps["tracks"]>) {
    if (wavesurferRefs.current.length > 0) return;
    if (!containerRef.current) return;
    if (initInFlightRef.current) {
      await initInFlightRef.current;
      return;
    }

    const run = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;

      const root = containerRef.current!;
      const instances: WaveSurferLike[] = [];

      // Create one WaveSurfer instance per track to mimic a multi-track timeline.
      initialTracks.forEach((track) => {
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

        // WaveSurfer's event emitter isn't part of our minimal `WaveSurferLike` type.
        const wsAny = ws as unknown as { on?: (event: string, cb: () => void) => void };
        wsAny.on?.("loading", () => setIsWaveLoading(true));
        wsAny.on?.("ready", () => setIsWaveLoading(false));
        wsAny.on?.("error", () => setIsWaveLoading(false));
        wsAny.on?.("finish", () => setTransportState("stopped"));

        ws.load(track.url);
        instances.push(ws);
      });

      wavesurferRefs.current = instances;
      setWaveReady(instances.length > 0);
      setIsWaveLoading(false);
    };

    initInFlightRef.current = run();
    try {
      await initInFlightRef.current;
    } finally {
      initInFlightRef.current = null;
    }
  }

  function isValidSignedUrl(url: string): boolean {
    const s = url.trim();
    // Signed URLs from Supabase are absolute. Reject empty/non-http values.
    return s.startsWith("http://") || s.startsWith("https://");
  }

  async function loadAudioUrl(url: string) {
    const trimmed = url.trim();
    if (!isValidSignedUrl(trimmed)) {
      setError("Invalid audio URL. Please regenerate and try again.");
      return;
    }

    if (wavesurferRefs.current.length === 0) {
      // Initialize exactly once using the first known URL.
      await ensureWaveSurferInitialized([
        { id: "main", label: "Main Mix", url: trimmed },
      ]);
    }

    if (wavesurferRefs.current.length === 0) return;

    // Loading state while WaveSurfer fetches the signed audio.
    setIsWaveLoading(true);
    wavesurferRefs.current.forEach((ws) => ws.load(trimmed));
  }

  // Initialize WaveSurfer when we first receive at least one real URL.
  useEffect(() => {
    if (wavesurferRefs.current.length > 0) return;
    if (!containerRef.current) return;
    if (!tracks?.length) return;
    const valid = tracks.every((t) => t?.url && isValidSignedUrl(t.url));
    if (!valid) return;
    void ensureWaveSurferInitialized(tracks);
    // Re-run only if the set of URLs changes; never destroy on these changes.
  }, [trackUrlsKey, tracks]);

  const handlePlay = () => {
    if (isWaveLoading || !waveReady) return;
    wavesurferRefs.current.forEach((ws) => ws.play());
    setTransportState("playing");
  };

  const handlePause = () => {
    if (isWaveLoading || !waveReady) return;
    wavesurferRefs.current.forEach((ws) => ws.pause());
    setTransportState("paused");
  };

  const handleStop = () => {
    if (!waveReady) return;
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

  const handleGenerateMusic = async (kind: "beat" | "full_song") => {
    if (isGenerating) return;
    if (!projectId) {
      setError("Select or create a project to generate music.");
      return;
    }
    if (!user?.id) {
      setError("You must be signed in to generate music.");
      return;
    }

    const jobType = assetKindToJobType(kind);
    if (!jobType) {
      setError("Generation type is not configured.");
      return;
    }
    const cost = JOB_CREDIT_COST[jobType];
    if (!creditsLoading && creditsRemaining < cost) {
      setError(`You need at least ${cost} credits for this generation.`);
      return;
    }

    setIsGenerating(true);
    setGeneratingKind(kind);
    setError(null);
    setProgress(0);

    const clear = fakeProgress();

    try {
      await onPersistBeforeGenerate?.();

      const jobResult = await submitJob(user.id, projectId, jobType);
      if (!jobResult.success || !jobResult.jobId) {
        setError(jobResult.error ?? "Job rejected");
        return;
      }

      const jobId = jobResult.jobId;
      const label =
        kind === "beat"
          ? `${genre} beat in ${key}`.trim() || "Beat"
          : `${genre} full song in ${key}`.trim() || "Full song";
      const asset = await addAsset(projectId, kind, label, "processing");

      const res = await fetch("/api/generate/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          kind,
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
      await loadAudioUrl(url);
      onGenerated?.({ url, jobId });
    } catch (e) {
      clear();
      const message = e instanceof Error ? e.message : "Generation failed";
      setError(message);
    } finally {
      setGeneratingKind(null);
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
    if (!user?.id) {
      setError("You must be signed in to split stems.");
      return;
    }
    const stemsJobType = assetKindToJobType("stems");
    if (!stemsJobType) {
      setError("Stems job type is not configured.");
      return;
    }
    const stemCost = JOB_CREDIT_COST[stemsJobType];
    if (!creditsLoading && creditsRemaining < stemCost) {
      setError(`You need at least ${stemCost} credits to split stems.`);
      return;
    }

    setIsSplitting(true);
    setError(null);
    setProgress(0);

    const clear = fakeProgress();
    let jobId: string | undefined;

    try {
      await onPersistBeforeGenerate?.();
      const jobResult = await submitJob(user.id, projectId, stemsJobType);
      if (!jobResult.success || !jobResult.jobId) {
        setError(jobResult.error ?? "Could not start stems job");
        clear();
        setIsSplitting(false);
        setProgress(0);
        return;
      }
      jobId = jobResult.jobId;

      const res = await fetch("/api/split-stems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));
      clear();
      setProgress(100);
      if (!res.ok || !data.stems) {
        setError((data.error as string) ?? "Stem split failed");
        if (jobId) failJob(jobId, true);
        return;
      }

      if (jobId) completeJob(jobId);

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
      onGenerated?.({});
    } catch (e) {
      clear();
      setError(e instanceof Error ? e.message : "Stem split failed");
      if (jobId) failJob(jobId, true);
    } finally {
      setTimeout(() => {
        setIsSplitting(false);
        setProgress(0);
      }, 600);
    }
  };

  const handleGenerateMusicRef = useRef(handleGenerateMusic);
  handleGenerateMusicRef.current = handleGenerateMusic;
  const handleSplitStemsRef = useRef(handleSplitStems);
  handleSplitStemsRef.current = handleSplitStems;

  useImperativeHandle(
    ref,
    () => ({
      generateBeat: () => handleGenerateMusicRef.current("beat"),
      generateFullSong: () => handleGenerateMusicRef.current("full_song"),
      splitStems: () => handleSplitStemsRef.current(),
    }),
    []
  );

  const isBusy = isGenerating || isSplitting;

  return (
    <div
      className={`glass-panel glass-panel--status relative grid min-w-0 gap-4 rounded-2xl p-4 text-white sm:gap-6 sm:rounded-3xl sm:p-6 ${
        hideGenerationSidebar ? "md:grid-cols-1" : "md:grid-cols-[1.7fr_1fr]"
      }`}
    >
      {/* Overlay while generating */}
      {isBusy && (
        <div className="glass-panel absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <p className="text-lg font-semibold text-white">
            {isGenerating && generatingKind === "full_song"
              ? "Generating your full song..."
              : isGenerating
                ? "Generating your Supreme Beat..."
                : "Deconstructing Audio..."}
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
              disabled={isWaveLoading || !waveReady}
              aria-disabled={isWaveLoading || !waveReady}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6E2CF2] text-sm font-semibold text-white shadow-[0_0_18px_rgba(110,44,242,0.8)] transition hover:bg-[#8242ff]"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={handlePause}
              disabled={isWaveLoading || !waveReady}
              aria-disabled={isWaveLoading || !waveReady}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xs text-white/80 transition hover:bg-white/10"
            >
              ‖
            </button>
            <button
              type="button"
              onClick={handleStop}
              disabled={!waveReady}
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

        {hideGenerationSidebar && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
            {!creditsLoading && creditsRemaining < 999999 && (
              <p className="text-[11px] text-white/50">
                {creditsRemaining} credit{creditsRemaining === 1 ? "" : "s"} left
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: generation sidebar */}
      {!hideGenerationSidebar && (
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
                <span>
                  {generatingKind === "full_song"
                    ? "Generating full song..."
                    : "Generating beat..."}
                </span>
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
          {!hideGenerationActionButtons && (
            <>
              <button
                type="button"
                onClick={handleSplitStems}
                disabled={isBusy}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#6E2CF2] bg-transparent px-4 py-3 text-sm font-semibold text-[#6E2CF2] shadow-[0_0_18px_rgba(110,44,242,0.5)] transition hover:bg-[#6E2CF2]/10 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2"
              >
                {isSplitting ? "Splitting Stems…" : "Split Stems"}
              </button>
              <button
                type="button"
                onClick={() => void handleGenerateMusic("beat")}
                disabled={
                  isGenerating ||
                  (creditsLoading ? false : creditsRemaining < JOB_CREDIT_COST.beat)
                }
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#6E2CF2] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(110,44,242,0.9)] transition hover:bg-[#8242ff] disabled:cursor-not-allowed disabled:opacity-60 sm:py-2"
              >
                {isGenerating && generatingKind === "beat" ? "Generating…" : "Generate beat"}
              </button>
              <button
                type="button"
                onClick={() => void handleGenerateMusic("full_song")}
                disabled={
                  isGenerating ||
                  (creditsLoading ? false : creditsRemaining < JOB_CREDIT_COST.full_song)
                }
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--neon-green)]/40 bg-[var(--neon-green)]/10 px-4 py-3 text-sm font-semibold text-[var(--neon-green)] shadow-[0_0_18px_rgba(34,197,94,0.25)] transition hover:bg-[var(--neon-green)]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2"
              >
                {isGenerating && generatingKind === "full_song"
                  ? "Generating…"
                  : "Generate full song"}
              </button>
            </>
          )}
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          {!creditsLoading && creditsRemaining < 999999 && (
            <p className="text-[10px] text-white/50">
              {creditsRemaining} credit{creditsRemaining === 1 ? "" : "s"} left
            </p>
          )}
        </div>
      </aside>
      )}
    </div>
  );
});

export default StudioWorkspace;

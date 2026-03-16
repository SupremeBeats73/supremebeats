"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useProjects } from "../../context/ProjectsContext";
import { useJobs } from "../../context/JobsContext";
import GenerationCard from "../../components/GenerationCard";
import VisualEngineSection from "../../components/VisualEngineSection";
import { assetKindToJobType } from "../../lib/jobConfig";
import type { ProjectAssetKind, VisualVideoStyle } from "../../lib/types";

const GENERATION_ACTIONS: {
  title: string;
  description: string;
  icon: string;
  kind: ProjectAssetKind;
  label: string;
}[] = [
  { title: "Generate Beat", description: "AI-generated beat for your project.", icon: "♩", kind: "beat", label: "Beat v1" },
  { title: "Generate Full Song", description: "Complete track with structure and arrangement.", icon: "♪", kind: "full_song", label: "Full song v1" },
  { title: "Generate Optional Vocals", description: "Add vocal stems or top-line.", icon: "🎤", kind: "vocals", label: "Vocals v1" },
  { title: "Generate Stems", description: "Separated stems from your track.", icon: "📀", kind: "stems", label: "Stems pack" },
  { title: "Generate Track Variations", description: "Alternate versions and mixes.", icon: "🔄", kind: "version", label: "Variation" },
  { title: "Generate Thumbnail", description: "YouTube thumbnail from your art direction.", icon: "🖼", kind: "thumbnail", label: "Thumbnail" },
  { title: "Generate Cover Art", description: "Album or single cover art.", icon: "🎨", kind: "cover_art", label: "Cover art" },
  { title: "Generate Music Video", description: "Visualizer or short-form video.", icon: "🎬", kind: "video", label: "Music video" },
  { title: "Generate YouTube Package", description: "Title, description, tags, thumbnail bundle.", icon: "📦", kind: "youtube_package", label: "YouTube package" },
];

function StudioWorkspace({ projectId }: { projectId: string }) {
  const { getAssets } = useProjects();
  const assets = getAssets(projectId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 60; // placeholder

  return (
    <>
      {/* Waveform section */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 backdrop-blur-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Waveform
        </p>
        <div className="flex h-16 items-end justify-between gap-0.5">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-[var(--purple-glow)]/30 transition-colors hover:bg-[var(--neon-green)]/40"
              style={{ height: `${24 + Math.sin(i * 0.25) * 28 + Math.sin(i * 0.7) * 12}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
          <span>0:00</span>
          <span>{Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Timeline / track lanes feel */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 backdrop-blur-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Track lanes
        </p>
        <div className="space-y-2">
          {["Beat", "Bass", "Keys", "Vocal"].map((lane, i) => (
            <div
              key={lane}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 py-2 pl-3 pr-4"
            >
              <span className="w-16 text-xs text-[var(--muted)]">{lane}</span>
              <div className="h-8 flex-1 rounded bg-[var(--deep-purple)]/50" />
            </div>
          ))}
        </div>
      </div>

      {/* Playback + version list */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--neon-green)] text-black transition-opacity hover:opacity-90"
          >
            {isPlaying ? "‖" : "▶"}
          </button>
          <span className="text-sm text-[var(--muted)]">
            {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime) % 60).padStart(2, "0")} / {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Versions & assets ({assets.length})
          </p>
        </div>
      </div>

      {/* Project asset panels */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 backdrop-blur-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Project assets
        </p>
        {assets.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No assets yet. Use the tools above to generate.</p>
        ) : (
          <ul className="space-y-2">
            {assets.slice(0, 10).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm"
              >
                <span className="text-white">{a.label}</span>
                <span
                  className={`text-xs ${
                    a.status === "success"
                      ? "text-[var(--neon-green)]"
                      : a.status === "failure"
                        ? "text-red-400"
                        : "text-[var(--muted)]"
                  }`}
                >
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function StudioPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const { user } = useAuth();
  const { projects, projectsLoading, getProject, mockGenerate } = useProjects();
  const { submitJob, completeJob, failJob, creditsRemaining, creditsLoading } = useJobs();
  const project = projectId ? getProject(projectId) : null;
  const [videoGen, setVideoGen] = useState(false);
  const [thumbGen, setThumbGen] = useState(false);
  const [coverGen, setCoverGen] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

  if (process.env.NODE_ENV === "development") {
    console.log("[Studio] projectId from query", projectId, {
      projectsCount: projects.length,
      projectsLoading,
      hasProject: !!project,
    });
  }

  // No project selected: show the default Studio landing.
  if (!projectId) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-white">Studio</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Create or open a project to use the AI Studio.
        </p>
        <div className="mb-8 flex flex-wrap gap-4">
          <Link
            href="/dashboard/studio/new"
            className="rounded-xl bg-[var(--neon-green)] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)]"
          >
            New project
          </Link>
          <Link
            href="/dashboard/projects"
            className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Open existing project
          </Link>
        </div>
        {projects.length > 0 && (
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 backdrop-blur-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Recent projects
            </p>
            <ul className="space-y-2">
              {projects.slice(-5).reverse().map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/studio?project=${p.id}`}
                    className="block rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
                  >
                    {p.name} · {p.genre || "—"} · {p.bpm} BPM
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Project id is present but data is still loading from Supabase.
  if (projectsLoading && !project) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-white">Studio</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Loading your project…
        </p>
      </div>
    );
  }

  // Project id is present but not found after loading.
  if (projectId && !project) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Studio] Project id from query not found in context", {
        projectId,
        projects,
      });
    }
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-white">Studio</h1>
        <p className="mb-4 text-sm text-[var(--muted)]">
          The selected project could not be found. It may have been deleted or failed to load.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/projects"
            className="rounded-xl bg-[var(--neon-green)] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)]"
          >
            View all projects
          </Link>
          <Link
            href="/dashboard/studio/new"
            className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Create a new project
          </Link>
        </div>
      </div>
    );
  }

  const runWithJob = async (
    jobType: import("../../lib/types").JobType,
    label: string,
    work: () => Promise<string>
  ) => {
    if (!user) return;
    setJobError(null);
    const result = await submitJob(user.id, projectId, jobType);
    if (!result.success) {
      setJobError(result.error ?? "Job rejected");
      return;
    }
    try {
      await work();
      if (result.jobId) completeJob(result.jobId);
    } catch {
      if (result.jobId) failJob(result.jobId, true);
      setJobError("Generation failed; credits refunded.");
    }
  };

  const handleGenerate = async (kind: ProjectAssetKind, label: string) => {
    const jobType = assetKindToJobType(kind);
    if (jobType) {
      await runWithJob(jobType, label, () => mockGenerate(projectId, kind, label));
    } else {
      await mockGenerate(projectId, kind, label);
    }
  };

  const handleGenerateVideo = async (style: VisualVideoStyle) => {
    setVideoGen(true);
    setJobError(null);
    try {
      if (user) {
        const result = await submitJob(user.id, projectId, "video");
        if (!result.success) {
          setJobError(result.error ?? "Job rejected");
          return;
        }
        try {
          await mockGenerate(projectId, "video", `${style.replace(/_/g, " ")} video`);
          if (result.jobId) completeJob(result.jobId);
        } catch {
          if (result.jobId) failJob(result.jobId, true);
          setJobError("Generation failed; credits refunded.");
        }
      }
    } finally {
      setVideoGen(false);
    }
  };
  const handleGenerateThumbnail = async (overlayText: string) => {
    setThumbGen(true);
    setJobError(null);
    try {
      if (user) {
        const result = await submitJob(user.id, projectId, "thumbnail");
        if (!result.success) {
          setJobError(result.error ?? "Job rejected");
          return;
        }
        try {
          await mockGenerate(projectId, "thumbnail", overlayText || "Thumbnail");
          if (result.jobId) completeJob(result.jobId);
        } catch {
          if (result.jobId) failJob(result.jobId, true);
          setJobError("Generation failed; credits refunded.");
        }
      }
    } finally {
      setThumbGen(false);
    }
  };
  const handleGenerateCoverArt = async (overlayText: string) => {
    setCoverGen(true);
    setJobError(null);
    try {
      if (user) {
        const result = await submitJob(user.id, projectId, "cover_art");
        if (!result.success) {
          setJobError(result.error ?? "Job rejected");
          return;
        }
        try {
          await mockGenerate(projectId, "cover_art", overlayText || "Cover art");
          if (result.jobId) completeJob(result.jobId);
        } catch {
          if (result.jobId) failJob(result.jobId, true);
          setJobError("Generation failed; credits refunded.");
        }
      }
    } finally {
      setCoverGen(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Studio</h1>
          <p className="text-sm text-[var(--muted)]">
            {project
              ? `${project.name} · ${project.genre || "—"} · ${project.bpm} BPM`
              : "Project not available"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Credits: {creditsLoading ? "…" : creditsRemaining >= 999999 ? "∞" : creditsRemaining}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
          >
            Project detail
          </Link>
          <Link
            href="/dashboard/studio/new"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
          >
            New project
          </Link>
        </div>
      </div>

      {/* Generation tools */}
      <section className="mb-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Generate
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GENERATION_ACTIONS.map((action) => (
            <GenerationCard
              key={action.kind + action.label}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onGenerate={() => handleGenerate(action.kind, action.label)}
              projectId={projectId ?? undefined}
              kind={action.kind}
            />
          ))}
        </div>
        {jobError && (
          <p className="mt-3 text-sm text-red-400">{jobError}</p>
        )}
        <p className="mt-3 text-xs text-[var(--muted)]">
          Mock generation — no AI API connected. Structure ready for integration.
        </p>
      </section>

      {/* Visual Engine */}
      <section className="mb-8">
        <VisualEngineSection
          projectId={projectId}
          onGenerateVideo={handleGenerateVideo}
          onGenerateThumbnail={handleGenerateThumbnail}
          onGenerateCoverArt={handleGenerateCoverArt}
          videoGenerating={videoGen}
          thumbnailGenerating={thumbGen}
          coverGenerating={coverGen}
        />
      </section>

      {/* Mini-DAW workspace */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
          Workspace
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <StudioWorkspace projectId={projectId} />
        </div>
      </section>
    </div>
  );
}

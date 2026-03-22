"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useJobs } from "../../context/JobsContext";
import { useProjects } from "../../context/ProjectsContext";
import YouTubePackagingPanel from "../../components/YouTubePackagingPanel";
import StudioGenerationCard from "../../components/studio/StudioGenerationCard";
import { JOB_CREDIT_COST } from "../../lib/jobConfig";

export default function YoutubeStudioContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") ?? "";
  const { user } = useAuth();
  const { creditsRemaining, creditsLoading } = useJobs();
  const [generating, setGenerating] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);
  const [packageLoading, setPackageLoading] = useState(false);
  const packagingRef = useRef<HTMLDivElement>(null);
  const {
    projects,
    projectsLoading,
    getProject,
    getYouTubePackage,
    mockGenerateYouTubePackage,
    refreshProjects,
  } = useProjects();

  const project = projectId ? getProject(projectId) : undefined;
  const pkg = projectId ? getYouTubePackage(projectId) : undefined;

  const canAfford = (n: number) =>
    creditsLoading ? true : creditsRemaining >= n;

  const runCoverArt = async () => {
    if (!projectId || !user?.id) return;
    if (!canAfford(JOB_CREDIT_COST.cover_art)) return;
    setCoverLoading(true);
    try {
      const res = await fetch("/api/generate/cover-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) await refreshProjects();
    } finally {
      setCoverLoading(false);
    }
  };

  const runThumbnail = async () => {
    if (!projectId || !user?.id) return;
    if (!canAfford(JOB_CREDIT_COST.thumbnail)) return;
    setThumbLoading(true);
    try {
      const res = await fetch("/api/generate/cover-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) await refreshProjects();
    } finally {
      setThumbLoading(false);
    }
  };

  const runYouTubePackage = async () => {
    if (!user?.id || !projectId) return;
    if (!canAfford(JOB_CREDIT_COST.youtube_package)) return;
    packagingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPackageLoading(true);
    setGenerating(true);
    try {
      await mockGenerateYouTubePackage(projectId);
    } finally {
      setGenerating(false);
      setPackageLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--neon-green)]">
          YouTube Studio
        </p>
        <h1 className="mb-2 text-2xl font-bold text-white">Select a project</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Packaging is tied to a project. Open one below or create a new project first.
        </p>
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/studio/new"
            className="rounded-xl bg-[var(--neon-green)] px-6 py-3 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
          >
            New project
          </Link>
          <Link
            href="/dashboard/projects"
            className="rounded-xl border border-white/20 px-6 py-3 text-sm text-white hover:bg-white/5"
          >
            All projects
          </Link>
          <Link
            href="/studio"
            className="rounded-xl border border-[var(--purple-glow)]/40 px-6 py-3 text-sm text-[var(--purple-glow)]"
          >
            ← Studio hub
          </Link>
        </div>
        {projects.length > 0 && (
          <ul className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            {projects.slice(0, 10).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/studio/youtube?project=${p.id}`}
                  className="block rounded-lg border border-white/5 px-3 py-2.5 text-sm text-white hover:border-[var(--neon-green)]/30"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (projectsLoading && !project) {
    return <div className="px-4 py-10 text-sm text-[var(--muted)]">Loading…</div>;
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-xl font-bold text-white">Project not found</h1>
        <Link href="/dashboard/projects" className="text-[var(--neon-green)] hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const blockYoutubeCards =
    coverLoading || thumbLoading || packageLoading || generating;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-8">
        <Link
          href="/studio"
          className="mb-2 inline-block text-xs text-[var(--muted)] hover:text-[var(--neon-green)]"
        >
          ← Studio hub
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">YouTube Studio</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{project.name}</p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Generate
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <StudioGenerationCard
            icon="🎨"
            title="Generate Cover Art"
            description="Album or single cover art"
            credits={JOB_CREDIT_COST.cover_art}
            busy={coverLoading}
            disabled={
              blockYoutubeCards ||
              !canAfford(JOB_CREDIT_COST.cover_art)
            }
            onGenerate={runCoverArt}
          />
          <StudioGenerationCard
            icon="🖼️"
            title="Generate Thumbnail"
            description="YouTube thumbnail from your art direction"
            credits={JOB_CREDIT_COST.thumbnail}
            busy={thumbLoading}
            disabled={
              blockYoutubeCards ||
              !canAfford(JOB_CREDIT_COST.thumbnail)
            }
            onGenerate={runThumbnail}
          />
          <StudioGenerationCard
            icon="📦"
            title="Generate YouTube Package"
            description="Title, description, tags, thumbnail bundle"
            credits={JOB_CREDIT_COST.youtube_package}
            busy={packageLoading || generating}
            disabled={
              blockYoutubeCards ||
              !canAfford(JOB_CREDIT_COST.youtube_package)
            }
            onGenerate={runYouTubePackage}
          />
          <StudioGenerationCard
            icon="🎬"
            title="Generate Music Video"
            description="Visualizer or short-form video"
            credits={JOB_CREDIT_COST.video}
            comingSoon
          />
        </div>
      </section>

      <div ref={packagingRef} className="scroll-mt-8">
        <YouTubePackagingPanel
          projectId={projectId}
          projectName={project.name}
          data={pkg}
          generating={generating}
          onGenerate={async () => {
            if (!user?.id) return;
            setGenerating(true);
            try {
              await mockGenerateYouTubePackage(projectId);
            } finally {
              setGenerating(false);
            }
          }}
        />
      </div>
    </div>
  );
}

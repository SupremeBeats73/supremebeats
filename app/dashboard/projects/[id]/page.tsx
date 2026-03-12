"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProjects } from "../../../context/ProjectsContext";
import YouTubePackagingPanel from "../../../components/YouTubePackagingPanel";
import type { ProjectAssetKind, ProjectAsset } from "../../../lib/types";

const ASSET_SECTION_LABELS: Record<ProjectAssetKind, string> = {
  beat: "Beats",
  full_song: "Full songs",
  vocals: "Vocals",
  stems: "Stems",
  thumbnail: "Thumbnails",
  cover_art: "Cover art",
  video: "Videos",
  youtube_package: "YouTube packages",
  version: "Versions",
  automation_placeholder: "Automation (placeholder)",
  collab_placeholder: "Collaboration history (placeholder)",
};

const ASSET_ORDER: ProjectAssetKind[] = [
  "beat",
  "full_song",
  "vocals",
  "stems",
  "version",
  "thumbnail",
  "cover_art",
  "video",
  "youtube_package",
  "automation_placeholder",
  "collab_placeholder",
];

function AssetSection({
  kind,
  label,
  items,
}: {
  kind: ProjectAssetKind;
  label: string;
  items: ProjectAsset[];
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 backdrop-blur-sm">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        {label}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">None yet</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
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
                      : a.status === "processing"
                        ? "text-amber-400"
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
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { getProject, getAssets, getYouTubePackage, mockGenerateYouTubePackage, addAsset } = useProjects();
  const project = getProject(id);
  const assets = project ? getAssets(id) : [];
  const youtubePackage = getYouTubePackage(id);
  const [packagingGenerating, setPackagingGenerating] = useState(false);

  const handleGeneratePackaging = async () => {
    setPackagingGenerating(true);
    const hadPackage = !!youtubePackage;
    try {
      await mockGenerateYouTubePackage(id);
      if (!hadPackage) addAsset(id, "youtube_package", "YouTube package");
    } finally {
      setPackagingGenerating(false);
    }
  };

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-[var(--muted)]">Project not found.</p>
        <Link href="/dashboard/projects" className="mt-4 inline-block text-sm text-[var(--neon-green)] hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const assetsByKind = ASSET_ORDER.reduce(
    (acc, kind) => {
      acc[kind] = assets.filter((a) => a.kind === kind);
      return acc;
    },
    {} as Record<ProjectAssetKind, ProjectAsset[]>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/projects"
            className="text-sm text-[var(--muted)] hover:text-white"
          >
            ← Projects
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">{project.name}</h1>
          <p className="text-sm text-[var(--muted)]">
            {project.genre || "—"} · {project.bpm} BPM · {project.key || "—"} · {project.mood || "—"}
          </p>
        </div>
        <Link
          href={`/dashboard/studio?project=${project.id}`}
          className="rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)]"
        >
          Open in Studio
        </Link>
      </div>

      {/* YouTube Packaging — tied to this project */}
      <div className="mb-8">
        <YouTubePackagingPanel
          projectId={id}
          projectName={project.name}
          data={youtubePackage}
          onGenerate={handleGeneratePackaging}
          generating={packagingGenerating}
        />
      </div>

      <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 backdrop-blur-sm">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Project details
        </h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--muted)]">Duration</dt>
            <dd className="text-white">{project.duration}s</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Instruments</dt>
            <dd className="text-white">{project.instruments.length ? project.instruments.join(", ") : "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Reference uploads</dt>
            <dd className="text-white">{project.referenceUploads.length ? project.referenceUploads.length + " file(s)" : "—"}</dd>
          </div>
        </dl>
      </div>

      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
        Generated assets
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {ASSET_ORDER.map((kind) => (
          <AssetSection
            key={kind}
            kind={kind}
            label={ASSET_SECTION_LABELS[kind]}
            items={assetsByKind[kind]}
          />
        ))}
      </div>
    </div>
  );
}

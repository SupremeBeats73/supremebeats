import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { ProjectAssetKind } from "../../../lib/types";
import VersionExportButton from "../VersionExportButton";
import GenerateCoverArtSection from "./GenerateCoverArtSection";
import DeleteProjectButton from "../DeleteProjectButton";

type DbProject = {
  id: string;
  user_id: string;
  name: string;
  genre: string;
  bpm: number;
  key: string;
  mood: string;
  duration: number;
  instruments: string[] | null;
  reference_uploads: string[] | null;
  created_at: string;
  updated_at: string;
};

type DbAsset = {
  id: string;
  project_id: string;
  user_id: string;
  kind: ProjectAssetKind;
  label: string;
  status: "pending" | "processing" | "success" | "failure";
  created_at: string;
  error_message: string | null;
};

type DbVersion = {
  id: string;
  project_id: string;
  user_id: string;
  label: string | null;
  status: string | null;
  created_at: string;
};

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
  label,
  items,
}: {
  label: string;
  items: DbAsset[];
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

function VersionsSection({ versions }: { versions: DbVersion[] }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 backdrop-blur-sm">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        Versions
      </h2>
      {versions.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No versions yet. Generate a new version from this project.
        </p>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-white">
                  {v.label || "Untitled version"}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {new Date(v.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {v.status && (
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-[var(--muted)]">
                    {v.status}
                  </span>
                )}
                <VersionExportButton versionId={v.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function getProjectData(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: project, error: projectError }, { data: assets, error: assetsError }, { data: versions, error: versionsError }] =
    await Promise.all([
      supabase
        .from("projects")
        .select(
          "id, user_id, name, genre, bpm, key, mood, duration, instruments, reference_uploads, created_at, updated_at"
        )
        .eq("id", projectId)
        .eq("user_id", user.id)
        .maybeSingle<DbProject>(),
      supabase
        .from("project_assets")
        .select(
          "id, project_id, user_id, kind, label, status, created_at, error_message"
        )
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as unknown as Promise<{
        data: DbAsset[] | null;
        error: unknown;
      }>,
      supabase
        .from("project_versions")
        .select("id, project_id, user_id, label, status, created_at")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as unknown as Promise<{
        data: DbVersion[] | null;
        error: unknown;
      }>,
    ]);

  if (projectError) {
    console.error("[project/[id]] load project", projectError);
  }
  if (!project) {
    return null;
  }

  if (assetsError) {
    console.error("[project/[id]] load assets", assetsError);
  }
  if (versionsError) {
    console.error("[project/[id]] load versions", versionsError);
  }

  return {
    project,
    assets: assets ?? [],
    versions: versions ?? [],
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getProjectData(params.id);

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-[var(--muted)]">Project not found.</p>
        <Link
          href="/dashboard/projects"
          className="mt-4 inline-block text-sm text-[var(--neon-green)] hover:underline"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  const { project, assets, versions } = data;
  const instruments = project.instruments ?? [];
  const referenceUploads = project.reference_uploads ?? [];

  const anyProcessing =
    assets.some((a) => a.status === "processing") ||
    versions.some((v) => v.status === "processing");
  const anySuccess =
    assets.some((a) => a.status === "success") ||
    versions.some((v) => v.status === "success");
  const derivedStatus = anyProcessing
    ? "Processing"
    : anySuccess
      ? "Ready"
      : "Draft";

  const assetsByKind = ASSET_ORDER.reduce(
    (acc, kind) => {
      acc[kind] = assets.filter((a) => a.kind === kind);
      return acc;
    },
    {} as Record<ProjectAssetKind, DbAsset[]>
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
            {project.genre || "—"} · {project.bpm} BPM ·{" "}
            {project.key || "—"} · {project.mood || "—"} · Status:{" "}
            <span className="text-[var(--neon-green)]">{derivedStatus}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/studio/music?project=${project.id}`}
            className="rounded-xl bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)]"
          >
            Generate new version
          </Link>
          <button
            type="button"
            className="rounded-xl border border-[var(--purple-mid)] bg-black/40 px-4 py-2 text-sm font-semibold text-[var(--muted)] transition-all hover:border-[var(--neon-green)] hover:text-[var(--neon-green)]"
          >
            Export audio
          </button>
          <DeleteProjectButton
            projectId={project.id}
            className="rounded-xl border border-red-500/50 bg-black/40 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
          />
        </div>
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
            <dd className="text-white">
              {instruments.length ? instruments.join(", ") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Reference uploads</dt>
            <dd className="text-white">
              {referenceUploads.length
                ? `${referenceUploads.length} file(s)`
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mb-8">
        <VersionsSection versions={versions} />
      </div>

      <GenerateCoverArtSection projectId={project.id} />

      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
        Generated assets
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {ASSET_ORDER.map((kind) => (
          <AssetSection
            key={kind}
            label={ASSET_SECTION_LABELS[kind]}
            items={assetsByKind[kind]}
          />
        ))}
      </div>
    </div>
  );
}

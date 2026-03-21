"use client";

import Link from "next/link";
import { useProjects } from "../../context/ProjectsContext";
import { useSearchParams } from "next/navigation";
import DeleteProjectButton from "./DeleteProjectButton";

export default function ProjectsPage() {
  const { projects, projectsLoading } = useProjects();
  const searchParams = useSearchParams();
  const deleted = searchParams.get("deleted") === "1";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Projects</h1>
          <p className="text-sm text-[var(--muted)]">
            Your saved projects. Open in Studio to generate beats, songs, and assets.
          </p>
        </div>
        <Link
          href="/studio"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)]"
        >
          New project
        </Link>
      </div>

      {deleted && (
        <div
          className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
          role="status"
        >
          Project deleted successfully.
        </div>
      )}

      {projectsLoading ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]/50 p-12 text-center">
          <p className="text-[var(--muted)]">Loading projects…</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/50 p-12 text-center">
          <p className="mb-4 text-[var(--muted)]">No projects yet.</p>
          <Link
            href="/studio"
            className="inline-block rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)]"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 backdrop-blur-sm">
                <div>
                  <h2 className="font-semibold text-white">{p.name}</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {p.genre || "—"} · {p.bpm} BPM · {p.key || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Link
                    href={`/dashboard/projects/${p.id}`}
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
                  >
                    Detail
                  </Link>
                  <Link
                    href={`/studio/music?project=${p.id}`}
                    className="inline-flex min-h-[44px] items-center rounded-lg bg-[var(--neon-green)] px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Open in Studio
                  </Link>
                  <DeleteProjectButton projectId={p.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

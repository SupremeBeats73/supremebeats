"use client";

import Link from "next/link";
import { useProjects } from "../../context/ProjectsContext";

export default function ProjectsPage() {
  const { projects, projectsLoading } = useProjects();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-[var(--muted)]">
            Your saved projects. Open in Studio to generate beats, songs, and assets.
          </p>
        </div>
        <Link
          href="/dashboard/studio/new"
          className="rounded-xl bg-[var(--neon-green)] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)]"
        >
          New project
        </Link>
      </div>

      {projectsLoading ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)]/50 p-12 text-center">
          <p className="text-[var(--muted)]">Loading projects…</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/50 p-12 text-center">
          <p className="mb-4 text-[var(--muted)]">No projects yet.</p>
          <Link
            href="/dashboard/studio/new"
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
                <div className="flex gap-3">
                  <Link
                    href={`/dashboard/projects/${p.id}`}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
                  >
                    Detail
                  </Link>
                  <Link
                    href={`/dashboard/studio?project=${p.id}`}
                    className="rounded-lg bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Open in Studio
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

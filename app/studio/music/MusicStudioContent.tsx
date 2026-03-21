"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProjects } from "../../context/ProjectsContext";
import StudioWorkspace from "../../components/StudioWorkspace";
import VersionExportButton from "../../dashboard/projects/VersionExportButton";
import { supabase } from "../../lib/supabaseClient";
import type { ProjectUpdatePatch } from "../../lib/supabaseProjects";

type VersionRow = {
  id: string;
  label: string | null;
  status: string | null;
  created_at: string;
};

export default function MusicStudioContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const { user } = useAuth();
  const {
    projects,
    projectsLoading,
    getProject,
    updateProject,
    refreshProjects,
  } = useProjects();

  const project = projectId ? getProject(projectId) : undefined;

  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState("");
  const [mood, setMood] = useState("");
  const [duration, setDuration] = useState(180);
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [vocalStyle, setVocalStyle] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setGenre(project.genre);
    setBpm(project.bpm);
    setKey(project.key);
    setMood(project.mood);
    setDuration(project.duration);
    setPrompt(project.prompt ?? "");
    setLyrics(project.lyrics ?? "");
    setVocalStyle(project.vocalStyle ?? "");
  }, [project]);

  useEffect(() => {
    if (!projectId || !user?.id) {
      setVersions([]);
      return;
    }
    let cancelled = false;
    setVersionsLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("project_versions")
        .select("id, label, status, created_at")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (!error && data) {
        setVersions(data as VersionRow[]);
      } else {
        setVersions([]);
      }
      setVersionsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, user?.id]);

  const persistProject = useCallback(async () => {
    if (!projectId) throw new Error("No project selected");
    const patch: ProjectUpdatePatch = {
      name: name.trim() || "Untitled Project",
      genre,
      bpm: Number.isFinite(bpm) ? Math.min(300, Math.max(40, bpm)) : 120,
      key,
      mood,
      duration: Number.isFinite(duration) ? Math.max(8, duration) : 180,
      prompt: prompt.trim(),
      lyrics: lyrics.trim(),
      vocalStyle: vocalStyle.trim(),
    };
    await updateProject(projectId, patch);
  }, [
    projectId,
    name,
    genre,
    bpm,
    key,
    mood,
    duration,
    prompt,
    lyrics,
    vocalStyle,
    updateProject,
  ]);

  const handleSaveProject = async () => {
    setSaveState("saving");
    try {
      await persistProject();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  };

  if (!projectId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--neon-green)]">
          Music Studio
        </p>
        <h1 className="mb-2 text-2xl font-bold text-white">Open a project</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Create a new project or pick one to generate beats and full songs.
        </p>
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/studio/new"
            className="rounded-xl bg-[var(--neon-green)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[var(--neon-green-dim)]"
          >
            New project
          </Link>
          <Link
            href="/dashboard/projects"
            className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
          >
            All projects
          </Link>
          <Link
            href="/studio"
            className="rounded-xl border border-[var(--purple-glow)]/40 px-6 py-3 text-sm text-[var(--purple-glow)] hover:bg-white/5"
          >
            ← Studio hub
          </Link>
        </div>
        {projects.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Recent projects
            </p>
            <ul className="space-y-2">
              {projects.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/studio/music?project=${p.id}`}
                    className="block rounded-lg border border-white/5 bg-black/30 px-3 py-2.5 text-sm text-white transition hover:border-[var(--neon-green)]/30"
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

  if (projectsLoading && !project) {
    return (
      <div className="px-4 py-10 text-sm text-[var(--muted)]">Loading project…</div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-xl font-bold text-white">Project not found</h1>
        <p className="mb-4 text-sm text-[var(--muted)]">
          This project isn&apos;t available. Open another from Projects.
        </p>
        <Link
          href="/dashboard/projects"
          className="text-[var(--neon-green)] hover:underline"
        >
          View projects
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--purple-glow)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--purple-glow)]/30";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/studio"
            className="mb-2 inline-block text-xs text-[var(--muted)] hover:text-[var(--neon-green)]"
          >
            ← Studio hub
          </Link>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Music Studio</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {project.name} · single-page generation & export
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5"
          >
            Project detail
          </Link>
          <Link
            href="/dashboard/studio/new"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
          >
            New project
          </Link>
        </div>
      </div>

      {/* Project form */}
      <section className="mb-10 rounded-2xl border border-[var(--purple-glow)]/20 bg-[#0a0810] p-6 shadow-[0_0_32px_rgba(124,58,237,0.12)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Project
          </h2>
          <div className="flex items-center gap-2">
            {saveState === "saved" && (
              <span className="text-xs text-[var(--neon-green)]">Saved</span>
            )}
            {saveState === "error" && (
              <span className="text-xs text-red-400">Save failed</span>
            )}
            <button
              type="button"
              onClick={() => void handleSaveProject()}
              disabled={saveState === "saving"}
              className="rounded-xl bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black hover:bg-[var(--neon-green-dim)] disabled:opacity-60"
            >
              {saveState === "saving" ? "Saving…" : "Save project"}
            </button>
          </div>
        </div>
        <p className="mb-4 text-xs text-[var(--muted)]">
          Generations use these saved fields (genre, mood, BPM, key, lyrics, etc.). Save
          before generating, or use Generate — we save automatically first.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Name
            </label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Genre</label>
            <input className={inputClass} value={genre} onChange={(e) => setGenre(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Mood</label>
            <input className={inputClass} value={mood} onChange={(e) => setMood(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">BPM</label>
            <input
              type="number"
              min={40}
              max={300}
              className={inputClass}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Key</label>
            <input className={inputClass} value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Duration (sec)
            </label>
            <input
              type="number"
              min={8}
              max={600}
              className={inputClass}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Vocal style
            </label>
            <input
              className={inputClass}
              value={vocalStyle}
              onChange={(e) => setVocalStyle(e.target.value)}
              placeholder="e.g. melodic rap, airy falsetto"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
              Direction / prompt
            </label>
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the track for the AI…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Lyrics</label>
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Optional — section tags like [verse] / [chorus] work well."
            />
          </div>
        </div>
      </section>

      {/* Workspace: waveform + dual generate (sidebar) */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Mix & generate
        </h2>
        <StudioWorkspace
          projectId={projectId}
          initialBpm={bpm}
          initialKey={key}
          initialGenre={genre}
          onPersistBeforeGenerate={persistProject}
          tracks={
            project.referenceUploads?.length
              ? project.referenceUploads.map((url, i) => ({
                  id: `ref-${i}`,
                  label: `Reference ${i + 1}`,
                  url,
                }))
              : undefined
          }
          onGenerated={() => {
            void refreshProjects();
            void (async () => {
              if (!user?.id) return;
              const { data } = await supabase
                .from("project_versions")
                .select("id, label, status, created_at")
                .eq("project_id", projectId)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
              if (data) setVersions(data as VersionRow[]);
            })();
          }}
        />
      </section>

      {/* Versions + export */}
      <section className="rounded-2xl border border-white/10 bg-[#08060c] p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Version history
        </h2>
        {versionsLoading ? (
          <p className="text-sm text-[var(--muted)]">Loading versions…</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No versions yet. Generate a beat or full song to create one.
          </p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">{v.label ?? "Version"}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(v.created_at).toLocaleString()} · {v.status ?? "—"}
                  </p>
                </div>
                <VersionExportButton versionId={v.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

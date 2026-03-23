"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProjects } from "../../context/ProjectsContext";
import StudioWorkspace, {
  type StudioWorkspaceHandle,
} from "../../components/StudioWorkspace";
import StudioGenerationCard from "../../components/studio/StudioGenerationCard";
import CustomSelect from "../../components/CustomSelect";
import { JOB_CREDIT_COST } from "../../lib/jobConfig";
import VersionExportButton from "../../dashboard/projects/VersionExportButton";
import { supabase } from "../../lib/supabaseClient";
import type { ProjectUpdatePatch } from "../../lib/supabaseProjects";

const STUDIO_PROMPT_META_PREFIX = "SBMETA_JSON";

function packStudioPromptMeta(meta: Record<string, string>, rest: string): string {
  return `${STUDIO_PROMPT_META_PREFIX}${JSON.stringify(meta)}\n${rest}`;
}

function unpackStudioPromptMeta(full: string): { meta: Record<string, string>; rest: string } {
  const s = full.trim();
  if (!s.startsWith(STUDIO_PROMPT_META_PREFIX)) return { meta: {}, rest: s };
  const nl = s.indexOf("\n");
  if (nl <= STUDIO_PROMPT_META_PREFIX.length) return { meta: {}, rest: s };
  try {
    const raw = s.slice(STUDIO_PROMPT_META_PREFIX.length, nl);
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { meta: {}, rest: s };
    }
    const meta: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") meta[k] = v;
    }
    return { meta, rest: s.slice(nl + 1) };
  } catch {
    return { meta: {}, rest: s };
  }
}

const GENRE_PRESETS = [
  "Lo-Fi",
  "Trap",
  "R&B",
  "Hip Hop",
  "Pop",
  "Electronic",
  "Jazz",
  "Drill",
  "Afrobeats",
] as const;

const TIER1_MOODS = [
  "Chill",
  "Dark",
  "Hype",
  "Emotional",
  "Uplifting",
  "Aggressive",
] as const;

const KEYS_ROOT = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const SONG_STRUCTURES = [
  "Verse-Chorus",
  "Verse-Chorus-Bridge",
  "Intro-Verse-Chorus-Outro",
] as const;

const SONG_LENGTHS = [60, 90, 120, 180, 240] as const;

const INSTRUMENT_OPTIONS = [
  "Drums",
  "Bass",
  "Piano",
  "Guitar",
  "Strings",
  "Synth",
  "Brass",
  "Vocals",
] as const;

const VOCAL_STYLE_OPTIONS = [
  "Male Rap",
  "Female Rap",
  "Male Singing",
  "Female Singing",
  "Voiceless",
] as const;

const KEY_SELECT_OPTIONS = KEYS_ROOT.flatMap((r) => [
  { value: `${r} major`, label: `${r} major` },
  { value: `${r} minor`, label: `${r} minor` },
]);

function nearestSongLength(sec: number): number {
  return SONG_LENGTHS.reduce((best, n) =>
    Math.abs(n - sec) < Math.abs(best - sec) ? n : best
  );
}

const NEW_PROJECT_DESC_PLACEHOLDER =
  "Describe exactly what you want — e.g. Chill lo-fi beat with piano, vinyl crackle, 90 BPM, C minor, no vocals, relaxed and dreamy mood";

const TRACK_DESC_HELPER =
  "The more detail you give, the better your generation will be.";

type VersionRow = {
  id: string;
  label: string | null;
  status: string | null;
  created_at: string;
};

export default function MusicStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const { user } = useAuth();
  const {
    projects,
    projectsLoading,
    getProject,
    updateProject,
    refreshProjects,
    createProject,
  } = useProjects();

  const project = projectId ? getProject(projectId) : undefined;

  const [musicTab, setMusicTab] = useState<"beat" | "full_song">("beat");
  const [genrePreset, setGenrePreset] = useState<string>("Electronic");
  const [customGenre, setCustomGenre] = useState("");
  const [mood, setMood] = useState("");
  const [bpm, setBpm] = useState(120);
  const [keySelect, setKeySelect] = useState("C minor");
  const [name, setName] = useState("");
  const [durationState, setDurationState] = useState<number>(120);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [songStructure, setSongStructure] = useState<string>("Verse-Chorus");
  const [artistReference, setArtistReference] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [lyricsDetailsEnabled, setLyricsDetailsEnabled] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [vocalStyleSelect, setVocalStyleSelect] = useState("Male Rap");
  /** Creative brief stored after SBMETA line in `prompt` — sent first to MiniMax. */
  const [trackDescription, setTrackDescription] = useState("");
  const [editingTrackDescription, setEditingTrackDescription] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const [creatingDescription, setCreatingDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const workspaceRef = useRef<StudioWorkspaceHandle>(null);
  const [pendingMusicAction, setPendingMusicAction] = useState<
    null | "beat" | "full_song" | "stems"
  >(null);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const genreValue =
    genrePreset === "Custom" ? (customGenre.trim() || "Custom") : genrePreset;

  useEffect(() => {
    if (!project) return;
    setName(project.name);
    const g = project.genre?.trim() ?? "";
    if ((GENRE_PRESETS as readonly string[]).includes(g)) {
      setGenrePreset(g);
      setCustomGenre("");
    } else {
      setGenrePreset("Custom");
      setCustomGenre(g);
    }
    const b = project.bpm;
    setBpm(Number.isFinite(b) ? Math.min(200, Math.max(60, Math.round(b))) : 120);
    const k = project.key?.trim() ?? "";
    setKeySelect(
      KEY_SELECT_OPTIONS.some((o) => o.value === k) ? k : KEY_SELECT_OPTIONS[0]?.value ?? "C minor"
    );
    setMood(
      (TIER1_MOODS as readonly string[]).includes(project.mood ?? "")
        ? (project.mood ?? "")
        : ""
    );
    const d = project.duration;
    setDurationState(nearestSongLength(Number.isFinite(d) ? d : 120));

    const { meta, rest } = unpackStudioPromptMeta(project.prompt ?? "");
    setTrackDescription(rest);
    setMusicTab(meta.tab === "full_song" ? "full_song" : "beat");
    setSongStructure(
      (SONG_STRUCTURES as readonly string[]).includes(meta.structure ?? "")
        ? (meta.structure as string)
        : "Verse-Chorus"
    );
    setArtistReference(meta.artist ?? "");
    setLyricsDetailsEnabled(meta.lyricsDetails === "1");

    const vs = project.vocalStyle?.trim() ?? "";
    const energySep = " · lyric performance energy: ";
    let vocalPick = "Male Rap";
    if (meta.vocalLine && (VOCAL_STYLE_OPTIONS as readonly string[]).includes(meta.vocalLine)) {
      vocalPick = meta.vocalLine;
    } else if (vs.includes(energySep)) {
      const base = vs.split(energySep)[0]?.trim() ?? "";
      if ((VOCAL_STYLE_OPTIONS as readonly string[]).includes(base)) vocalPick = base;
    } else if ((VOCAL_STYLE_OPTIONS as readonly string[]).includes(vs)) {
      vocalPick = vs;
    }
    setVocalStyleSelect(vocalPick);

    setLyrics(project.lyrics ?? "");
    const inst = Array.isArray(project.instruments) ? project.instruments : [];
    setInstruments(INSTRUMENT_OPTIONS.filter((x) => inst.includes(x)));
    setEditingProjectName(false);
    setEditingTrackDescription(false);
  }, [project]);

  const handleCreateProject = useCallback(async () => {
    setCreateError(null);
    if (!creatingName.trim()) {
      setCreateError("Project name is required.");
      return;
    }
    if (!creatingDescription.trim()) {
      setCreateError("Track description is required.");
      return;
    }
    setCreateSubmitting(true);
    try {
      const promptBody = packStudioPromptMeta(
        {
          tab: "beat",
          structure: "Verse-Chorus",
          artist: "",
          lyricsDetails: "0",
          vocalLine: "Male Rap",
          hasReference: "0",
        },
        creatingDescription.trim()
      );
      const newProject = await createProject({
        name: creatingName.trim(),
        genre: "Electronic",
        bpm: 120,
        key: "C minor",
        mood: "",
        duration: 120,
        instruments: [],
        prompt: promptBody,
        referenceUploads: [],
      });
      await refreshProjects();
      router.push(`/studio/music?project=${newProject.id}`);
      setCreatingName("");
      setCreatingDescription("");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Could not create project.");
    } finally {
      setCreateSubmitting(false);
    }
  }, [creatingName, creatingDescription, createProject, refreshProjects, router]);

  useEffect(() => {
    if (!projectId || !user?.id) {
      setVersions([]);
      return;
    }
    let cancelled = false;
    setVersionsLoading(true);
    void (async () => {
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
    const p = getProject(projectId);
    const meta: Record<string, string> = {
      tab: musicTab,
      structure: songStructure,
      artist: artistReference.trim(),
      lyricsDetails: lyricsDetailsEnabled ? "1" : "0",
      vocalLine: vocalStyleSelect,
      hasReference: p?.referenceUploads?.length ? "1" : "0",
    };
    const promptForDb = packStudioPromptMeta(meta, trackDescription.trim());

    let vocalStyleOut: string | undefined;
    if (musicTab === "full_song" && lyricsDetailsEnabled) {
      vocalStyleOut = vocalStyleSelect;
    }

    const patch: ProjectUpdatePatch = {
      name: name.trim() || "Untitled Project",
      genre: genreValue,
      bpm: Number.isFinite(bpm) ? Math.min(200, Math.max(60, Math.round(bpm))) : 120,
      key: keySelect,
      mood,
      duration: durationState,
      prompt: promptForDb,
      lyrics: lyrics.trim(),
      instruments,
    };
    if (vocalStyleOut !== undefined) {
      patch.vocalStyle = vocalStyleOut;
    }
    await updateProject(projectId, patch);
  }, [
    projectId,
    getProject,
    name,
    genreValue,
    bpm,
    keySelect,
    mood,
    durationState,
    musicTab,
    songStructure,
    artistReference,
    lyricsDetailsEnabled,
    vocalStyleSelect,
    trackDescription,
    lyrics,
    instruments,
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

  const toggleInstrument = (inst: string) => {
    setInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const handleReferenceFile = async (file: File | null) => {
    if (!file || !projectId) return;
    setReferenceUploading(true);
    try {
      const form = new FormData();
      form.append("projectId", projectId);
      form.append("file", file);
      const res = await fetch("/api/upload/reference", { method: "POST", body: form });
      if (res.ok) await refreshProjects();
    } finally {
      setReferenceUploading(false);
      if (referenceInputRef.current) referenceInputRef.current.value = "";
    }
  };

  if (!projectId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--neon-green)]">
          Music Studio
        </p>
        <h1 className="mb-2 text-2xl font-bold text-white">Create or open a project</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Start with a name and track description — then tune genre, mood, BPM, and key in the studio.
        </p>

        <div className="mb-10 rounded-2xl border border-[#6E2CF2]/25 bg-[#0a0810] p-6 shadow-[0_0_32px_rgba(110,44,242,0.12)]">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            New project
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--muted)]">
                Project name <span className="text-red-400">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[#6E2CF2]/50 focus:outline-none focus:ring-1 focus:ring-[#6E2CF2]/30"
                value={creatingName}
                onChange={(e) => setCreatingName(e.target.value)}
                placeholder="My track"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--muted)]">
                Track description <span className="text-red-400">*</span>
              </label>
              <textarea
                className="min-h-[140px] w-full rounded-lg border border-white/10 bg-black/50 px-3 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[#6E2CF2]/50 focus:outline-none focus:ring-1 focus:ring-[#6E2CF2]/30"
                value={creatingDescription}
                onChange={(e) => setCreatingDescription(e.target.value)}
                placeholder={NEW_PROJECT_DESC_PLACEHOLDER}
                required
              />
              <p className="mt-2 text-xs text-[var(--muted)]">{TRACK_DESC_HELPER}</p>
            </div>
            {createError && <p className="text-sm text-red-400">{createError}</p>}
            <button
              type="button"
              disabled={createSubmitting}
              onClick={() => void handleCreateProject()}
              className="w-full rounded-xl bg-[var(--neon-green)] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[var(--neon-green-dim)] disabled:opacity-60"
            >
              {createSubmitting ? "Creating…" : "Create project"}
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
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
    "w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-[var(--muted)] focus:border-[#6E2CF2]/50 focus:outline-none focus:ring-1 focus:ring-[#6E2CF2]/30";

  const genreOptions = [
    ...GENRE_PRESETS.map((g) => ({ value: g, label: g })),
    { value: "Custom", label: "Custom" },
  ];

  const structureOptions = SONG_STRUCTURES.map((s) => ({ value: s, label: s }));

  const lengthOptions = SONG_LENGTHS.map((n) => ({
    value: String(n),
    label: `${n}s`,
  }));

  const vocalOptions = VOCAL_STYLE_OPTIONS.map((v) => ({ value: v, label: v }));

  const lyricsPlaceholder = `[verse]
Paint the picture, line by line…

[chorus]
This is the hook — big, memorable, repeat it twice.`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link
            href="/studio"
            className="mb-2 inline-block text-xs text-[var(--muted)] hover:text-[var(--neon-green)]"
          >
            ← Studio hub
          </Link>
          {editingProjectName ? (
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className={`${inputClass} max-w-md py-2.5 text-base`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Project name"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveProject().then(() => setEditingProjectName(false))}
                  disabled={saveState === "saving"}
                  className="rounded-lg bg-[var(--neon-green)] px-3 py-2 text-xs font-semibold text-black hover:bg-[var(--neon-green-dim)] disabled:opacity-60"
                >
                  Save name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName(project.name);
                    setEditingProjectName(false);
                  }}
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{project.name}</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">Music Studio · generation &amp; export</p>
              <button
                type="button"
                onClick={() => setEditingProjectName(true)}
                className="mt-2 text-xs font-medium text-[var(--neon-green)] hover:underline"
              >
                Rename project
              </button>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/5"
          >
            Project detail
          </Link>
          <Link
            href="/studio/music"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
          >
            New project
          </Link>
        </div>
      </div>

      {/* Project form — three-tier layout */}
      <section className="mb-10 rounded-2xl border border-[#6E2CF2]/25 bg-[#0a0810] p-6 shadow-[0_0_32px_rgba(110,44,242,0.15)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Project setup
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
        <p className="mb-6 text-xs text-[var(--muted)]">
          Your track description drives generation; technical settings below refine it. Save before
          generating, or use Generate — we save automatically first.
        </p>

        {/* Tab toggles */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMusicTab("beat")}
            className={`rounded-2xl border-2 px-4 py-4 text-center text-base font-bold transition-all duration-300 sm:text-lg ${
              musicTab === "beat"
                ? "border-[#6E2CF2] bg-[#6E2CF2]/20 text-white shadow-[0_0_28px_rgba(110,44,242,0.55)]"
                : "border-white/10 bg-black/50 text-[var(--muted)] hover:border-white/20"
            }`}
          >
            Beat
          </button>
          <button
            type="button"
            onClick={() => setMusicTab("full_song")}
            className={`rounded-2xl border-2 px-4 py-4 text-center text-base font-bold transition-all duration-300 sm:text-lg ${
              musicTab === "full_song"
                ? "border-[#6E2CF2] bg-[#6E2CF2]/20 text-white shadow-[0_0_28px_rgba(110,44,242,0.55)]"
                : "border-white/10 bg-black/50 text-[var(--muted)] hover:border-white/20"
            }`}
          >
            Full Song
          </button>
        </div>

        <div key={musicTab} className="transition-opacity duration-300">
          {/* Track description (read-only + edit) */}
          <div className="mb-8 rounded-xl border border-[#6E2CF2]/20 bg-black/35 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Track description
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{TRACK_DESC_HELPER}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTrackDescription((v) => !v)}
                className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:border-[var(--neon-green)]/40 hover:text-[var(--neon-green)]"
              >
                {editingTrackDescription ? "Done" : "Edit"}
              </button>
            </div>
            {editingTrackDescription ? (
              <textarea
                className={`${inputClass} min-h-[140px] text-sm`}
                value={trackDescription}
                onChange={(e) => setTrackDescription(e.target.value)}
                placeholder={NEW_PROJECT_DESC_PLACEHOLDER}
              />
            ) : (
              <div className="rounded-lg border border-white/5 bg-black/40 px-3 py-3 text-sm leading-relaxed text-white/90">
                {trackDescription.trim() ? (
                  <p className="whitespace-pre-wrap">{trackDescription}</p>
                ) : (
                  <p className="text-[var(--muted)]">
                    No description yet. Click <span className="text-white/80">Edit</span> to add
                    what you want the AI to make.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick technical settings */}
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                Genre
              </label>
              <CustomSelect
                value={genrePreset}
                onChange={setGenrePreset}
                options={genreOptions}
                placeholder="Genre"
                aria-label="Genre"
                className="text-base [&_button]:min-h-[48px] [&_button]:py-3 [&_button]:text-base"
              />
              {genrePreset === "Custom" && (
                <input
                  className={`${inputClass} mt-3 py-3 text-base`}
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  placeholder="Describe your genre"
                />
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                {musicTab === "full_song" ? "Mood & energy" : "Mood"}
              </p>
              <div className="flex flex-wrap gap-2">
                {TIER1_MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(mood === m ? "" : m)}
                    className={`rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all sm:px-5 sm:text-base ${
                      mood === m
                        ? "border-[var(--neon-green)] bg-[var(--neon-green)]/15 text-white shadow-[0_0_20px_rgba(34,197,94,0.45)]"
                        : "border-white/15 bg-black/40 text-[var(--muted)] hover:border-white/25"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                  BPM
                </label>
                <input
                  type="range"
                  min={60}
                  max={200}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="h-3 w-full cursor-pointer accent-[#6E2CF2]"
                />
              </div>
              <div className="flex shrink-0 items-baseline gap-1 sm:pl-4">
                <span className="text-4xl font-bold tabular-nums text-white">{bpm}</span>
                <span className="text-sm text-[var(--muted)]">BPM</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                Musical key
              </label>
              <CustomSelect
                value={keySelect}
                onChange={setKeySelect}
                options={KEY_SELECT_OPTIONS}
                placeholder="Key"
                aria-label="Musical key"
                className="text-base [&_button]:min-h-[48px] [&_button]:py-3 [&_button]:text-base"
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            className="mt-8 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-[var(--muted)] transition hover:border-white/20 hover:text-white"
          >
            <span>Advanced Settings</span>
            <svg
              className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                advancedOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              advancedOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="mt-3 space-y-5 rounded-xl border border-white/10 bg-[#12101a] p-5">
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    Instruments
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {INSTRUMENT_OPTIONS.map((inst) => (
                      <label
                        key={inst}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white hover:border-[#6E2CF2]/40"
                      >
                        <input
                          type="checkbox"
                          checked={instruments.includes(inst)}
                          onChange={() => toggleInstrument(inst)}
                          className="h-4 w-4 rounded border-white/20 accent-[var(--neon-green)]"
                        />
                        {inst}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[var(--muted)]">
                      Song structure
                    </label>
                    <CustomSelect
                      value={songStructure}
                      onChange={setSongStructure}
                      options={structureOptions}
                      aria-label="Song structure"
                      className="[&_button]:min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[var(--muted)]">
                      Song length
                    </label>
                    <CustomSelect
                      value={String(durationState)}
                      onChange={(v) => setDurationState(Number(v))}
                      options={lengthOptions}
                      aria-label="Song length"
                      className="[&_button]:min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--muted)]">
                    Artist reference
                  </label>
                  <input
                    className={inputClass}
                    value={artistReference}
                    onChange={(e) => setArtistReference(e.target.value)}
                    placeholder="e.g. Drake, Kendrick, SZA"
                  />
                </div>

                <div>
                  <input
                    ref={referenceInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => void handleReferenceFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    disabled={referenceUploading}
                    onClick={() => referenceInputRef.current?.click()}
                    className="rounded-xl border border-[#6E2CF2]/50 bg-[#6E2CF2]/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-[0_0_20px_rgba(110,44,242,0.4)] disabled:opacity-50"
                  >
                    {referenceUploading ? "Uploading…" : "Upload reference audio"}
                  </button>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Uses your project reference slot (same as studio new project).
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* Tier 3 — Full Song only */}
          {musicTab === "full_song" && (
            <div className="mt-6">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                  lyricsDetailsEnabled
                    ? "border-[var(--neon-green)] bg-[var(--neon-green)]/10 shadow-[0_0_22px_rgba(34,197,94,0.35)]"
                    : "border-white/10 bg-black/30 hover:border-white/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={lyricsDetailsEnabled}
                  onChange={(e) => setLyricsDetailsEnabled(e.target.checked)}
                  className="h-5 w-5 accent-[var(--neon-green)]"
                />
                <span className="text-sm font-semibold text-white">
                  Add Lyrics and Vocal Details
                </span>
              </label>

              <div
                className={`mt-3 grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  lyricsDetailsEnabled ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-5 rounded-xl border border-[var(--neon-green)]/20 bg-[#0d120f] p-5">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-[var(--muted)]">
                        Lyrics
                      </label>
                      <textarea
                        className={`${inputClass} min-h-[160px] text-base`}
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        placeholder={lyricsPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-[var(--muted)]">
                        Vocal style
                      </label>
                      <CustomSelect
                        value={vocalStyleSelect}
                        onChange={setVocalStyleSelect}
                        options={vocalOptions}
                        aria-label="Vocal style"
                        className="[&_button]:min-h-[48px] [&_button]:text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate — tab-specific */}
        <div className="mt-10 space-y-3">
          {musicTab === "beat" ? (
            <button
              type="button"
              disabled={!!pendingMusicAction}
              onClick={() => {
                setPendingMusicAction("beat");
                void (async () => {
                  try {
                    await workspaceRef.current?.generateBeat();
                  } finally {
                    setPendingMusicAction(null);
                  }
                })();
              }}
              className="group relative w-full overflow-hidden rounded-2xl border-2 border-[#6E2CF2] bg-gradient-to-br from-[#6E2CF2]/30 to-black py-5 text-lg font-bold text-white transition hover:shadow-[0_0_40px_rgba(110,44,242,0.65)] disabled:opacity-50"
            >
              <span className="relative z-10 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
                <span>Generate Beat</span>
                <span className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-[var(--neon-green)] shadow-[0_0_12px_rgba(34,197,94,0.5)]">
                  {JOB_CREDIT_COST.beat} credits
                </span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!!pendingMusicAction}
              onClick={() => {
                setPendingMusicAction("full_song");
                void (async () => {
                  try {
                    await workspaceRef.current?.generateFullSong();
                  } finally {
                    setPendingMusicAction(null);
                  }
                })();
              }}
              className="group relative w-full overflow-hidden rounded-2xl border-2 border-[#6E2CF2] bg-gradient-to-br from-[#6E2CF2]/25 to-black py-5 text-lg font-bold text-white transition hover:shadow-[0_0_40px_rgba(110,44,242,0.65)] disabled:opacity-50"
            >
              <span className="relative z-10 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
                <span>Generate Full Song</span>
                <span className="rounded-full bg-black/50 px-3 py-1 text-sm font-bold text-[var(--neon-green)] shadow-[0_0_12px_rgba(34,197,94,0.5)]">
                  {JOB_CREDIT_COST.full_song} credits
                </span>
              </span>
            </button>
          )}
          {pendingMusicAction && (
            <p className="text-center text-xs text-[var(--muted)]">Starting generation…</p>
          )}
        </div>
      </section>

      {/* Generation cards — stems + optional vocals only */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          More generation
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <StudioGenerationCard
            icon="🎛️"
            title="Generate Stems"
            description="Separated stems from your track"
            credits={JOB_CREDIT_COST.stems}
            busy={pendingMusicAction === "stems"}
            disabled={!!pendingMusicAction}
            onGenerate={async () => {
              setPendingMusicAction("stems");
              try {
                await workspaceRef.current?.splitStems();
              } finally {
                setPendingMusicAction(null);
              }
            }}
          />
          <StudioGenerationCard
            icon="🎙️"
            title="Generate Optional Vocals"
            description="Add vocal stems or top-line"
            credits={JOB_CREDIT_COST.vocals}
            comingSoon
          />
        </div>
      </section>

      {/* Mix: transport + timeline + version history (no duplicate BPM/Key sidebar) */}
      <section className="mb-10 rounded-2xl border border-white/10 bg-[#08060c]/90 p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Mix &amp; generate
        </h2>
        <StudioWorkspace
          ref={workspaceRef}
          projectId={projectId}
          initialBpm={bpm}
          initialKey={keySelect}
          initialGenre={genreValue}
          onPersistBeforeGenerate={persistProject}
          hideGenerationActionButtons
          hideGenerationSidebar
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

        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Version history
          </h3>
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
        </div>
      </section>
    </div>
  );
}

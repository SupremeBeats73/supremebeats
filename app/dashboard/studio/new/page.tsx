"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { useProjects } from "../../../context/ProjectsContext";
import CustomSelect from "../../../components/CustomSelect";

const GENRES = ["Hip-Hop", "R&B", "Pop", "Electronic", "Trap", "Lo-Fi", "Other"];
const MOODS = ["Chill", "Energetic", "Dark", "Uplifting", "Melancholic", "Aggressive", "Other"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const INSTRUMENT_OPTIONS = ["Drums", "Bass", "Keys", "Synth", "Strings", "Guitar", "Vocal", "FX"];

export default function NewProjectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { createProject, refreshProjects } = useProjects();
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState("");
  const [mood, setMood] = useState("");
  const [duration, setDuration] = useState(180);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(""); // describe your track (Suno-style, for AI generation)
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleInstrument = (inst: string) => {
    setInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[NewProject] Submitting project", {
          hasUser: !!user,
          userId: user?.id ?? null,
          authLoading,
          name,
          genre,
          bpm,
          key,
          mood,
          duration,
          instruments,
          referenceUploads: [],
        });
      }

      if (authLoading) {
        setSubmitError("Checking sign-in…");
        return;
      }
      if (!user?.id) {
        if (process.env.NODE_ENV === "development") {
          console.error("[NewProject] No authenticated user; cannot create project.");
        }
        setSubmitError("You must be signed in to create a project.");
        return;
      }

      const project = await createProject({
        name: name || "Untitled Project",
        genre,
        bpm,
        key,
        mood,
        duration,
        instruments,
        prompt: prompt.trim() || undefined,
        referenceUploads: [],
      });

      if (!project || !project.id) {
        console.error("[NewProject] Project created without a valid id", project);
        setSubmitError(
          "Project was created, but it did not return a valid id. Please try again."
        );
        return;
      }

      // Optional: upload reference audio if provided
      if (referenceFile) {
        const form = new FormData();
        form.append("projectId", project.id);
        form.append("file", referenceFile);
        try {
          const res = await fetch("/api/upload/reference", {
            method: "POST",
            body: form,
          });
          if (res.ok) {
            await refreshProjects();
          } else {
            const data = await res.json().catch(() => ({}));
            console.warn(
              "[NewProject] reference upload failed",
              data.error || res.statusText
            );
          }
        } catch (e) {
          console.warn("[NewProject] reference upload error", e);
        }
      }

      const target = `/studio/music?project=${project.id}`;
      if (process.env.NODE_ENV === "development") {
        console.log("[NewProject] Navigating to Studio with project", {
          projectId: project.id,
          target,
        });
      }

      try {
        router.push(target);
      } catch (err) {
        console.error("[NewProject] Navigation to Studio failed", err);
        setSubmitError(
          "Project was created, but opening the Studio failed. You can open it from your Projects page."
        );
      }
    } catch (err) {
      const raw =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err);
      const message = (raw && raw.trim()) || "";
      const isRls =
        message.length > 0 &&
        (message.toLowerCase().includes("row-level security") ||
          message.toLowerCase().includes("policy") ||
          message.toLowerCase().includes("violates"));
      console.error("[NewProject] Project creation failed — raw error:", err, "extracted message:", message);
      const rlsHint = isRls ? " (Row-level security may be blocking the insert—check Supabase RLS policies for the projects table.)" : "";
      const displayMessage =
        message
          ? message + rlsHint
          : "Could not create your project. Please make sure you are signed in and try again. (Check the browser console for details.)";
      setSubmitError(displayMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/studio"
          className="text-sm text-[var(--muted)] hover:text-white"
        >
          ← Studio
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-white">New project</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">
        Set up your project. You can generate beats, full songs, and more from the Studio.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 backdrop-blur-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Project name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Track"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Describe your track (optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Chill lofi beat with piano and vinyl crackle, 90 BPM"
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Used for AI generation when you connect an API (Suno-style). Stored with the project.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Genre
            </label>
            <CustomSelect
              aria-label="Genre"
              value={genre}
              onChange={(next) => setGenre(next)}
              options={[
                { value: "", label: "Select" },
                ...GENRES.map((g) => ({ value: g, label: g })),
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              BPM
            </label>
            <input
              type="number"
              min={60}
              max={200}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Key
            </label>
            <CustomSelect
              aria-label="Key"
              value={key}
              onChange={(next) => setKey(next)}
              options={[
                { value: "", label: "Select" },
                ...KEYS.map((k) => ({ value: k, label: k })),
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Mood
            </label>
            <CustomSelect
              aria-label="Mood"
              value={mood}
              onChange={(next) => setMood(next)}
              options={[
                { value: "", label: "Select" },
                ...MOODS.map((m) => ({ value: m, label: m })),
              ]}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Duration (seconds)
          </label>
          <input
            type="number"
            min={30}
            max={600}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Instruments
          </label>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENT_OPTIONS.map((inst) => (
              <button
                key={inst}
                type="button"
                onClick={() => toggleInstrument(inst)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  instruments.includes(inst)
                    ? "bg-[var(--neon-green)]/20 text-[var(--neon-green)] border border-[var(--neon-green)]/40"
                    : "border border-white/10 bg-white/5 text-[var(--muted)] hover:border-white/20 hover:text-white"
                }`}
              >
                {inst}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Reference audio (optional)
          </label>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.m4b,.flac,.aac,.webm,.wma,.opus"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setReferenceFile(file);
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--purple-mid)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:border-[var(--neon-green)]/50 focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Optional reference track for the AI. MP3, WAV, OGG, M4A, FLAC, AAC, WebM, WMA, Opus; max 25MB.
          </p>
        </div>

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[var(--neon-green)] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)] disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create & open in Studio"}
          </button>
          <Link
            href="/studio"
            className="rounded-xl border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Cancel
          </Link>
        </div>
        {submitError && (
          <p className="pt-2 text-sm text-red-400">{submitError}</p>
        )}
      </form>
    </div>
  );
}

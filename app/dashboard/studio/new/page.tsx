"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjects } from "../../../context/ProjectsContext";

const GENRES = ["Hip-Hop", "R&B", "Pop", "Electronic", "Trap", "Lo-Fi", "Other"];
const MOODS = ["Chill", "Energetic", "Dark", "Uplifting", "Melancholic", "Aggressive", "Other"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const INSTRUMENT_OPTIONS = ["Drums", "Bass", "Keys", "Synth", "Strings", "Guitar", "Vocal", "FX"];

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProjects();
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState("");
  const [mood, setMood] = useState("");
  const [duration, setDuration] = useState(180);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [referenceNote, setReferenceNote] = useState(""); // placeholder for uploads
  const [submitting, setSubmitting] = useState(false);

  const toggleInstrument = (inst: string) => {
    setInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const project = createProject({
      name: name || "Untitled Project",
      genre,
      bpm,
      key,
      mood,
      duration,
      instruments,
      referenceUploads: referenceNote ? [referenceNote] : [],
    });
    setSubmitting(false);
    router.push(`/dashboard/studio?project=${project.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard/studio"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-[var(--neon-green)]/50 focus:outline-none"
            >
              <option value="">Select</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
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
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-[var(--neon-green)]/50 focus:outline-none"
            >
              <option value="">Select</option>
              {KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Mood
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-[var(--neon-green)]/50 focus:outline-none"
            >
              <option value="">Select</option>
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
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
            Reference uploads (optional)
          </label>
          <input
            type="text"
            value={referenceNote}
            onChange={(e) => setReferenceNote(e.target.value)}
            placeholder="Reference uploads — integration coming soon"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/50"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Placeholder for future reference file uploads.
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
            href="/dashboard/studio"
            className="rounded-xl border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

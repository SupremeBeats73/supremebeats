"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { fetchPublicDiscoveryTracks, type DiscoveryTrack } from "../../lib/discoveryFeed";
import SupremeCard from "../../components/SupremeCard";

export default function DiscoveryFeedPage() {
  const [tracks, setTracks] = useState<DiscoveryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublicDiscoveryTracks();
      setTracks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load discovery feed");
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handlePlay = useCallback((track: DiscoveryTrack) => {
    if (!track.audioUrl) return;
    const nextId = playingId === track.id ? null : track.id;
    setPlayingId(nextId);
    const el = audioRef.current;
    if (!el) return;
    if (nextId === null) {
      el.pause();
      el.removeAttribute("src");
      return;
    }
    el.src = track.audioUrl;
    el.play().catch(() => {});
  }, [playingId]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => setPlayingId(null);
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #050508 0%, #0f0a1a 30%, #1a0f2e 60%, #0f0a1a 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Discovery</h1>
        <p className="mb-8 text-sm text-[var(--muted)]">
          The feed. Drop beats, get heard.
        </p>

        {loading && (
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-full animate-pulse rounded-xl border border-[#2e1065]/40 bg-black/40 sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]"
              >
                <div className="aspect-square rounded-t-xl bg-white/5" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 rounded bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-white/10" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-8 flex-1 rounded-lg bg-white/10" />
                    <div className="h-8 flex-1 rounded-lg bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && tracks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#2e1065]/60 bg-black/40 px-8 py-20 text-center backdrop-blur-md">
            <div className="mb-4 text-6xl opacity-80">🎤</div>
            <h2 className="mb-2 text-xl font-bold text-white">No tracks yet</h2>
            <p className="mb-6 max-w-sm text-sm text-[var(--muted)]">
              Be the first to drop a beat. Create a project, generate a track, and it’ll show up here for the world to hear.
            </p>
            <a
              href="/studio"
              className="rounded-xl bg-[var(--neon-green)] px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_24px_var(--neon-glow)]"
            >
              Be the first to drop a beat
            </a>
          </div>
        )}

        {!loading && !error && tracks.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((track) => (
                <SupremeCard
                  key={track.id}
                  track={track}
                  isPlaying={playingId === track.id}
                  onPlay={handlePlay}
                />
              ))}
            </div>
          </>
        )}

        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}

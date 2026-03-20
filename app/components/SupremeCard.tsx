"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import MicBadge from "./MicBadge";
import UserBadge from "./UserBadge";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { DiscoveryTrack } from "../lib/discoveryFeed";
import {
  fetchCommentsByAssetId,
  insertComment,
  type CommentWithAuthor,
} from "../lib/supabaseComments";
import type { MicTierId } from "../lib/types";

const DEFAULT_ARTWORK =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop";

interface SupremeCardProps {
  track: DiscoveryTrack;
  isPlaying: boolean;
  onPlay: (track: DiscoveryTrack) => void;
  onLike?: (track: DiscoveryTrack) => void;
  onComment?: (track: DiscoveryTrack) => void;
  onShare?: (track: DiscoveryTrack) => void;
  onCommentsCountChange?: (assetId: string, delta: number) => void;
}

function normalizeMicTier(v: string | null | undefined): MicTierId {
  if (!v) return "bronze";
  const s = String(v).toLowerCase();
  if (s === "gold" || s === "elite" || s.includes("gold")) return "gold";
  if (s === "silver" || s.includes("silver")) return "silver";
  return "bronze";
}

export default function SupremeCard({
  track,
  isPlaying,
  onPlay,
  onLike,
  onComment,
  onShare,
  onCommentsCountChange,
}: SupremeCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(track.likes);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    displayName: string;
    micTier: MicTierId;
  } | null>(null);
  const artwork = track.artworkUrl || DEFAULT_ARTWORK;

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const list = await fetchCommentsByAssetId(track.id);
      setComments(list);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [track.id]);

  useEffect(() => {
    if (commentsOpen) {
      loadComments();
      if (user?.id && !currentUserProfile) {
        supabase
          .from("profiles")
          .select("display_name, mic_tier")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data)
              setCurrentUserProfile({
                displayName: (data.display_name as string) ?? user.email ?? "You",
                micTier: normalizeMicTier(data.mic_tier as string),
              });
            else
              setCurrentUserProfile({
                displayName: user.email ?? "You",
                micTier: "bronze",
              });
          });
      }
    }
  }, [commentsOpen, user?.id, user?.email, loadComments, currentUserProfile]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => !prev);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    onLike?.(track);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCommentsOpen((open) => !open);
    onComment?.(track);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share && track.audioUrl) {
      navigator.share({
        title: track.title,
        text: `Listen to ${track.title} by ${track.creatorName}`,
        url: window.location.href,
      }).catch(() => {});
    }
    onShare?.(track);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = commentDraft.trim();
    if (!body || !user?.id || sending) return;
    const optimistic: CommentWithAuthor = {
      id: `opt-${Date.now()}`,
      userId: user.id,
      assetId: track.id,
      body,
      createdAt: new Date().toISOString(),
      displayName: currentUserProfile?.displayName ?? user.email ?? "You",
      micTier: currentUserProfile?.micTier ?? "bronze",
    };
    setComments((prev) => [...prev, optimistic]);
    setCommentDraft("");
    setSending(true);
    onCommentsCountChange?.(track.id, 1);
    try {
      await insertComment(user.id, track.id, body);
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      onCommentsCountChange?.(track.id, -1);
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-xl border border-[#2e1065]/60 bg-black/60 backdrop-blur-md transition-all duration-300 hover:border-[var(--purple-glow)]/40 hover:shadow-[0_0_32px_rgba(124,58,237,0.2)]">
      <div className="relative aspect-square overflow-hidden bg-[#0f0a1a]">
        <Image
          src={artwork}
          alt=""
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        <button
          type="button"
          onClick={() => onPlay(track)}
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/30 bg-black/50 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:border-[var(--neon-green)] hover:bg-[var(--neon-green)] hover:text-black hover:shadow-[0_0_24px_rgba(34,197,94,0.5)]"
        >
          {isPlaying ? (
            <span className="text-xl font-bold">‖</span>
          ) : (
            <span className="ml-0.5 text-xl font-bold">▶</span>
          )}
        </button>
      </div>

      <div className="p-4">
        <h3 className="truncate font-semibold text-white">{track.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--muted)]">{track.creatorName}</span>
          <UserBadge userId={track.creatorId} micTier={track.micTier} />
          <MicBadge tier={track.micTier as MicTierId} size="sm" />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              liked
                ? "border-red-500/50 bg-red-500/20 text-red-400"
                : "border-white/10 bg-white/5 text-[var(--muted)] hover:border-white/20 hover:text-white"
            }`}
          >
            <span>♥</span>
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            onClick={handleCommentClick}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              commentsOpen
                ? "border-[var(--neon-green)]/40 bg-[var(--neon-green)]/10 text-[var(--neon-green)]"
                : "border-white/10 bg-white/5 text-[var(--muted)] hover:border-white/20 hover:text-white"
            }`}
          >
            <span>💬</span>
            <span>{comments.length || track.commentsCount}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-[var(--muted)] transition-colors hover:border-white/20 hover:text-white"
            title="Share"
          >
            ↗
          </button>
        </div>

        {/* Expandable Comments */}
        <div
          className={`grid transition-all duration-300 ease-out ${
            commentsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
              {commentsLoading ? (
                <p className="text-xs text-[var(--muted)]">Loading comments…</p>
              ) : comments.length === 0 && !commentDraft ? (
                <p className="text-xs text-[var(--muted)]">No comments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-md"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-white">
                          {c.displayName}
                        </span>
                        <MicBadge tier={c.micTier} size="sm" />
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              {user ? (
                <form onSubmit={handleSendComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Add a comment…"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--neon-green)]/30 focus:shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                  />
                  <button
                    type="submit"
                    disabled={!commentDraft.trim() || sending}
                    className="rounded-lg bg-[var(--neon-green)] px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-[var(--neon-green-dim)] hover:shadow-[0_0_16px_var(--neon-glow)] disabled:opacity-50 disabled:hover:shadow-none"
                  >
                    Send
                  </button>
                </form>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  Sign in to leave a comment.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

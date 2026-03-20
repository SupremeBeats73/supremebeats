"use client";

import { useState } from "react";

interface CommentUIProps {
  trackId: string;
  commentsCount: number;
  onSubmit?: (text: string) => void;
}

export default function CommentUI({
  commentsCount,
  onSubmit,
}: CommentUIProps) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit?.(text.trim());
    setText("");
    setSubmitted(true);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="mb-2 text-xs text-[var(--muted)]">{commentsCount} comments</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-[var(--muted)] focus:border-[var(--neon-green)]/50 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--neon-green)] px-3 py-2 text-sm font-medium text-black hover:bg-[var(--neon-green-dim)]"
        >
          Post
        </button>
      </form>
      {submitted && (
        <p className="mt-2 text-xs text-[var(--neon-green)]">Comment posted (mock)</p>
      )}
    </div>
  );
}

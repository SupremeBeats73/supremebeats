interface TrackCardProps {
  title: string;
  creator: string;
  plays: string | number;
  rating: number;
  micBadge?: string;
  engagement?: string;
}

export default function TrackCard({
  title,
  creator,
  plays,
  rating,
  micBadge = "Mic 3",
  engagement = "High",
}: TrackCardProps) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden backdrop-blur-sm transition-all duration-300 hover:border-[var(--purple-glow)]/25 hover:shadow-[0_0_20px_rgba(124,58,237,0.08)]">
      <div className="aspect-[4/3] bg-gradient-to-br from-[var(--deep-purple)] to-[var(--purple-mid)]/50 flex items-center justify-center text-4xl text-white/20">
        ♪
      </div>
      <div className="p-4">
        <h4 className="mb-1 font-semibold text-white">{title}</h4>
        <p className="mb-3 text-xs text-[var(--muted)]">{creator}</p>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
          <span>{plays} plays</span>
          <span>★ {rating}</span>
          <span className="rounded bg-[var(--purple-mid)]/60 px-1.5 py-0.5 text-[var(--neon-green)]">
            {micBadge}
          </span>
          <span>{engagement}</span>
        </div>
      </div>
    </div>
  );
}

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
    <div className="glass-panel glass-panel--status rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[var(--glass-shadow-status)]">
      <div className="aspect-[4/3] bg-gradient-to-br from-[var(--deep-purple)] to-[var(--purple-mid)]/50 flex items-center justify-center text-4xl text-white/20">
        ♪
      </div>
      <div className="p-4">
        <h4 className="mb-1 font-semibold text-white">{title}</h4>
        <p className="mb-3 text-xs text-[var(--muted)]">{creator}</p>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
          <span>{plays} plays</span>
          <span>★ {rating}</span>
          <span className="rounded bg-[var(--purple-mid)]/60 px-1.5 py-0.5 text-[var(--purple-glow)]">
            {micBadge}
          </span>
          <span>{engagement}</span>
        </div>
      </div>
    </div>
  );
}

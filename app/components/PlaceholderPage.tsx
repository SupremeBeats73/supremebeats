interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-white">{title}</h1>
      <p className="text-[var(--muted)]">{description}</p>
      <div className="mt-12 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)]/50 p-12 text-center">
        <p className="text-sm text-[var(--muted)]">
          This section is not built yet. Check back later.
        </p>
      </div>
    </div>
  );
}

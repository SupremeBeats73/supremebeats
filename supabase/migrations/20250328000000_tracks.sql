-- Tracks table for landing page / discovery preview
-- Matches the columns queried by `app/page.tsx`:
--   id,title,creator_name,plays,rating,mic_badge,engagement

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  creator_name text not null,
  plays integer not null default 0,
  rating numeric(3,2) not null default 0,
  mic_badge text,
  engagement text,
  created_at timestamptz not null default now()
);

create index if not exists tracks_creator_name_idx on public.tracks(creator_name);
create index if not exists tracks_created_at_idx on public.tracks(created_at);

alter table public.tracks enable row level security;

-- Public discovery/landing should be able to read track previews.
create policy "Tracks are readable by everyone"
  on public.tracks for select
  using (true);


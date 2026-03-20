-- Add discovery / landing page stats fields to profiles.
-- These columns are queried by:
--   - app/page.tsx (landing: plays, rating, mic_tier, engagement)
--   - app/components/CreatorStats.tsx (trust_score, rating, plays)

alter table public.profiles
  add column if not exists mic_tier text;

alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  add column if not exists plays integer not null default 0;

alter table public.profiles
  add column if not exists rating numeric(3,2) not null default 0;

alter table public.profiles
  add column if not exists engagement text not null default 'Medium';

alter table public.profiles
  add column if not exists trust_score numeric(4,3) not null default 0.98;

-- Allow public discovery/landing reads.
-- Existing RLS policies already allow authenticated users to read/update their own profile.
-- We add a permissive SELECT policy for everyone so landing/discovery can render even when logged out.
create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);


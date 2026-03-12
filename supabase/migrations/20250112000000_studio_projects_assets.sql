-- SupremeBeats: AI Studio + Project System persistence
-- Run this in Supabase SQL Editor or via Supabase CLI (supabase db push)
-- Every record is tied to auth.uid() for RLS.

-- Projects: one per user, created from Studio
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Project',
  genre text not null default '',
  bpm integer not null default 120,
  key text not null default '',
  mood text not null default '',
  duration integer not null default 180,
  instruments jsonb not null default '[]'::jsonb,
  reference_uploads jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);

alter table public.projects enable row level security;

create policy "Users can manage own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Project assets: generated items (beat, full_song, vocals, etc.)
create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  label text not null,
  url text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'success', 'failure')),
  created_at timestamptz not null default now(),
  error_message text
);

create index if not exists project_assets_project_id_idx on public.project_assets(project_id);
create index if not exists project_assets_user_id_idx on public.project_assets(user_id);

alter table public.project_assets enable row level security;

create policy "Users can manage own project assets"
  on public.project_assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- YouTube packaging: one row per project (latest package)
create table if not exists public.youtube_packages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  tags jsonb not null default '[]'::jsonb,
  hashtags jsonb not null default '[]'::jsonb,
  readiness_score integer not null default 0,
  generated_at timestamptz not null default now(),
  unique(project_id)
);

create index if not exists youtube_packages_project_id_idx on public.youtube_packages(project_id);
create index if not exists youtube_packages_user_id_idx on public.youtube_packages(user_id);

alter table public.youtube_packages enable row level security;

create policy "Users can manage own youtube packages"
  on public.youtube_packages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

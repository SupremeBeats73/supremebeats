-- Project versions: track individual AI generations per project.
-- Run in Supabase SQL Editor or via: supabase db push

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  status text default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists project_versions_project_id_idx
  on public.project_versions(project_id);

create index if not exists project_versions_user_id_idx
  on public.project_versions(user_id);

alter table public.project_versions enable row level security;

drop policy if exists "Users can manage own project_versions" on public.project_versions;

create policy "Users can manage own project_versions"
  on public.project_versions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


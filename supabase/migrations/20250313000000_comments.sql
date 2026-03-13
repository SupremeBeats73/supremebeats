-- SupremeBeats: Comments on assets (Discovery feed)
-- Links user_id to asset_id (project_assets.id). Run in Supabase SQL Editor or via supabase db push.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.project_assets(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_asset_id_idx on public.comments(asset_id);
create index if not exists comments_user_id_idx on public.comments(user_id);

alter table public.comments enable row level security;

-- Anyone can read comments for discovery
create policy "Comments are readable by everyone"
  on public.comments for select
  using (true);

-- Authenticated users can insert their own comment
create policy "Users can insert own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- Users can delete their own comments (optional)
create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

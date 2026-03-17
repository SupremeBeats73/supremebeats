-- Add audio_url, stems (Demucs output URLs), and status to projects.
-- Run in Supabase SQL Editor or via supabase db push.

alter table public.projects
  add column if not exists audio_url text,
  add column if not exists stems jsonb,
  add column if not exists status text default 'idle';

comment on column public.projects.audio_url is 'Public URL of generated or uploaded main audio';
comment on column public.projects.stems is 'Public URLs for Demucs stems (e.g. drums, bass, other, vocals)';
comment on column public.projects.status is 'Generation state: idle, completed, split_complete, etc.';

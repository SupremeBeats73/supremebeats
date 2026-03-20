-- Lyrics & vocal style for MiniMax / project-driven prompts
alter table public.projects
  add column if not exists lyrics text not null default '',
  add column if not exists vocal_style text not null default '';

comment on column public.projects.lyrics is 'Song lyrics or placeholder sections for vocal models (e.g. [verse] lines)';
comment on column public.projects.vocal_style is 'Vocal direction: e.g. male rap, female soul, autotune';

-- Version rows store storage path + optional cached public/signed URL metadata
alter table public.project_versions
  add column if not exists file_path text,
  add column if not exists audio_url text,
  add column if not exists asset_type text default 'generated';

comment on column public.project_versions.file_path is 'Supabase Storage path (e.g. generated-audio bucket)';
comment on column public.project_versions.audio_url is 'Optional last known playable URL (signed URLs expire; prefer file_path)';
comment on column public.project_versions.asset_type is 'generated, upload, etc.';

-- Add optional prompt/description for Suno-style text-to-music (AI generation).
alter table public.projects
  add column if not exists prompt text not null default '';

comment on column public.projects.prompt is 'User description of the track for AI generation (e.g. "chill lofi beat with piano")';

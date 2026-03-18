-- Persist Settings page preferences in profiles.
-- These are stored as JSON so we can evolve the UI without schema churn.

alter table public.profiles
  add column if not exists dashboard_prefs jsonb not null default '{}'::jsonb,
  add column if not exists profile_prefs jsonb not null default '{}'::jsonb;

comment on column public.profiles.dashboard_prefs is 'User dashboard customization preferences (JSON).';
comment on column public.profiles.profile_prefs is 'User public profile customization preferences (JSON).';


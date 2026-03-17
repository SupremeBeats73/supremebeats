-- One-time username change: users can change display_name only once after signup.
-- Run in Supabase SQL Editor or via supabase db push.

alter table public.profiles
  add column if not exists display_name_changes_remaining integer not null default 1;

comment on column public.profiles.display_name_changes_remaining is 'Number of times the user can change their username (0 = already used the one allowed change).';

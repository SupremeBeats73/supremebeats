-- Unique display_name (case-insensitive) and create profile on signup with normalized username.
-- Run after 20250313000001_profiles_credits.sql (or ensure profiles table exists).
--
-- If you get "permission denied" on the trigger: run only steps 6-7 (handle_new_user + trigger)
-- in the Supabase Dashboard SQL Editor (it runs with elevated privileges).

-- 1) Ensure profiles table exists (minimal schema if created here)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  updated_at timestamptz not null default now()
);

-- 2) Ensure display_name and updated_at columns exist (no-op if already there)
alter table public.profiles
  add column if not exists display_name text;
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

-- 3) Clear duplicate display_names so the unique index can be created (keep one per lower(display_name))
with dupes as (
  select id, display_name,
    row_number() over (partition by lower(display_name) order by id) as rn
  from public.profiles
  where display_name is not null
)
update public.profiles p
set display_name = null
from dupes d
where p.id = d.id and d.rn > 1;

-- 4) Case-insensitive unique constraint
drop index if exists public.profiles_display_name_lower_key;
create unique index profiles_display_name_lower_key
  on public.profiles (lower(display_name))
  where display_name is not null;

comment on column public.profiles.display_name is 'Public username; spaces normalized to underscore, max 50 chars.';

-- 5) Normalize username in SQL (trim, spaces -> underscore, max 50 chars). POSIX-safe regex.
create or replace function public.normalize_display_name(raw_username text)
returns text
language sql
immutable
as $$
  select nullif(
    substring(
      regexp_replace(trim(coalesce(raw_username, '')), '[[:space:]]+', '_', 'g')
      from 1 for 50
    ),
    ''
  );
$$;

-- 6) Create profile on signup with normalized username (no ON CONFLICT so works without PK assumption)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
begin
  normalized := public.normalize_display_name(new.raw_user_meta_data->>'username');
  begin
    insert into public.profiles (id, display_name)
    values (new.id, normalized);
  exception
    when unique_violation then
      -- Username taken: create profile with null display_name; user can set in Settings
      insert into public.profiles (id, display_name)
      values (new.id, null);
  end;
  return new;
end;
$$;

-- 7) Trigger on auth.users (requires Supabase project role to create trigger on auth schema)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

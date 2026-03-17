-- Add an is_admin flag to profiles and mark core admin accounts.
-- Run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is 'True for platform admin accounts.';

-- Mark primary admin accounts by email (via auth.users).
update public.profiles
set
  is_admin = true,
  updated_at = now()
where id in (
  select id from auth.users
  where email in (
    'jadelaceco25@gmail.com',
    'jasmine1x05@gmail.com'
  )
);


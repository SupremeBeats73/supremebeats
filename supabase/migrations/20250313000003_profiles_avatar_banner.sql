-- Profile picture and cover art URLs (stored in Supabase Storage, paths or public URLs in profiles).
alter table public.profiles
  add column if not exists avatar_url text;
alter table public.profiles
  add column if not exists banner_url text;

comment on column public.profiles.avatar_url is 'Public URL for profile picture (e.g. from storage).';
comment on column public.profiles.banner_url is 'Public URL for profile cover/banner image.';

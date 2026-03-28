-- Run in Supabase Dashboard → SQL Editor (no app env required).
-- Confirms objects expected by app/page.tsx landing + discovery reads.

select exists (
  select 1
  from information_schema.tables
  where table_schema = 'public'
    and table_name = 'tracks'
) as public_tracks_exists;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in (
    'mic_tier',
    'bio',
    'plays',
    'rating',
    'engagement',
    'trust_score'
)
order by column_name;

select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('tracks', 'profiles')
order by tablename, policyname;

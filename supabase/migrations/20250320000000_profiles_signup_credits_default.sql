-- Item 5: New users get a one-time signup credit grant (default for new profile rows).
-- Existing rows keep their current credits value. Run in Supabase SQL Editor or via supabase db push.

alter table public.profiles
  alter column credits set default 50;

comment on column public.profiles.credits is 'Balance for generation; new users get 50 signup credits, then top up via Shop or subscription.';

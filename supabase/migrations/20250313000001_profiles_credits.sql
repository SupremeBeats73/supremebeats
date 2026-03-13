-- Add credits and updated_at to profiles for Shop / tier economy.
-- Run in Supabase SQL Editor if your profiles table already exists.

alter table public.profiles
  add column if not exists credits integer not null default 0;

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

comment on column public.profiles.credits is 'Balance for generation; topped up via Shop or subscription.';

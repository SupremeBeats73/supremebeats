-- Billing events: record Stripe / billing-related events per user.
-- Run this in Supabase SQL Editor or via: supabase db push

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  stripe_event_id text unique,
  stripe_event_type text,
  amount integer,
  currency text,
  status text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_events_user_id_idx
  on public.billing_events(user_id);

create index if not exists billing_events_stripe_event_id_idx
  on public.billing_events(stripe_event_id);

alter table public.billing_events enable row level security;

drop policy if exists "Users read own billing_events" on public.billing_events;

create policy "Users read own billing_events"
  on public.billing_events
  for select
  using (auth.uid() = user_id);


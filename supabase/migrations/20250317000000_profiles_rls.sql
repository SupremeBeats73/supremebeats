-- RLS for profiles so users can read/update their own row (required for /api/credits/deduct and /api/credits/refund).
-- Service role (e.g. Stripe webhook) can still update any profile.

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Track AI generation jobs and credit movements for auditing.
-- Run this in Supabase SQL Editor or via supabase db push.

-- generation_jobs: one row per AI generation request (music, etc.)
create table if not exists public.generation_jobs (
  id text primary key, -- matches JobsContext job_id (e.g. job_...)
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  job_type text not null,
  provider text not null default 'replicate',
  provider_job_id text,
  status text not null default 'queued' check (status in ('queued','running','success','failed')),
  error_message text,
  input_json jsonb,
  output_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generation_jobs_user_id_idx on public.generation_jobs(user_id);
create index if not exists generation_jobs_project_id_idx on public.generation_jobs(project_id);

alter table public.generation_jobs enable row level security;

drop policy if exists "Users manage own generation_jobs" on public.generation_jobs;

create policy "Users manage own generation_jobs"
  on public.generation_jobs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- credit_ledger: append-only record of credit debits/credits.
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  job_id text references public.generation_jobs(id) on delete set null,
  stripe_session_id text,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_id_idx on public.credit_ledger(user_id);
create index if not exists credit_ledger_job_id_idx on public.credit_ledger(job_id);

alter table public.credit_ledger enable row level security;

drop policy if exists "Users read own credit_ledger" on public.credit_ledger;

create policy "Users read own credit_ledger"
  on public.credit_ledger
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own credit_ledger" on public.credit_ledger;

create policy "Users insert own credit_ledger"
  on public.credit_ledger
  for insert
  with check (auth.uid() = user_id);


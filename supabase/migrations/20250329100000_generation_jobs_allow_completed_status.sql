-- Allow "completed" as a terminal generation_jobs status (matches client JobStatus wording).
alter table public.generation_jobs
  drop constraint if exists generation_jobs_status_check;

alter table public.generation_jobs
  add constraint generation_jobs_status_check
  check (status in ('queued', 'running', 'success', 'failed', 'completed'));

comment on column public.generation_jobs.status is 'Job lifecycle: queued → running → completed|success|failed';

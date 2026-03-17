-- Store Stripe customer id for billing portal (cancel, change plan, invoices).
alter table public.profiles
  add column if not exists stripe_customer_id text;

comment on column public.profiles.stripe_customer_id is 'Stripe Customer id from first checkout; used for Customer Portal.';

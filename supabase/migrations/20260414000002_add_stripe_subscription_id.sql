-- Add stripe_subscription_id to organizations for webhook reconciliation
alter table public.organizations
  add column if not exists stripe_subscription_id text;

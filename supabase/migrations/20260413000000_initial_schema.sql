-- ============================================================
-- OutreachForge — Initial Schema
-- Applies: tables, RLS policies, signup trigger
-- ============================================================

-- ─── organizations ───────────────────────────────────────────────────────────

create table public.organizations (
  id                 uuid        primary key default gen_random_uuid(),
  name               text        not null,
  plan               text        not null default 'trial'
                                 check (plan in ('trial', 'solo', 'pro')),
  plan_renews_at     timestamptz,
  trial_ends_at      timestamptz,
  stripe_customer_id text,
  created_at         timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ─── organization_members ────────────────────────────────────────────────────

create table public.organization_members (
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  user_id         uuid        not null references auth.users(id)           on delete cascade,
  role            text        not null default 'owner'
                              check (role in ('owner', 'admin', 'member')),
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_members enable row level security;

-- ─── user_settings ───────────────────────────────────────────────────────────

create table public.user_settings (
  user_id             uuid        primary key references auth.users(id) on delete cascade,
  anthropic_api_key   text,                    -- encrypted AES-256-GCM at app layer
  gmail_refresh_token text,                    -- encrypted AES-256-GCM at app layer
  gmail_email         text,
  default_sender_name text,
  default_signature   text,
  updated_at          timestamptz not null default now()
);

alter table public.user_settings enable row level security;

-- ─── campaigns ───────────────────────────────────────────────────────────────

create table public.campaigns (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  name            text        not null,
  status          text        not null default 'active'
                              check (status in ('active', 'archived')),
  brief           jsonb       not null default '{}',
  language        text        not null default 'en',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.campaigns enable row level security;

-- ─── leads ───────────────────────────────────────────────────────────────────

create table public.leads (
  id                  uuid        primary key default gen_random_uuid(),
  campaign_id         uuid        not null references public.campaigns(id)     on delete cascade,
  organization_id     uuid        not null references public.organizations(id) on delete cascade,
  status              text        not null default 'new'
                                  check (status in (
                                    'new','researched','drafted','approved',
                                    'sent','replied','meeting','won','lost'
                                  )),
  full_name           text        not null,
  title               text,
  company_name        text,
  company_domain      text,
  linkedin_url        text,
  email               text,
  location            text,
  pasted_profile      text,
  custom_notes        text,
  dossier             jsonb,
  drafts              jsonb,
  gmail_thread_id     text,
  sent_at             timestamptz,
  linkedin_dm_sent_at timestamptz,
  replied_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.leads enable row level security;

-- ─── activity_log ────────────────────────────────────────────────────────────

create table public.activity_log (
  id              uuid        primary key default gen_random_uuid(),
  lead_id         uuid        not null references public.leads(id)         on delete cascade,
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  event_type      text        not null,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

alter table public.activity_log enable row level security;

-- ─── usage_counters ──────────────────────────────────────────────────────────

create table public.usage_counters (
  organization_id  uuid primary key references public.organizations(id) on delete cascade,
  period_start     date not null default current_date,
  leads_researched int  not null default 0,
  drafts_generated int  not null default 0,
  emails_sent      int  not null default 0
);

alter table public.usage_counters enable row level security;

-- ============================================================
-- RLS Policies
-- ============================================================

-- organizations
create policy "members can select own org"
  on public.organizations for select
  using (id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "members can update own org"
  on public.organizations for update
  using (id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

-- organization_members (simple: user can see their own rows only)
create policy "members can select memberships"
  on public.organization_members for select
  using (user_id = auth.uid());

-- user_settings
create policy "users can select own settings"
  on public.user_settings for select using (user_id = auth.uid());

create policy "users can insert own settings"
  on public.user_settings for insert with check (user_id = auth.uid());

create policy "users can update own settings"
  on public.user_settings for update using (user_id = auth.uid());

-- campaigns
create policy "members can select campaigns"
  on public.campaigns for select
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "members can insert campaigns"
  on public.campaigns for insert
  with check (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "members can update campaigns"
  on public.campaigns for update
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "members can delete campaigns"
  on public.campaigns for delete
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

-- leads
create policy "members can select leads"
  on public.leads for select
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "members can insert leads"
  on public.leads for insert
  with check (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "members can update leads"
  on public.leads for update
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "members can delete leads"
  on public.leads for delete
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

-- activity_log
create policy "members can select activity"
  on public.activity_log for select
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "members can insert activity"
  on public.activity_log for insert
  with check (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

-- usage_counters
create policy "members can select usage"
  on public.usage_counters for select
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

create policy "members can update usage"
  on public.usage_counters for update
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  ));

-- ============================================================
-- Trigger: auto-provision org + settings on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id     uuid;
  workspace_name text;
begin
  -- Derive a friendly workspace name
  workspace_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  ) || '''s workspace';

  -- Create personal organization with 14-day trial
  insert into public.organizations (name, plan, trial_ends_at)
  values (workspace_name, 'trial', now() + interval '14 days')
  returning id into new_org_id;

  -- Add user as owner
  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  -- Initialize user settings row
  insert into public.user_settings (user_id)
  values (new.id);

  -- Initialize usage counters for current billing period
  insert into public.usage_counters (organization_id, period_start)
  values (new_org_id, current_date);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Connections — LinkedIn connections import table
-- ============================================================

create table public.connections (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  imported_by     uuid        not null references auth.users(id)           on delete cascade,

  -- Core identity (from LinkedIn CSV)
  full_name       text        not null,
  first_name      text,
  last_name       text,
  email           text,
  company_name    text,
  position        text,
  linkedin_url    text,
  connected_on    date,

  -- Research results
  status          text        not null default 'pending'
                              check (status in ('pending','researching','done','error')),
  category        text        check (category in (
                                'decision_maker','founder','investor',
                                'ic','partner','other'
                              )),
  fit_score       integer     check (fit_score between 1 and 10),
  dossier         jsonb,
  error_message   text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.connections enable row level security;

-- Members of the org can read all connections in that org
create policy "org members can read connections"
  on public.connections for select
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

-- Members can insert connections for their org
create policy "org members can insert connections"
  on public.connections for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

-- Members can update connections in their org
create policy "org members can update connections"
  on public.connections for update
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

-- Members can delete connections in their org
create policy "org members can delete connections"
  on public.connections for delete
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

-- Index for fast org-scoped queries
create index connections_org_id_idx on public.connections(organization_id);
create index connections_status_idx  on public.connections(organization_id, status);
create index connections_category_idx on public.connections(organization_id, category);

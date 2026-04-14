-- ─── Campaign members ─────────────────────────────────────────────────────────
-- Allows campaigns to be shared across users with role-based access.
-- Roles: owner (full control), editor (research/draft/send), viewer (read-only)

-- Table was created manually by user; add RLS + policies here.

alter table public.campaign_members enable row level security;

-- Members can see who is in campaigns they belong to
create policy "campaign members can select members"
  on public.campaign_members for select
  using (
    campaign_id in (
      select campaign_id from public.campaign_members where user_id = auth.uid()
    )
  );

-- Only owners can invite (insert) new members
create policy "campaign owners can insert members"
  on public.campaign_members for insert
  with check (
    campaign_id in (
      select campaign_id from public.campaign_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- Only owners can remove members (delete)
create policy "campaign owners can delete members"
  on public.campaign_members for delete
  using (
    campaign_id in (
      select campaign_id from public.campaign_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- Only owners can change roles
create policy "campaign owners can update members"
  on public.campaign_members for update
  using (
    campaign_id in (
      select campaign_id from public.campaign_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- ─── Update campaigns RLS ─────────────────────────────────────────────────────
-- Drop old org-wide policies, replace with campaign_members-aware ones.
-- Org members can still see campaigns in their org (for the dashboard listing).
-- But editing/deleting requires campaign membership.

drop policy if exists "members can select campaigns" on public.campaigns;
drop policy if exists "members can update campaigns" on public.campaigns;
drop policy if exists "members can delete campaigns" on public.campaigns;

-- SELECT: org member OR campaign member
create policy "can select campaigns"
  on public.campaigns for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
    or
    id in (
      select campaign_id from public.campaign_members where user_id = auth.uid()
    )
  );

-- UPDATE: campaign member (any role can see, but only owner/editor can mutate)
-- We enforce owner/editor in application code; RLS just checks membership.
create policy "can update campaigns"
  on public.campaigns for update
  using (
    id in (
      select campaign_id from public.campaign_members
      where user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

-- DELETE: campaign owners only
create policy "can delete campaigns"
  on public.campaigns for delete
  using (
    id in (
      select campaign_id from public.campaign_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- ─── Update leads RLS ─────────────────────────────────────────────────────────

drop policy if exists "members can select leads" on public.leads;
drop policy if exists "members can insert leads" on public.leads;
drop policy if exists "members can update leads" on public.leads;
drop policy if exists "members can delete leads" on public.leads;

create policy "can select leads"
  on public.leads for select
  using (
    campaign_id in (
      select campaign_id from public.campaign_members where user_id = auth.uid()
    )
  );

create policy "can insert leads"
  on public.leads for insert
  with check (
    campaign_id in (
      select campaign_id from public.campaign_members
      where user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

create policy "can update leads"
  on public.leads for update
  using (
    campaign_id in (
      select campaign_id from public.campaign_members
      where user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

create policy "can delete leads"
  on public.leads for delete
  using (
    campaign_id in (
      select campaign_id from public.campaign_members
      where user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

-- ─── Update activity_log RLS ──────────────────────────────────────────────────

drop policy if exists "members can select activity" on public.activity_log;
drop policy if exists "members can insert activity" on public.activity_log;

create policy "can select activity_log"
  on public.activity_log for select
  using (
    lead_id in (
      select id from public.leads
    )
    and
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "can insert activity_log"
  on public.activity_log for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- ─── Trigger: auto-insert owner row when campaign is created ──────────────────

create or replace function public.on_campaign_created()
returns trigger language plpgsql security definer as $$
begin
  insert into public.campaign_members (campaign_id, user_id, role, invited_by)
  values (new.id, auth.uid(), 'owner', auth.uid())
  on conflict (campaign_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists campaign_created_add_owner on public.campaigns;
create trigger campaign_created_add_owner
  after insert on public.campaigns
  for each row execute function public.on_campaign_created();

-- ─── Backfill: make existing campaign creators owners ─────────────────────────
-- For each existing campaign, insert the org owner as campaign owner.
-- This is best-effort; skips if already exists.
insert into public.campaign_members (campaign_id, user_id, role, invited_by)
select
  c.id as campaign_id,
  om.user_id,
  'owner' as role,
  om.user_id as invited_by
from public.campaigns c
join public.organization_members om on om.organization_id = c.organization_id
on conflict (campaign_id, user_id) do nothing;

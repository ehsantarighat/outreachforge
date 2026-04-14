-- ─── Fix RLS infinite recursion on campaign_members ──────────────────────────
-- The SELECT policy on campaign_members was self-referential: it queried
-- campaign_members to determine whether you could query campaign_members.
-- This also caused recursion in all leads/campaigns policies that subquery
-- campaign_members, because evaluating that subquery triggers the SELECT policy.
--
-- Fix: replace all recursive subqueries with a SECURITY DEFINER helper function
-- that bypasses RLS when resolving the current user's campaign memberships.

-- ── 1. Helper function (runs as superuser, bypasses RLS) ─────────────────────

create or replace function public.my_campaign_ids()
  returns setof uuid
  language sql
  security definer
  stable
as $$
  select campaign_id
  from public.campaign_members
  where user_id = auth.uid();
$$;

create or replace function public.my_owned_or_editor_campaign_ids()
  returns setof uuid
  language sql
  security definer
  stable
as $$
  select campaign_id
  from public.campaign_members
  where user_id = auth.uid() and role in ('owner', 'editor');
$$;

create or replace function public.my_owner_campaign_ids()
  returns setof uuid
  language sql
  security definer
  stable
as $$
  select campaign_id
  from public.campaign_members
  where user_id = auth.uid() and role = 'owner';
$$;

-- ── 2. Fix campaign_members policies ─────────────────────────────────────────

drop policy if exists "campaign members can select members"  on public.campaign_members;
drop policy if exists "campaign owners can insert members"   on public.campaign_members;
drop policy if exists "campaign owners can delete members"   on public.campaign_members;
drop policy if exists "campaign owners can update members"   on public.campaign_members;

create policy "campaign members can select members"
  on public.campaign_members for select
  using (campaign_id in (select public.my_campaign_ids()));

create policy "campaign owners can insert members"
  on public.campaign_members for insert
  with check (campaign_id in (select public.my_owner_campaign_ids()));

create policy "campaign owners can delete members"
  on public.campaign_members for delete
  using (campaign_id in (select public.my_owner_campaign_ids()));

create policy "campaign owners can update members"
  on public.campaign_members for update
  using (campaign_id in (select public.my_owner_campaign_ids()));

-- ── 3. Fix campaigns policies ─────────────────────────────────────────────────

drop policy if exists "can select campaigns" on public.campaigns;
drop policy if exists "can update campaigns" on public.campaigns;
drop policy if exists "can delete campaigns" on public.campaigns;

create policy "can select campaigns"
  on public.campaigns for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
    or
    id in (select public.my_campaign_ids())
  );

create policy "can update campaigns"
  on public.campaigns for update
  using (id in (select public.my_owned_or_editor_campaign_ids()));

create policy "can delete campaigns"
  on public.campaigns for delete
  using (id in (select public.my_owner_campaign_ids()));

-- ── 4. Fix leads policies ─────────────────────────────────────────────────────

drop policy if exists "can select leads" on public.leads;
drop policy if exists "can insert leads" on public.leads;
drop policy if exists "can update leads" on public.leads;
drop policy if exists "can delete leads" on public.leads;

create policy "can select leads"
  on public.leads for select
  using (campaign_id in (select public.my_campaign_ids()));

create policy "can insert leads"
  on public.leads for insert
  with check (campaign_id in (select public.my_owned_or_editor_campaign_ids()));

create policy "can update leads"
  on public.leads for update
  using (campaign_id in (select public.my_owned_or_editor_campaign_ids()));

create policy "can delete leads"
  on public.leads for delete
  using (campaign_id in (select public.my_owned_or_editor_campaign_ids()));

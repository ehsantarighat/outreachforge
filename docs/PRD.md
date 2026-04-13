# OutreachForge — Product Requirements Document & Claude Code Build Plan

**AI-powered outbound research, drafting, and orchestration for emerging-market B2B founders and marketers.**

Author: Ehsan Tarighat
Version: 1.0 — April 2026

> **Note for Claude Code:** This document is the canonical specification. When you are unsure about a feature, schema, prompt, or page layout, return here. Do not invent details that contradict this document. If you find a contradiction or genuine ambiguity, stop and ask.

---

## 1. Executive Summary

OutreachForge is a multi-tenant SaaS that helps B2B founders, marketers, and sales operators run high-quality outbound campaigns without burning their LinkedIn accounts, without paying for bloated all-in-one platforms, and without writing generic AI slop. It does three things very well: deep research on each prospect, native-quality drafting tailored to that prospect, and a clean orchestration layer that tracks every message from idea to reply.

The product is deliberately not an all-in-one outbound suite. It does not scrape LinkedIn, does not warm up email inboxes, and does not pretend to be an AI SDR. It assumes the user already has a way to find prospects (LinkedIn Sales Navigator exports, manual lists, CSV imports) and a way to send email (their own Gmail account). What it provides is the missing middle layer: a research-and-drafting brain powered by Claude, plus a pipeline view and one-click manual LinkedIn sending.

### 1.1 Positioning and wedge

The outbound tooling market is crowded with US-centric platforms (Apollo, Instantly, Lemlist, Smartlead, Clay) that work well for selling SaaS to American companies but break down in the rest of the world. Their data sources have thin coverage of CIS, MENA, South Asia, Latin America, and Africa. Their AI drafting is monolingual or, when multilingual, sounds like a tourist. Their pricing assumes US-scale ACVs.

OutreachForge enters the market as the outbound platform built for emerging markets first. The MVP ships in English to keep scope small, but every architectural decision (data model, prompt structure, UI strings, locale handling) is made assuming Russian, Uzbek, Persian, Arabic, and Turkish are coming in Phase 2. The marketing positions it as the tool for founders selling into markets where Apollo is useless and where translated cold emails get marked as spam by humans on sight.

### 1.2 Who it is for

- Solo founders and small teams running outbound for their own product.
- Agencies running outbound on behalf of clients in emerging markets.
- In-house growth marketers at startups who need quality over quantity.
- Anyone who has tried Apollo or Lemlist and found the AI drafting embarrassing.

### 1.3 Who it is not for

- Enterprise SDR teams sending 10,000+ emails per day. Use Outreach.io or Salesloft.
- People who want fully automated LinkedIn DMs at scale. Use Expandi or Waalaxy and accept the ban risk.
- People who want a dialer, calendar, and CRM in one place. Use HubSpot.

### 1.4 The shape of the MVP

A web app where a user signs in, creates a campaign by filling in a structured brief about their product and ICP, uploads or pastes a list of leads, and then for each lead the system researches the company, generates a structured dossier, and drafts a personalized cold email plus a LinkedIn connection note plus a LinkedIn first-message DM. The user reviews and edits drafts inline, then either sends emails directly through their connected Gmail or works through the LinkedIn manual-send queue, where each lead opens with the message pre-copied to clipboard. A pipeline view tracks every lead through statuses from new to won. The user pays a flat monthly subscription via Stripe and connects their own Anthropic API key (BYOK), so per-user variable costs stay near zero.

---

## 2. Product Vision and Principles

### 2.1 Vision statement

> Make outbound feel like a thoughtful human wrote it, even when the user is sending to fifty prospects. Make it work in markets the existing tools have abandoned. Charge a fair price. Never put the user's main LinkedIn account at risk.

### 2.2 Design principles

These principles are the constitution of the product. Whenever a feature decision is unclear, return to these.

**Quality over volume.** The product's job is not to send 10,000 emails. It is to make the 50 emails you do send dramatically better than the 50 you would have written yourself. Every feature is judged on whether it improves draft quality or shortens the time from intent to a great message in the user's outbox.

**Never put the user's account at risk.** OutreachForge does not scrape LinkedIn, does not automate LinkedIn actions, does not impersonate the user on LinkedIn. The LinkedIn integration is a manual-send queue: copy to clipboard, open profile in new tab, user pastes and sends. This is non-negotiable. It is a feature, not a limitation, and the marketing copy says so explicitly.

**Bring your own everything.** The user brings their own Anthropic API key, their own Gmail account, their own lead lists, their own LinkedIn account. OutreachForge is the orchestration layer, not the data provider, not the model provider, not the inbox provider. This keeps unit economics safe for a solo founder, eliminates abuse vectors, and lets the user move data out at any time.

**Boring stack, fast iteration.** The technical stack is deliberately conservative: Next.js, Supabase, Stripe, the Anthropic SDK, the Gmail API. No exotic dependencies, no cutting-edge frameworks, no infrastructure the user has to manage. The goal is for one person with Claude Code to build, deploy, and maintain this product without help.

**Earnable trust, not demanded trust.** The product never claims to be magic. It shows the user what it found, why it thinks it is relevant, and what it is going to send. Every draft is editable. Every send is intentional. Nothing happens behind the user's back.

**Emerging markets first.** Even though MVP is English-only, the schema, UI, and prompts are designed so that adding a new locale in Phase 2 is a configuration change, not a rewrite. The marketing site, from day one, names CIS and MENA as the home market and uses screenshots and case studies that reflect that.

---

## 3. User Personas and Core Workflows

### 3.1 Primary persona: the founder-marketer

Sasha is the co-founder and head of growth at a 12-person Series A startup in Almaty selling a vertical SaaS product to mid-market retailers across Central Asia and the Caucasus. She has tried Apollo (their data on her market is thin), Lemlist (the AI drafts were embarrassing in Russian), and a freelance VA (decent but slow and inconsistent). She spends two days a month on outbound and would happily spend five if the output were good enough.

Sasha measures success by booked discovery calls per month from cold outbound. She does not care about open rates in isolation. She wants to send fewer, better messages.

### 3.2 Secondary persona: the agency operator

Karim runs a four-person outbound agency in Dubai that takes on B2B clients across MENA. He needs to manage multiple campaigns for multiple clients in parallel, keep their data isolated, and demonstrate quality of work to clients who are paying him a retainer. He pays for tools out of his own pocket and is sensitive to per-seat pricing. He needs to be able to white-label or at least share a clean read-only pipeline view with his clients.

White-labeling is Phase 3. Phase 2 adds shared workspaces and seat-based pricing for him.

### 3.3 The core workflow, end to end

1. **Sign up.** The user creates an account with email/password or Google. They land on an empty dashboard with a single call to action: create your first campaign.
2. **Connect keys.** Before they can do anything useful, the user is prompted to add their Anthropic API key (with a link to console.anthropic.com and a one-line explanation of why) and connect their Gmail account via OAuth. Both can be skipped temporarily but the user is reminded on every page until done.
3. **Create a campaign.** The user fills in a structured brief: product name, one-line description, what problem it solves, target ICP description, two or three value propositions, two or three proof points, three do's and three don'ts for tone, and the language of outreach (English in MVP). This brief is the prompt context for every draft generated under this campaign.
4. **Add leads.** The user uploads a Sales Navigator CSV export, pastes a list of LinkedIn URLs, or adds leads one at a time with a small form. Each lead becomes a row in the campaign with status "new."
5. **Trigger research.** The user clicks a button on a lead (or selects multiple leads and clicks bulk research). The system, for each lead, runs a research job: it fetches the company website if it can find one, runs web search queries for recent company news and signals, optionally accepts pasted profile text from the user for high-value leads, and then asks Claude to produce a structured dossier with fit assessment and three specific hooks. Status moves from new to researched.
6. **Trigger drafting.** The user clicks draft on a researched lead. The system asks Claude, with the campaign brief and the dossier as context, to produce a cold email (subject + body), a LinkedIn connection request note (under 300 characters), and a LinkedIn first-message DM. Status moves from researched to drafted.
7. **Review and edit.** The user opens the lead, sees the dossier on the left and the three drafts on the right, edits any of them inline, and clicks approve. Status moves from drafted to approved.
8. **Send.** For email, the user clicks send and the message goes out via the Gmail API on their connected account. For LinkedIn, the user clicks send on a manual-send queue card; the message is copied to clipboard, the LinkedIn profile opens in a new tab, the user pastes and sends, then clicks "mark sent" in the app. Status moves from approved to sent.
9. **Track replies.** For email, the system polls the Gmail API every few minutes for replies on threads it sent. For LinkedIn, the user logs replies manually with a one-click button. Status moves from sent to replied. Once the user books a meeting, they mark the lead as meeting; once a deal is won or lost, they update accordingly.
10. **Iterate.** The dashboard shows simple metrics: how many leads researched, how many drafts approved, how many sent, how many replied, how many meetings. The user uses this to learn what works and tighten their next campaign brief.

---

## 4. Feature List

Features are organized by phase. MVP is the smallest possible thing that delivers value to a paying user. Phase 2 is what the first ten paying users will ask for. Phase 3 is what unlocks the next stage of growth.

### 4.1 MVP features

#### Authentication and accounts
- Email and password signup with email verification.
- Google OAuth signup and signin.
- Password reset via email link.
- Single-user workspaces in MVP. Multi-user is Phase 2 but the schema has an organizations table from day one so it is not a migration later.
- Session management via Supabase Auth.

#### Settings and key management
- Anthropic API key field, stored encrypted at rest. Test button that pings the Anthropic API and confirms the key works.
- Gmail OAuth flow that requests send and read scopes for the connected account.
- Profile fields: name, email, default sender name, default sender signature.
- Billing portal link (Stripe customer portal).

#### Campaigns
- Create, rename, archive, and delete campaigns.
- Campaign brief form with structured fields: product name, product one-liner, problem statement, target ICP description, three value props, three proof points, three tone do's, three tone don'ts, language (English only in MVP, dropdown ready for more).
- Campaign-level statistics card showing leads, researched, drafted, approved, sent, replied counts.

#### Lead intake
- CSV upload that accepts the standard Sales Navigator export schema and maps columns automatically.
- Manual paste of LinkedIn URLs (one per line).
- Single-lead manual entry form.
- Per-lead optional fields: pasted profile text, pasted recent post, custom notes.
- Duplicate detection by LinkedIn URL within a campaign.

#### Research engine
- On-demand research job triggered per lead or in bulk for selected leads.
- Job runs server-side as a background task and updates lead status when complete.
- Research steps: extract company domain from lead data, fetch company homepage and about page, run web search for `[company name] news` and `[person name] [company name]`, collect raw text into a research bundle.
- Final step: call Claude with the campaign brief and the research bundle, ask for a structured dossier.
- Dossier schema: company summary, role summary, signals (recent events worth referencing), pain hypothesis, three concrete hooks specific to this lead, fit score from 1 to 5 with reasoning.
- Dossier is editable by the user after generation.

#### Drafting engine
- On-demand drafting job triggered per lead. Requires dossier to exist.
- Calls Claude once with campaign brief plus dossier and asks for three artifacts: cold email subject and body, LinkedIn connection request note, LinkedIn first-message DM.
- All three artifacts must reference at least one specific hook from the dossier, never generic.
- Editable inline. Regenerate button on each artifact independently.
- Approval flow: user clicks approve on each artifact or approve-all on the lead.

#### Sending: Email
- Send button on approved email drafts. Sends via the user's connected Gmail account using the Gmail API.
- Server stores the Gmail thread ID returned by the send call.
- Background job polls Gmail for replies on tracked thread IDs every five minutes and updates lead status to replied when a reply arrives.
- If the Gmail token expires, the user is prompted to reconnect.

#### Sending: LinkedIn (manual-send queue)
- Manual-send queue view showing all approved-but-not-sent LinkedIn drafts grouped by campaign.
- Each card shows the lead, the draft, and a primary action: "Copy and open profile." Clicking it copies the message to the system clipboard and opens the lead's LinkedIn URL in a new tab.
- After the user sends manually on LinkedIn, they click "Mark sent" on the card.
- Reply tracking is fully manual: one-click "Mark replied" with a small text field for pasting the reply text.

#### Pipeline view
- Per-campaign Kanban-style or table view of all leads grouped by status.
- Statuses: new, researched, drafted, approved, sent, replied, meeting, won, lost.
- Filter by status, search by name or company, sort by date added or last activity.
- Click a lead to open a detail panel with dossier, drafts, and activity log.

#### Dashboard
- Account-level home with one card per campaign showing key counts and a sparkline of activity over the last 30 days.
- Empty state with a clear next-action call to action.
- Quick links to manual-send queue and recent replies.

#### Billing
- Stripe Checkout for subscription signup.
- Two tiers in MVP: Solo at one price for one user and 200 leads researched per month, Pro at a higher price for one user and 1,000 leads researched per month.
- Free trial: 14 days, no card required, capped at 25 leads researched.
- Hard usage caps enforced server-side. When cap is hit, research and drafting buttons are disabled with an upgrade prompt.
- Stripe webhook handler updates user plan and resets usage counters on each billing cycle.
- Stripe customer portal for managing subscription and payment method.

#### Cross-cutting
- Multi-tenant data isolation enforced at the database layer with Supabase row-level security policies.
- Activity log on every lead capturing every status change and every draft generation.
- Error handling and retry on Anthropic API and Gmail API calls.
- Loading states everywhere a network call happens.
- Dark mode.
- Mobile-responsive layout (read-mostly on mobile is acceptable; primary use is desktop).

### 4.2 Phase 2 features (after first 10 paying users)

- Multi-step email sequences with conditional logic (if no reply in N days, send follow-up).
- A/B testing of subject lines and openers.
- Team workspaces with seats, shared campaigns, role-based permissions.
- Outlook / Microsoft 365 integration in addition to Gmail.
- CSV export of leads and pipeline.
- Webhooks for outbound events (lead replied, meeting booked).
- Zapier and Make integrations.
- Chrome extension to send a LinkedIn profile from any page directly into a campaign.
- Russian, Uzbek, Persian, Arabic, and Turkish drafting locales.
- Per-locale prompt tuning and locale-specific tone guidelines.

### 4.3 Phase 3 features (post product-market fit)

- Optional managed enrichment via Apollo, Lusha, or PhantomBuster as bundled credits.
- Native CRM sync with HubSpot, Pipedrive, Attio.
- WhatsApp manual-send queue for CIS and MENA business contexts.
- Voice note generation for LinkedIn DMs.
- "Lookalike" feature: paste five best customers, get fifty similar companies.
- Agency white-label mode and client read-only views.
- Audit logs and SOC2 readiness.

### 4.4 Explicitly out of scope, possibly forever

- LinkedIn scraping or LinkedIn automation of any kind.
- Email warmup infrastructure. Users plug in Instantly or Smartlead if they want it.
- Built-in dialer or calling features.
- Generic AI chatbot or AI SDR agent positioning.
- Hosting user inboxes or sending domains.

---

## 5. Recommended Tech Stack

This stack is chosen for one criterion: a solo founder using Claude Code can build, deploy, and maintain the entire product without specialized infrastructure knowledge. Every component is well-documented, well-supported, and has been used in many production AI SaaS applications.

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | Industry standard, full-stack, great Claude Code support. |
| UI components | shadcn/ui + Tailwind CSS | Copy-paste components, no lock-in, beautiful defaults. |
| Auth and database | Supabase (Postgres + Auth + RLS) | Auth, database, storage, and row-level security in one. Generous free tier. |
| Background jobs | Inngest | Reliable async jobs for research and drafting. Free tier covers MVP. |
| Payments | Stripe + stripe-node + webhooks | The only serious option for SaaS billing. |
| LLM | Anthropic SDK (BYOK) | User supplies their own key. Server proxies calls. |
| Email | Gmail API via googleapis | User connects own Gmail; we never hold sending infrastructure. |
| Web search (research) | Tavily | Purpose-built for AI agents, clean output. |
| Web fetching (research) | Jina Reader | Reliable HTML-to-markdown for company sites. |
| Hosting | Vercel | Native Next.js host, free tier sufficient. |
| Email (transactional) | Resend | Signup confirmations, password resets, billing emails. Not for outbound. |
| Error monitoring | Sentry | Free tier sufficient. |
| Analytics | PostHog | Product analytics and feature flags. |

Total monthly cost at zero users: roughly zero (all free tiers). Total monthly cost at fifty paying users: roughly $50 to $150 depending on usage. The user's Anthropic and Gmail costs are not on your books because of BYOK.

### 5.1 Repository structure

```
outreachforge/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # signin, signup, reset
│   ├── (marketing)/              # public landing, pricing
│   ├── (dashboard)/              # authenticated app
│   │   ├── campaigns/
│   │   ├── leads/
│   │   ├── queue/                # LinkedIn manual-send queue
│   │   ├── settings/
│   │   └── billing/
│   ├── api/
│   │   ├── research/             # POST: trigger research job
│   │   ├── draft/                # POST: trigger drafting job
│   │   ├── send-email/           # POST: send via Gmail
│   │   ├── webhooks/
│   │   │   ├── stripe/
│   │   │   └── inngest/
│   │   └── inngest/              # Inngest functions endpoint
│   └── layout.tsx
├── components/                   # shadcn + custom
├── lib/
│   ├── supabase/                 # client, server, middleware
│   ├── anthropic/                # client wrapper, prompts
│   ├── gmail/                    # OAuth, send, poll replies
│   ├── research/                 # web search + fetch
│   ├── prompts/                  # all system prompts as TS exports
│   ├── crypto/                   # AES-256-GCM for stored secrets
│   └── utils/
├── inngest/                      # background job functions
├── supabase/
│   ├── migrations/               # SQL schema migrations
│   └── seed.sql
├── public/
├── docs/
│   └── PRD.md
├── .env.example
├── CLAUDE.md
├── package.json
└── README.md
```

---

## 6. Database Schema

All tables live in Supabase Postgres. Row-level security is enabled on every table. The basic isolation rule is: a user can only see rows belonging to organizations they are a member of. In MVP each user has exactly one organization; the schema supports many-to-many from day one to avoid migrations later.

### 6.1 Tables

#### organizations
```sql
id              uuid primary key default gen_random_uuid()
name            text not null
plan            text not null default 'trial'  -- trial | solo | pro
plan_renews_at  timestamptz
trial_ends_at   timestamptz
stripe_customer_id text
created_at      timestamptz not null default now()
```

#### organization_members
```sql
organization_id uuid references organizations(id) on delete cascade
user_id         uuid references auth.users(id) on delete cascade
role            text not null default 'owner'  -- owner | admin | member
created_at      timestamptz not null default now()
primary key (organization_id, user_id)
```

#### user_settings
```sql
user_id              uuid primary key references auth.users(id) on delete cascade
anthropic_api_key    text  -- encrypted at rest (AES-256-GCM)
gmail_refresh_token  text  -- encrypted
gmail_email          text
default_sender_name  text
default_signature    text
updated_at           timestamptz not null default now()
```

#### campaigns
```sql
id              uuid primary key default gen_random_uuid()
organization_id uuid not null references organizations(id) on delete cascade
name            text not null
status          text not null default 'active'  -- active | archived
brief           jsonb not null
language        text not null default 'en'
created_at      timestamptz not null default now()
updated_at      timestamptz not null default now()
```

The `brief` jsonb has a fixed shape:
```json
{
  "product_name": "Livuvo",
  "product_oneliner": "AI-powered interactive video commerce for emerging markets.",
  "problem_statement": "Brands in CIS struggle to convert social video traffic into sales because their stack is built for Western patterns.",
  "target_icp": "Mid-market e-commerce brands in Uzbekistan, Kazakhstan, and Azerbaijan with $1M+ GMV.",
  "value_props": ["Localized for CIS commerce", "Shoppable video without dev work", "Built-in influencer integration"],
  "proof_points": ["Used by [brand]", "X% lift in conversion at [brand]", "Live in 3 CIS markets"],
  "tone_dos": ["Direct", "Specific", "Respectful of the reader's time"],
  "tone_donts": ["No buzzwords", "No fake urgency", "No 'hope this email finds you well'"]
}
```

#### leads
```sql
id              uuid primary key default gen_random_uuid()
campaign_id     uuid not null references campaigns(id) on delete cascade
organization_id uuid not null references organizations(id) on delete cascade
status          text not null default 'new'
                -- new | researched | drafted | approved | sent | replied | meeting | won | lost
full_name       text not null
title           text
company_name    text
company_domain  text
linkedin_url    text
email           text
location        text
pasted_profile  text
custom_notes    text
dossier         jsonb
drafts          jsonb
gmail_thread_id text
sent_at         timestamptz
linkedin_dm_sent_at timestamptz
replied_at      timestamptz
created_at      timestamptz not null default now()
updated_at      timestamptz not null default now()
```

The `drafts` jsonb shape:
```json
{
  "email": {
    "subject": "...",
    "body": "...",
    "approved": false,
    "regenerated_at": "2026-04-13T10:00:00Z"
  },
  "linkedin_connect": {
    "note": "...",
    "approved": false
  },
  "linkedin_dm": {
    "message": "...",
    "approved": false
  }
}
```

#### activity_log
```sql
id              uuid primary key default gen_random_uuid()
lead_id         uuid not null references leads(id) on delete cascade
organization_id uuid not null references organizations(id) on delete cascade
event_type      text not null
metadata        jsonb
created_at      timestamptz not null default now()
```

#### usage_counters
```sql
organization_id     uuid primary key references organizations(id) on delete cascade
period_start        date not null
leads_researched    int not null default 0
drafts_generated    int not null default 0
emails_sent         int not null default 0
```

### 6.2 Row-level security policies

Every table that contains organization data has an RLS policy of the form:

```sql
create policy "members can read their org rows"
on <table>
for select
using (
  organization_id in (
    select organization_id from organization_members where user_id = auth.uid()
  )
);

create policy "members can insert into their org"
on <table>
for insert
with check (
  organization_id in (
    select organization_id from organization_members where user_id = auth.uid()
  )
);

-- update and delete follow the same pattern
```

`user_settings` is keyed by `user_id`, not `organization_id`, so its policy is simpler: `user_id = auth.uid()`.

---

## 7. Page-by-Page UI Specification

This section describes every screen in the MVP at the level of detail Claude Code needs to scaffold the layout. Visual polish is left to the implementer. Use shadcn/ui components throughout.

### 7.1 Marketing site

**`/` (landing page)** — Hero with the headline "Cold outbound that sounds like you wrote it yourself" and subheadline "For founders selling B2B in markets the big tools forgot." Three feature cards: Research, Draft, Send. Pricing table. FAQ. Footer.

**`/pricing`** — Two pricing cards: Solo and Pro. Each with feature bullets, monthly/annual toggle, and a Start Free Trial button that goes to `/signup`.

**`/login`, `/signup`, `/forgot-password`** — Standard auth pages with email/password and "Continue with Google" button.

### 7.2 Authenticated app shell

Top nav with logo, campaigns dropdown, manual-send queue link (with badge for queued count), and avatar menu (settings, billing, sign out). Left sidebar within campaign view shows the campaign list and a button to create a new campaign.

### 7.3 `/dashboard`

Empty state if no campaigns: large Create Your First Campaign button. Otherwise: a grid of campaign cards each showing name, total leads, leads in each major status (research / draft / sent / replied), and a small sparkline of the last 30 days. Click a card to enter the campaign.

### 7.4 `/campaigns/[id]`

Campaign view with three tabs: Pipeline, Brief, Settings.

**Pipeline tab** — Default view. Top bar has filters (status multi-select, search by name/company), and bulk actions (research selected, draft selected). Body shows leads either as a Kanban board grouped by status or as a table; user can toggle. Each card or row shows full name, title, company, status badge, and a kebab menu (research, draft, view detail, delete). Clicking a lead opens a side panel with the lead detail view (see 7.6).

**Brief tab** — The structured campaign brief form, editable. Save button at the bottom. Updating the brief does NOT regenerate existing dossiers or drafts; it only affects future generations. A small note explains this.

**Settings tab** — Campaign name, language, status (active/archived), delete campaign button (with confirmation).

### 7.5 `/campaigns/[id]/leads/new`

Three sub-views in tabs: Upload CSV, Paste URLs, Add One Lead. The CSV upload tab shows a drop zone, a column-mapping step after upload (auto-detects Sales Nav format), and a preview of the first ten parsed rows before final import.

### 7.6 Lead detail panel

Slides in from the right, takes up roughly 60% of the screen width. Two columns inside the panel.

**Left column: Dossier** — Header with full name, title at company, status badge, LinkedIn URL link. Below: the dossier in collapsible sections (Company summary, Role summary, Signals, Pain hypothesis, Hooks, Fit score). Each section editable inline. Buttons: Run research, Re-run research, Edit dossier.

**Right column: Drafts** — Three cards stacked: Email, LinkedIn connection note, LinkedIn DM. Each card has the draft text in an editable textarea, an Approve button, a Regenerate button, and a small character/word counter (the connection note card shows a 300-char limit warning if exceeded). Below the three cards: a Send section that activates only when the email is approved (Send Email button) and when the LinkedIn DM is approved (Add to manual-send queue button, automatic if approved).

**Bottom: Activity log** — Reverse chronological list of events on this lead.

### 7.7 `/queue`

LinkedIn manual-send queue. Top has campaign filter and a count of items. Body is a vertical list of cards, one per queued LinkedIn message. Each card shows the lead, the campaign, the message body, and a single primary button: "Copy and open profile." After clicking, the button changes to "Mark sent" for that card. A small "Mark replied" link appears on cards that have been marked sent.

### 7.8 `/settings`

Profile section (name, default sender name, default signature). Anthropic API key section with a paste field, a Save button, and a Test Connection button. Gmail section with either a Connect Gmail button or, if connected, the connected email address and a Disconnect button. Danger zone with Delete Account.

### 7.9 `/billing`

Current plan card showing tier, renewal date, usage this period (leads researched and emails sent against caps). Change Plan button opens the Stripe customer portal. Past invoices link.

---

## 8. Core Prompts

The prompts in this section are the actual product. Most of the engineering work in building OutreachForge is wiring data into and out of these prompts cleanly. Treat them as production assets: version-control them in `lib/prompts/`, write tests for their outputs, iterate on them based on real user feedback.

All prompts assume the latest Claude Sonnet model. All prompts ask Claude to return JSON in a strict schema so the application can parse and store the output.

### 8.1 Research dossier prompt

Used after the research bundle (company website text, news search results, optionally pasted profile text) has been collected. The system prompt and user prompt are sent in a single Anthropic messages call.

**System prompt:**
```
You are a senior B2B outbound researcher. Your job is to read raw research material about a prospect and their company, and produce a tight, evidence-based dossier that another AI will use to write a personalized cold outreach message.

Your dossier must be:
- Specific. Generic statements ("they are a growing company") are forbidden. Every claim must be grounded in the source material.
- Honest about what you don't know. If the research is thin, say so. Do not invent facts.
- Useful for outbound. Focus on signals that suggest a buying need, not on company history trivia.
- Written in English, regardless of the source material's language.

You will be given:
1. A campaign brief describing the product being sold and its ICP.
2. A research bundle: scraped web pages, search results, and optionally a pasted LinkedIn profile.
3. Basic lead metadata (name, title, company).

You must respond with a single JSON object matching the schema provided. Do not include any text outside the JSON.
```

**User prompt template:**
```
<campaign_brief>
{{campaign_brief_json}}
</campaign_brief>

<lead>
Name: {{full_name}}
Title: {{title}}
Company: {{company_name}}
LinkedIn: {{linkedin_url}}
Location: {{location}}
</lead>

<research_bundle>
{{research_bundle_text}}
</research_bundle>

Produce the dossier as JSON with this exact schema:

{
  "company_summary": "2-3 sentences about what the company actually does, in plain English.",
  "role_summary": "1-2 sentences about what this person likely owns and cares about in their role.",
  "signals": ["List of 1-5 specific recent signals: news, hiring, product launches, posts, funding, expansion. Each item must reference the source. If none found, return []."],
  "pain_hypothesis": "1-2 sentences naming the most likely pain that the product in the campaign brief could solve for this specific lead. Tie it to the signals and role.",
  "hooks": [
    {"hook": "First specific opener idea referencing the lead or company.", "rationale": "Why this hook is likely to resonate."},
    {"hook": "Second hook.", "rationale": "..."},
    {"hook": "Third hook.", "rationale": "..."}
  ],
  "fit_score": 4,
  "fit_reasoning": "1-2 sentences explaining the score from 1 (poor fit) to 5 (excellent fit).",
  "research_quality": "thin | adequate | rich"
}
```

### 8.2 Drafting prompt

Used after a dossier exists. Generates the three artifacts in one call to minimize cost and keep style consistent across them.

**System prompt:**
```
You are an elite B2B copywriter who specializes in cold outbound that does not sound like cold outbound. You write the way a thoughtful founder writes when she is reaching out to one specific person she actually wants to talk to.

Your rules:
- Every message must reference at least one specific hook from the dossier. Generic openers are an automatic fail.
- No corporate filler. No "I hope this email finds you well." No "I came across your profile." No "I wanted to reach out about..."
- Short. Cold emails: 60-110 words for the body. LinkedIn DMs: 50-90 words. Connection notes: under 300 characters total.
- Specific. Mention something real from the dossier in the first or second sentence.
- One ask. Each message asks for exactly one thing, and that thing is small (a 15-minute call, a reply, a yes/no).
- Match the tone do's and don'ts from the campaign brief exactly.
- The cold email subject line is not a teaser. It is a clear, specific promise of what the email is about. 4-7 words.
- Return strictly the JSON schema requested. No extra text.
```

**User prompt template:**
```
<campaign_brief>
{{campaign_brief_json}}
</campaign_brief>

<dossier>
{{dossier_json}}
</dossier>

<lead>
Name: {{full_name}}
Title: {{title}}
Company: {{company_name}}
</lead>

<sender>
Name: {{sender_name}}
Signature: {{sender_signature}}
</sender>

Produce the three drafts as JSON:

{
  "email": {
    "subject": "string, 4-7 words",
    "body": "string, 60-110 words, plain text with line breaks. Do not include the signature; it will be appended."
  },
  "linkedin_connect": {
    "note": "string, MUST be 300 characters or fewer including spaces."
  },
  "linkedin_dm": {
    "message": "string, 50-90 words. This is sent AFTER the connection is accepted, so do not re-introduce yourself in the same way as the connection note."
  },
  "hook_used": "Which hook from the dossier you anchored the messages on, by index (0, 1, or 2)."
}
```

### 8.3 Regeneration prompt (single artifact)

When the user clicks Regenerate on a single draft, send the same context as the drafting prompt but ask only for that one artifact, plus an optional user instruction.

```
Append to the user prompt:

The user is regenerating only the {{artifact_name}}. Their instruction:
"{{user_instruction}}"

Return only that artifact in JSON, e.g. {"email": {"subject": "...", "body": "..."}}.
```

### 8.4 Notes on prompt iteration

These prompts are a starting point, not a finished product. Plan to iterate weekly during the first three months based on real outputs. Keep a small evaluation set of 20 representative leads and re-run them after every prompt change so you can see whether quality is improving or regressing. Store prompt versions in git with semantic version tags so you can roll back.

---

## 9. Claude Code Build Plan

This section is the operational playbook for building the MVP with Claude Code. It assumes you are working solo, using Claude Code in a terminal, and have a fresh empty directory. Each step is a self-contained chunk of work that produces a runnable artifact. Do not skip ahead. After each step, run the project, click around, and confirm it works before moving on.

Estimated total time for a focused solo build: four to six weeks of evening work.

### Step 0: Prerequisites

- A GitHub account and a new empty repo named `outreachforge`.
- A Vercel account connected to that repo.
- A Supabase project (free tier).
- A Stripe account in test mode.
- An Anthropic API key for your own testing (separate from the BYOK key users will provide).
- A Google Cloud project with the Gmail API enabled, OAuth consent screen configured, and a test OAuth client.
- A Tavily API key.
- Claude Code installed and authenticated.

### Step 1: Project scaffold

Open Claude Code in your empty repo directory and give it this prompt:

```
Initialize a Next.js 15 project with the App Router, TypeScript (strict mode), Tailwind CSS, and shadcn/ui. Set up the folder structure shown in PRD section 5.1. Add a basic landing page at / with a hero, three feature cards, and a CTA to /signup, matching the copy in PRD section 7.1. Add empty placeholder pages for /signup, /login, /dashboard, /settings, /billing, /queue. Configure ESLint and Prettier. Set up next-themes for dark mode. Make sure pnpm dev runs cleanly. Commit and push.
```

Confirm the dev server runs and the landing page renders. Push to GitHub. Confirm Vercel auto-deploys.

### Step 2: Supabase auth and base schema

```
Add Supabase to the project. Use the @supabase/ssr package for Next.js App Router integration. Create three Supabase clients: a server client for server components, a route handler client, and a browser client. Add middleware for session refresh. Implement /signup, /login, /forgot-password using Supabase Auth with email/password (require email verification before dashboard access) and Google OAuth. After login, redirect to /dashboard. Protect /dashboard, /settings, /billing, /queue, /campaigns/* routes so unauthenticated users are redirected to /login.

Then write a SQL migration in supabase/migrations that creates the tables exactly as specified in PRD section 6.1: organizations, organization_members, user_settings, campaigns, leads, activity_log, usage_counters. Add the row-level security policies from section 6.2. On user signup, automatically create a personal organization and an organization_members row via a Postgres trigger. Set trial_ends_at to now() + 14 days and plan to 'trial'.
```

Test: sign up with email, verify, log in, log out, sign up with Google. Check Supabase dashboard for the rows.

### Step 3: Settings page and key management

```
Build the /settings page per PRD section 7.8. It has three sections:

1. Profile: name, default sender name, default signature. Saves to user_settings.

2. Anthropic API key: paste field, Save button, Test Connection button. The Test button calls a server action that uses the key to make a minimal Anthropic API call (e.g., a 5-token completion) and reports success or the exact error. Store the key encrypted with AES-256-GCM using the helpers in lib/crypto/ (create them in this step — they read ENCRYPTION_KEY from env, a 32-byte hex string).

3. Gmail: a Connect Gmail button that initiates an OAuth flow requesting gmail.send and gmail.readonly scopes. Store the refresh token encrypted in user_settings.gmail_refresh_token. Show the connected email and a Disconnect button after connection.

Use shadcn/ui Form, Input, Button, Card components. Loading states on every action.
```

Test: paste a real Anthropic key, click Test, confirm success. Connect a real Gmail account, confirm the email appears.

### Step 4: Campaigns CRUD

```
Build the campaign create flow and the /campaigns/[id] page with the three tabs from PRD section 7.4: Pipeline (placeholder), Brief, Settings. The Brief tab has the structured form from section 6.1 (product_name, product_oneliner, problem_statement, target_icp, value_props as a list of three, proof_points as a list of three, tone_dos, tone_donts, language). Save to campaigns.brief jsonb. The Settings tab has rename, archive, delete with a confirmation dialog. The dashboard at /dashboard shows a grid of campaign cards per section 7.3 with proper empty state.
```

Test: create a campaign, fill in the brief, edit it, archive it, delete it. Try accessing another user's campaign URL — RLS should block it.

### Step 5: Lead intake

```
Build /campaigns/[id]/leads/new per PRD section 7.5 with three tabs: Upload CSV, Paste URLs, Add One Lead.

CSV upload: accept a file, parse with papaparse, auto-detect Sales Navigator export columns (First Name, Last Name, Title, Company, LinkedIn URL, Location), show a column-mapping UI, preview the first 10 parsed rows, then on confirm insert into leads with status 'new'.

Paste URLs: textarea for one URL per line, parse, insert minimal records.

Add One Lead: a form with full_name, title, company_name, linkedin_url, email, location, custom_notes.

Implement duplicate detection by linkedin_url within a campaign: skip duplicates and show a count.
```

### Step 6: Pipeline view

```
Build the Pipeline tab on /campaigns/[id] per PRD section 7.4. Default view is a table showing all leads with columns: name, title, company, status, last activity. Top bar has a status multi-select filter and a search input. Add a view toggle between table and Kanban (Kanban groups by status). Each row/card has a kebab menu with Research, Draft, View Detail, Delete. Clicking a row opens the lead detail panel as a slide-over from the right (60% screen width).

Build the lead detail panel layout per section 7.6, with placeholder content for the dossier and drafts (Run Research and Generate Drafts buttons, no functionality yet — they'll be wired in steps 8 and 9).
```

### Step 7: Background jobs setup

```
Add Inngest to the project. Create app/api/inngest/route.ts as the function endpoint. Set up two background functions:

1. researchLead({ leadId }) — placeholder, logs and updates lead.status to 'researched' after a 2-second delay.
2. draftLead({ leadId }) — placeholder, sets lead.status to 'drafted'.

Wire the Run Research button on the lead detail panel to trigger researchLead via an API route. The UI should show a spinner on the lead while the job is running. Use Supabase realtime or polling to refresh the lead row when status changes.
```

Test: click Run Research, see the spinner, see the status update.

### Step 8: Research engine (the real thing)

```
Implement the researchLead Inngest function for real.

Steps inside the function:
1. Load the lead and its campaign from Supabase.
2. Determine the company domain: if lead.company_domain is set, use it; else infer from company_name via a Tavily search "[company name] official site" and pick the top result; else skip web fetching.
3. Fetch the company homepage and /about page using Jina Reader (https://r.jina.ai/{url}) and store the markdown.
4. Run Tavily searches for "[company name] news" and "[full name] [company name]"; store top 5 result snippets.
5. Build a research bundle as a single markdown string with clear section headers.
6. Load the user's Anthropic API key from user_settings (decrypted via lib/crypto/).
7. Call Claude using the system and user prompts from PRD section 8.1. Pass the campaign brief as JSON, the lead metadata, and the research bundle.
8. Parse the JSON response. Validate against the schema. Store in lead.dossier.
9. Update lead.status to 'researched'. Insert an activity_log row.
10. Increment usage_counters.leads_researched for the organization.

Handle errors: if the Anthropic call fails, mark the lead with an error state and do not consume usage credit. If the user has no Anthropic key, return a clear error and leave the lead in 'new' status.

Add a check at the start: if usage_counters.leads_researched is at or above the plan cap, return 'usage_limit_exceeded'.

Render the dossier in the lead detail panel left column with the collapsible sections from PRD section 7.6, all editable inline.
```

### Step 9: Drafting engine

```
Implement the draftLead Inngest function.

Steps:
1. Load the lead. Confirm dossier exists (else return error 'no_dossier').
2. Load the campaign brief and the user's sender info.
3. Load the Anthropic API key.
4. Call Claude with the system and user prompts from PRD section 8.2.
5. Parse the JSON. Validate. Store in lead.drafts with all approved=false.
6. Update lead.status to 'drafted'. Activity log. Increment drafts_generated counter.

Wire the Generate Drafts button on the lead detail panel. After completion, the right column of the panel renders the three draft cards from section 7.6.
```

### Step 10: Draft editing and approval

```
Make the three draft cards in the lead detail panel fully interactive:
- Each card's text is in a textarea. Saving on blur updates lead.drafts.
- Each card has Approve and Regenerate buttons.
- Approve sets drafts.{artifact}.approved = true and updates the UI.
- Regenerate opens a small dialog with an optional instruction text input ("make it shorter," "change the angle"), then calls a regenerate API route that runs the regeneration prompt from section 8.3 and updates only that artifact.
- The connection note card shows a live character counter and turns red over 300.

Add an Approve All button at the top of the right column.

When all three drafts are approved, lead.status moves to 'approved'.
```

### Step 11: Email sending

```
Add a Send Email section in the lead detail panel that activates when the email draft is approved.

Server action sendEmail(leadId):
1. Load lead, drafts.email, user gmail_refresh_token, sender_signature.
2. Refresh the Gmail access token using the refresh token.
3. Construct an RFC 2822 email: To = lead.email, Subject = drafts.email.subject, Body = drafts.email.body + "\n\n" + sender_signature.
4. Send via gmail.users.messages.send.
5. Store the returned thread_id in lead.gmail_thread_id, set sent_at, status = 'sent'. Activity log. Increment emails_sent counter.

Handle errors: missing email field, Gmail token expired (prompt to reconnect), Gmail API error.
```

### Step 12: Reply tracking via Gmail polling

```
Add a scheduled Inngest function pollEmailReplies that runs every 5 minutes:
1. For each org with at least one lead in 'sent' status with a gmail_thread_id, group by user and load their Gmail token.
2. For each tracked thread, call gmail.users.threads.get and check if there is more than one message and the latest message is not from the connected user.
3. If a reply is detected, set lead.replied_at and status = 'replied'. Activity log.

Add a small UI indicator on the dashboard and pipeline view for new replies.
```

### Step 13: LinkedIn manual-send queue

```
Build /queue per PRD section 7.7. The queue lists all leads where:
- linkedin_dm is approved
- linkedin_dm_sent_at is null

Each card has a primary button "Copy and open profile" that:
1. Copies drafts.linkedin_dm.message to the clipboard via navigator.clipboard.writeText.
2. Opens lead.linkedin_url in a new tab via window.open.
3. Changes the button to "Mark sent."

Mark sent updates linkedin_dm_sent_at and removes the card. Add a "Mark replied" link below sent items that opens a tiny dialog to paste the reply text and update status.

Also expose a "Copy connection note" button on the same card for the connection note workflow.

Add a count badge in the top nav next to the Queue link.
```

### Step 14: Stripe billing

```
Set up Stripe with two products: Solo and Pro, each with a monthly and annual price.

Build /billing per PRD section 7.9 showing current plan, usage this period, and a Manage Billing button that opens the Stripe customer portal.

Add /api/webhooks/stripe to handle: checkout.session.completed (set organization.plan, plan_renews_at), customer.subscription.updated, customer.subscription.deleted.

Free trial: 14 days from signup, 25 leads researched cap. Solo: 200/month. Pro: 1000/month. Reset usage_counters at the start of each billing period.

When usage is at cap, the Run Research and Generate Drafts buttons are disabled with a tooltip "You've hit your monthly cap. Upgrade or wait until [date]."
```

### Step 15: Polish, error handling, and launch checklist

- Add Sentry to capture unhandled errors.
- Add PostHog. Track: campaign_created, lead_added, research_completed, draft_approved, email_sent, linkedin_marked_sent, reply_received.
- Add a feedback widget (textarea + Resend email to your inbox) on every page.
- Write the privacy policy and terms of service. Mention explicitly that the platform does not scrape or automate LinkedIn.
- Run through the entire flow as a fresh user with a fresh email. Fix rough edges.
- Set up invite-only access for the first two weeks.

### Step 16: First users and feedback loop

Do not launch publicly. Invite five to ten people you know personally, ideally from your CIS and MENA network, who actually do outbound. Onboard each one in a 30-minute call. Watch them use the product. Take notes on every confusion and every place the drafts disappoint. Iterate on the prompts and UI for two to four weeks before opening signups more broadly.

Keep a Google Sheet with 20 representative leads as your eval set. After every prompt change, regenerate dossiers and drafts for these 20 and rate them yourself. If quality drops, roll back.

---

## 10. Risks and Open Questions

### 10.1 Risks

**Prompt quality is the entire product.** If the dossiers and drafts are not visibly better than what a competent marketer would write in 5 minutes, no feature in this PRD matters. Mitigation: build the eval harness from week one, iterate on prompts with real leads constantly, and do not optimize features until quality is locked.

**BYOK friction at signup.** Asking users to paste an Anthropic API key before they can experience the product is a real conversion drag. Acknowledged risk; addressed in Phase 2 with optional bundled credits.

**Solo founder burnout.** Building, supporting, marketing, and selling a SaaS solo is brutal. Mitigation: ship the MVP narrow, do not let scope creep, keep the cost base near zero, protect 6-8 hours per week for thinking and writing about the product, not just building it.

### 10.2 Locked decisions

These were open in earlier drafts; they are now closed and live in `CLAUDE.md`.

- Tavily for search.
- Inngest for jobs.
- App-level AES-256-GCM for stored secrets.
- Email verification required.
- Working name: OutreachForge.
- No platform-funded trial credits in MVP.

---

## 11. Appendices

### Appendix A: Sample campaign brief for Livuvo

Use this as a test fixture when developing and as a real first campaign once the MVP is live.

```json
{
  "product_name": "Livuvo",
  "product_oneliner": "AI-powered interactive video commerce platform for emerging markets, starting in Uzbekistan and the wider CIS.",
  "problem_statement": "Brands across CIS and MENA generate enormous social video traffic but their commerce stack is built for Western patterns, so most of that attention never converts to sales. Localized, shoppable video is missing.",
  "target_icp": "Mid-market and enterprise consumer brands and retailers in Uzbekistan, Kazakhstan, Azerbaijan, and the wider CIS doing at least $1M annual GMV, with active social presence on Instagram or TikTok.",
  "value_props": [
    "Built specifically for CIS commerce patterns, languages, and payment rails.",
    "Shoppable interactive video without engineering work on the brand side.",
    "Native influencer and creator integration for the markets where Western influencer tools are absent."
  ],
  "proof_points": [
    "Built by a founding team with deep CIS commerce experience (ex-Digikala).",
    "Live with brands across multiple CIS markets.",
    "Backed by experienced regional operators."
  ],
  "tone_dos": [
    "Direct and specific.",
    "Respectful of the reader's time.",
    "Confident without bragging."
  ],
  "tone_donts": [
    "No corporate buzzwords.",
    "No fake urgency.",
    "No 'I hope this email finds you well.'"
  ]
}
```

### Appendix B: Environment variables (`.env.example`)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_SOLO_MONTHLY=
STRIPE_PRICE_SOLO_ANNUAL=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_ANNUAL=

# Google OAuth (Gmail)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Research
TAVILY_API_KEY=
JINA_READER_BASE_URL=https://r.jina.ai

# Transactional email
RESEND_API_KEY=

# Observability
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# App-level encryption (32-byte hex string)
ENCRYPTION_KEY=

# App URL (used for OAuth callbacks, emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

**End of document. Version 1.0. Now go build.**

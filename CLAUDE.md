# OutreachForge — Claude Code Project Instructions

This file is read by Claude Code on every session. It is the persistent rulebook for this project. Read it fully before doing anything.

## What we are building

OutreachForge is a **multi-tenant SaaS web application** for AI-powered B2B outbound research and drafting. It is **not** an API, not a CLI, not a script. The deliverable is a working web app that a non-technical user signs into in a browser, clicks around in, and uses to do real work.

**The full specification lives in `docs/PRD.md`. Always read it before answering questions about features, schema, prompts, or page layouts. Do not invent details that contradict the PRD.**

## Hard rules

1. **This is a web app with a real UI.** Every feature must be reachable through the browser interface described in PRD section 7. If you implement a backend route, you must also implement the page, form, button, table, or panel that calls it. No feature is "done" until a user can use it by pointing and clicking. Never say "the API is ready, you can test it with curl" — that does not count as done.

2. **One build-plan step at a time.** The build plan in PRD section 9 has 16 steps. Execute exactly one step per turn unless I explicitly say otherwise. After each step: commit, push, and stop. Wait for me to verify and say "next" before continuing. Do not chain steps. Do not skip ahead.

3. **Read before you write.** Before starting any step, re-read the relevant PRD sections. Before modifying a file, read it. Before adding a dependency, check `package.json`. Before writing a SQL migration, check existing migrations.

4. **Commit conventions.** Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`. One logical change per commit. Push after every step.

5. **Never skip the validator / typechecker / linter.** After any code change, run `pnpm typecheck` and `pnpm lint`. Fix errors before committing. If you cannot fix an error, stop and tell me — do not commit broken code.

6. **Ask before installing exotic dependencies.** The stack is locked (see below). If you think you need a package not on the approved list, stop and ask.

7. **No mocking, no fakes, no "we'll come back to this."** Every feature in the current step must be real and end-to-end working before the step is done. If something is genuinely blocked (e.g. waiting for a Stripe webhook secret), stop and tell me.

8. **Honesty over confidence.** If you are unsure whether something works, say so and test it. If a test fails, do not say "this should work" — debug it.

## The locked stack (do not deviate)

- **Framework:** Next.js 15, App Router, TypeScript (strict mode)
- **Package manager:** pnpm
- **Node version:** 20 LTS or newer
- **UI:** Tailwind CSS + shadcn/ui (install components on demand via `pnpm dlx shadcn@latest add <component>`)
- **Auth + DB:** Supabase (Postgres, Auth, Row-Level Security) using `@supabase/ssr`
- **Background jobs:** Inngest
- **Payments:** Stripe (`stripe` Node SDK + webhooks)
- **LLM:** `@anthropic-ai/sdk` — **platform key model**. A single `ANTHROPIC_API_KEY` server env var is used for all users. Users do NOT supply their own key. Usage is controlled via per-plan caps (trial: 25, solo: 200, pro: 1000 leads/month).
- **Email sending (outbound from users):** Gmail API via `googleapis`, OAuth-connected per user. Never SMTP, never a shared sender.
- **Email sending (transactional from us):** Resend (signup confirmations, password resets only)
- **Web search (research):** Tavily API
- **Web fetching (research):** Jina Reader (`https://r.jina.ai/{url}`)
- **Hosting:** Vercel
- **Error tracking:** Sentry
- **Analytics:** PostHog
- **Encryption for stored secrets:** app-level AES-256-GCM with `ENCRYPTION_KEY` env var (locked decision — see below)

## Locked decisions (resolving PRD section 12.2)

These were open questions in the PRD. They are now closed.

- **Search provider:** Tavily (not Brave). Quality matters more than cost at this stage.
- **Background jobs:** Inngest (not Trigger.dev).
- **Encryption:** App-level AES-256-GCM using a `ENCRYPTION_KEY` env var (32-byte hex). Implement helpers in `lib/crypto/`. Do not use Supabase Vault or pgsodium for the MVP — both add operational complexity.
- **Email verification:** Required before dashboard access. Reduces spam signups.
- **Project name:** Working title `OutreachForge` until told otherwise. Do not invent a different name.
- **LLM billing model:** Platform key (not BYOK). OutreachForge pays Anthropic; subscription pricing covers this cost. Users never touch an API key. Usage caps enforce cost control per plan.

## Folder structure (canonical)

Follow PRD section 5.1 exactly:

```
outreachforge/
├── app/
│   ├── (auth)/
│   ├── (marketing)/
│   ├── (dashboard)/
│   │   ├── campaigns/
│   │   ├── leads/
│   │   ├── queue/
│   │   ├── settings/
│   │   └── billing/
│   ├── api/
│   │   ├── research/
│   │   ├── draft/
│   │   ├── send-email/
│   │   ├── webhooks/
│   │   │   ├── stripe/
│   │   │   └── inngest/
│   │   └── inngest/
│   └── layout.tsx
├── components/
├── lib/
│   ├── supabase/
│   ├── anthropic/
│   ├── gmail/
│   ├── research/
│   ├── prompts/
│   ├── crypto/
│   └── utils/
├── inngest/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── public/
├── docs/
│   └── PRD.md
├── .env.example
├── CLAUDE.md
├── package.json
└── README.md
```

## UI quality bar

This is a SaaS users will pay for. The UI must look professional, not "shadcn defaults thrown on a page."

- Every page has a real layout, not just stacked components.
- Every form has loading states, disabled states during submission, success and error feedback.
- Every list view has an empty state with a clear next action.
- Every destructive action has a confirmation dialog.
- Every async operation has a spinner or skeleton.
- Dark mode works on every page (use `next-themes`).
- Mobile-responsive (read-mostly is acceptable on mobile; primary use is desktop).
- Use shadcn/ui components throughout. Do not write custom components for things shadcn provides.

## Definition of done for each build plan step

A step is **not done** until all of these are true:

1. The code compiles (`pnpm typecheck` passes).
2. The lint passes (`pnpm lint` passes).
3. The dev server runs (`pnpm dev` starts without errors).
4. **A human can open the relevant page in a browser and see/use the new functionality.** If the step adds a feature, that feature must be visible and clickable in the UI, not just present as an API route.
5. Any new database tables, columns, or RLS policies have a migration file in `supabase/migrations/`.
6. Any new environment variables are added to `.env.example` with a comment explaining what they are.
7. Changes are committed with a Conventional Commit message and pushed.
8. You have told me what to test manually and what to expect.

## Communication style

- Be direct. Skip preamble.
- When you finish a step, give me: (a) what you built, (b) what files changed, (c) what to test in the browser, (d) any decisions you made that are not in the PRD.
- If you hit ambiguity, stop and ask. Do not guess.
- If you disagree with the PRD or with my instructions, say so once, then do what I decide.

## What to do right now

If this is the start of a new session: read `docs/PRD.md` in full, then tell me which step of the build plan we are on (look at `git log` for clues), then wait for instructions. Do not start coding without an explicit "go."

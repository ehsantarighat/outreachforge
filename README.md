# OutreachForge

**Cold outbound that sounds like you wrote it yourself.**
For founders selling B2B in markets the big tools forgot.

OutreachForge is an AI-powered outbound research and drafting SaaS. It does deep research on each prospect, drafts personalized cold emails and LinkedIn messages, and tracks every send through to reply — without scraping LinkedIn or risking the user's account.

## Status

🚧 Pre-MVP. Currently being built solo with Claude Code, one PRD step at a time.

## For humans

If you are a person reading this, start here:

- **What we are building and why** → [`docs/PRD.md`](./docs/PRD.md) sections 1–4
- **The full spec** → [`docs/PRD.md`](./docs/PRD.md)
- **The build plan** → [`docs/PRD.md`](./docs/PRD.md) section 9

## For Claude Code

If you are Claude Code reading this, start here:

1. Read [`CLAUDE.md`](./CLAUDE.md) in full. It is your rulebook.
2. Read [`docs/PRD.md`](./docs/PRD.md) in full. It is the spec.
3. Check `git log` to determine which build-plan step we are on.
4. Wait for an explicit instruction before starting any step.

**Hard rules you must follow** (full list in `CLAUDE.md`):
- This is a web app with a real UI, not an API. No feature is done until a human can use it in a browser.
- Execute one build-plan step per turn. Stop and wait after each step.
- Never skip `pnpm typecheck` and `pnpm lint`.
- Commit and push after every step.
- If you are unsure, stop and ask. Do not guess.

## Tech stack

Next.js 15 (App Router, TypeScript) · Tailwind · shadcn/ui · Supabase (Postgres + Auth + RLS) · Inngest · Stripe · Anthropic SDK (BYOK) · Gmail API · Tavily · Jina Reader · Vercel · Resend · Sentry · PostHog

## Local development

```bash
pnpm install
cp .env.example .env.local
# Fill in env vars — see .env.example for the list
pnpm dev
```

You will need accounts and API keys for: Supabase, Stripe (test mode), Google Cloud (Gmail OAuth), Anthropic, Tavily, Inngest, Resend, Sentry, PostHog. See `docs/PRD.md` Step 0 for the full prerequisites checklist.

## License

Proprietary. All rights reserved.

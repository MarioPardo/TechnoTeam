# TechnoTeam

Coordinate your festival crew. Plan your schedule together, in real time.

## Stack

- **Next.js 16** (App Router) — framework
- **Supabase** — Postgres database + real-time subscriptions
- **Tailwind CSS v4 + shadcn/ui** — styling and components
- **Vercel** — deployment

## Getting Started

### 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Enable real-time for the `plans` table (Table Editor → Replication)
4. Copy your project URL and anon key from Project Settings → API

### 2. Local development

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and MANAGE_PASSWORD

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add the two environment variables in the Vercel dashboard
4. Deploy — no extra config needed

See `docs/deployment.md` for full details.

## Docs

- `docs/architecture.md` — stack, data model, routes, identity model
- `docs/features.md` — feature checklist (done / in progress / planned)
- `docs/deployment.md` — Supabase + Vercel setup guide
- `planning/decisions.md` — key design decisions and rationale
- `planning/backlog.md` — future ideas

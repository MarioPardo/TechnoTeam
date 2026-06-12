# TechnoTeam

**Plan your festival with your crew — in real time.**

[**techno-team.vercel.app**](https://techno-team.vercel.app)

Going to a multi-stage festival is chaotic. Everyone wants to catch different sets, people get separated, and coordinating who's going where is a mess of texts and screenshots. TechnoTeam fixes that.

Create or join a crew, browse the full lineup grid, and tap the sets you want to see. Your picks show up live on your crewmates' screens — colored dots on each performance card — so everyone knows at a glance where the group is splitting up or converging. No account needed: just share a 6-character code and you're in.

**What you can do:**

- Browse any festival's lineup across all stages in a side-by-side grid
- Create a crew and invite friends via a shareable code
- Tap performances to mark your picks — they sync live for your whole crew
- See colored avatars on each card showing which crewmates are going
- Export your personal schedule as an image
- Use it as a guest (no sign-up) with picks saved locally for a year

---

## Stack

- **Next.js 16** (App Router)
- **Supabase** — Postgres + real-time subscriptions
- **Tailwind CSS v4 + shadcn/ui**
- **Vercel** — deployment

## Repo structure

```
app/          Next.js routes and pages
components/   Shared UI components
lib/          Utilities and Supabase client
supabase/     Database schema
docs/         Architecture, features, and deployment guides
planning/     Design decisions and backlog
```

See the `docs/` folder for full documentation.

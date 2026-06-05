# Architecture

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database + Realtime | Supabase (Postgres + subscriptions) |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |

## Data Model

```
events
  id            uuid PK
  name          text
  date_start    date
  date_end      date
  location      text
  description   text
  created_at    timestamptz

stages
  id            uuid PK
  event_id      uuid FK → events.id
  name          text
  order_index   int

performances
  id            uuid PK
  stage_id      uuid FK → stages.id
  artist        text
  start_time    timestamptz
  end_time      timestamptz
  description   text

groups
  id            uuid PK
  event_id      uuid FK → events.id
  name          text
  code          text UNIQUE  (6-char alphanumeric)
  created_at    timestamptz

members
  id            uuid PK
  group_id      uuid FK → groups.id
  name          text
  session_token uuid UNIQUE  (generated client-side, stored in localStorage)
  created_at    timestamptz

plans
  id            uuid PK
  member_id     uuid FK → members.id
  performance_id uuid FK → performances.id
  created_at    timestamptz
  UNIQUE (member_id, performance_id)
```

## Routes

```
/                     Landing page: tagline + all available events
/your-events          Client-rendered: groups the user has joined (via localStorage)
/join                 Enter a crew code to navigate to a group; accepts ?code= for invite links
/crew-search          Placeholder for future group discovery
/events/new           Create event form
/events/[id]          Event hub: view lineup + create/join group
/events/[id]/manage   Lineup editor (stages + performances)
/groups/[code]        Group planning view (real-time grid)
```

## Real-time

Supabase subscription on the `plans` table, filtered by `group_id` via a join.  
When any member toggles a plan, all clients in the same group receive the update within ~1s.

## Identity

No accounts. Members join with a name. A `session_token` (UUID) is generated on join, stored in `localStorage` under `festival-session-token`, and used to identify the member across page loads.

When a member successfully joins any group, the group's 6-char code is appended to `festival-my-groups` (a JSON array in `localStorage`). The Your Events page reads this array to show the user's crews without requiring a login.

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
  timezone      text        (IANA tz, e.g. "Europe/Berlin"; auto-detected from location; editable post-creation)
  description   text
  image_url     text        (public URL from Supabase Storage event-images bucket)
  image_url_dark text       (optional dark-mode variant, set via manage page)
  links         jsonb       (array of {label, url}; set via manage page)
  password_hash text        (SHA-256 of the edit password; null = no restriction)
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
  start_time    timestamptz  (stored as UTC; UI inputs are in local festival time and converted via lib/tz.ts)
  end_time      timestamptz  (same)
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

## Sun Times

Sunrise/sunset markers are fetched server-side at page render via `lib/sun-times.ts`:

1. **Geocoding** — the event's `location` field (first part before any comma) is resolved to lat/lng via `https://geocoding-api.open-meteo.com/v1/search`. The API also returns the IANA timezone for the location, which is logged and can help diagnose timezone mismatches.
2. **Forecast** — lat/lng + date range are sent to `https://api.open-meteo.com/v1/forecast` with `timezone=UTC`. This returns sunrise/sunset as UTC ISO strings (unambiguous).
3. **Storage** — each day's sunrise and sunset are converted to **UTC epoch minutes** (`ms / 60000`) and keyed by local date string (`dateKey` in the event's timezone). This is the same coordinate space as performance `start_time` / `end_time` after `toMinutes()`.
4. **Rendering** — `LineupGrid` computes pixel offsets as `(sunriseMinutes − minTime) × PX_PER_MIN`, identical to how performance cards are positioned. The grid's time labels are already in local festival time, so the markers land at the correct visual position automatically.

Both responses are `force-cache`d, so they are only fetched once per build/revalidation.

**Timezone correctness is critical.** If `event.timezone` is wrong (e.g. `UTC` for a European festival), the grid time labels will show UTC times and all markers will appear shifted by the UTC offset. Set the correct timezone via the manage page location picker before adding performances.

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

No accounts. Two levels of identity:

**Group member** — joins with a name. A `session_token` (UUID) is generated on join, stored in `localStorage` under `festival-session-token`, and used to identify the member across page loads. When a member joins any group, the group's 6-char code is appended to the `festival-crews` cookie so it appears in Your Events.

**Guest (no group)** — can browse any event lineup and mark performances without joining a group. Two cookies persist their state client-side for 1 year:

| Cookie | Content | Set by |
|---|---|---|
| `guest-id` | Random alphanumeric ID generated on first visit | `lib/guest-picks.ts` |
| `event-picks-{eventId}` | Comma-separated performance UUIDs the guest picked | `lib/guest-picks.ts` |

Guest picks are purely client-side — they are never written to the database. The `EventView` component converts the cookie values into in-memory `Plan` objects and passes them to `LineupGrid`, where the existing toggle and "My Schedule" logic handles them identically to real group plans.

## Sidebar Layout

Both `EventView` and `GroupPlanningView` use the same collapsible sidebar pattern:

- A `sidebarOpen` boolean (default `true`) controls visibility.
- On mount, a `resize` listener checks `window.innerWidth < 768` and collapses the sidebar on mobile.
- **Mobile:** sidebar is `position: fixed`, translates off-screen when closed, overlays content with a backdrop when open.
- **Desktop:** sidebar is in the flex row; collapsing animates `width` to 0 via `transition-[width]`. Drag-to-resize is only active when the sidebar is open on desktop.
- A `PanelLeftOpen`/`PanelLeftClose` toggle button sits at the top-left of the main content area on both views.

## Access Control

Two layers of password protection, both stored as httpOnly cookies (7-day expiry):

| Layer | Env / DB field | Cookie | Controls |
|---|---|---|---|
| Site-wide admin | `MANAGE_PASSWORD` env var | `manage_auth` | Manage pages for all events, "Add New Event" button |
| Per-event edit | `events.password_hash` (SHA-256) | `event_auth_{id}` | Manage page for that specific event |

The site-wide admin password always bypasses per-event passwords. Attendees (group members) are never asked for either password — they only see event and group pages.

## Storage

Supabase Storage bucket `event-images` (public) holds event logos uploaded at creation time. The public URL is stored in `events.image_url`.

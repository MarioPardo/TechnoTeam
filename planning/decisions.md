# Design Decisions

## No authentication for attendees
**Decision:** Group members identify via a name + localStorage session token. No login required to attend.  
**Why:** Festival planning is casual and social. Requiring accounts adds friction. Data is not sensitive.

## Password-gated admin and event editing
**Decision:** A single `MANAGE_PASSWORD` env var controls site-wide admin access (create events, edit any event). Events can additionally have their own edit password stored as a SHA-256 hash in the database. The master password always bypasses event passwords.  
**Why:** The app is deployed publicly but event management should be restricted to organisers. A simple shared password avoids account overhead while still preventing accidental edits. Per-event passwords let multiple organisers each protect their own event independently.

## Timezone auto-detection via open-meteo geocoding
**Decision:** The location field (on both the new event form and the manage page editor) uses the open-meteo geocoding API (`geocoding-api.open-meteo.com`) for autocomplete. Selecting a suggestion auto-fills the timezone field with the exact IANA timezone returned by the API. The timezone dropdown remains editable for manual override.  
**Why:** The open-meteo API returns the precise IANA timezone directly (e.g. `Europe/Berlin`), removing the need for the country-code → timezone lookup table we previously used with Nominatim. It's the same API already used for sun times, so no additional dependency is introduced. The manage page editor also exposes location + timezone editing so events created with a wrong timezone (e.g. the default `UTC`) can be corrected after the fact.

## Performance times are stored as UTC, entered as local festival time
**Decision:** `datetime-local` inputs in the "Add set" and "Edit set" forms accept times in the festival's local timezone. The server action (`createPerformance` / `updatePerformance`) converts them to UTC before writing to the database using `lib/tz.ts:localInputToUTC`. The JSON import path (`importLineupJSON`) uses the same conversion. All reads convert back to local time for display using the event's `timezone` field.  
**Why:** `datetime-local` inputs have no timezone awareness — they return a naive `YYYY-MM-DDTHH:MM` string. Storing that directly as a `timestamptz` would have Postgres interpret it as UTC, causing times to appear shifted by the UTC offset on the grid. The conversion must happen at write time; relying on display-side adjustment alone would cause bugs whenever the event timezone changes.

## Sunrise/sunset overlay using UTC epoch as shared coordinate space
**Decision:** Sun times are fetched from open-meteo with `timezone=UTC` so they arrive as unambiguous UTC strings. They are stored as UTC epoch minutes (`ms / 60000`) — the same unit produced by `new Date(isoString).getTime() / 60000` for performance times. Pixel offsets for both performances and sun markers are computed as `(epochMinutes − minTime) × PX_PER_MIN`.  
**Why:** Using a single UTC epoch coordinate space means the sunrise/sunset markers and performance cards are always in the same reference frame regardless of DST or timezone offset. Converting to local time only happens at the label-rendering layer (`toLocaleTimeString` with the event timezone), never in the positioning math.

## Groups scoped per event
**Decision:** A group is created inside one event and can only plan for that event.  
**Why:** Simpler data model. Most festival crews attend one festival at a time per planning session.

## Supabase for real-time
**Decision:** Use Supabase Postgres + built-in real-time subscriptions instead of a separate WebSocket service.  
**Why:** Single service for DB + real-time, generous free tier, works naturally with Next.js server actions.

## CSS Grid for lineup layout
**Decision:** Implement the lineup grid using CSS Grid with `grid-template-rows` based on time slots.  
**Why:** Performances can span variable time ranges. CSS Grid lets cards span the correct number of rows naturally without absolute positioning math.

## shadcn/ui for components
**Decision:** Use shadcn/ui (Radix + Tailwind) rather than a full component library.  
**Why:** Gives us unstyled, accessible primitives we own — easy to customize for the festival aesthetic without fighting a framework's opinions.

## Guest picks stored in cookies, not the database
**Decision:** When a non-signed-in user marks a performance, the pick is saved to a client-set cookie (`event-picks-{eventId}`) rather than written to the `plans` table.  
**Why:** Guests have no group membership and no `member_id`, so storing in the DB would require schema changes (nullable foreign key or a separate table). Cookies are sufficient for a personal schedule that doesn't need to sync across devices. The `EventView` component converts cookie values into in-memory plan objects at render time — `LineupGrid` receives them identically to real plans, so no separate code path is needed in the grid.

## Collapsible sidebar instead of always-visible panel
**Decision:** The crew/event sidebar in `EventView` and `GroupPlanningView` is collapsible (toggle button) rather than permanently visible.  
**Why:** On mobile screens the fixed-width sidebar consumed most of the viewport, leaving the lineup grid unusable. On mobile the sidebar becomes a slide-in overlay; on desktop it collapses in the flow with an animated width transition. This preserves the desktop drag-to-resize UX while fixing the mobile experience without a separate mobile layout.

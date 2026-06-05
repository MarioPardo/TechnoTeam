# Design Decisions

## No authentication for attendees
**Decision:** Group members identify via a name + localStorage session token. No login required to attend.  
**Why:** Festival planning is casual and social. Requiring accounts adds friction. Data is not sensitive.

## Password-gated admin and event editing
**Decision:** A single `MANAGE_PASSWORD` env var controls site-wide admin access (create events, edit any event). Events can additionally have their own edit password stored as a SHA-256 hash in the database. The master password always bypasses event passwords.  
**Why:** The app is deployed publicly but event management should be restricted to organisers. A simple shared password avoids account overhead while still preventing accidental edits. Per-event passwords let multiple organisers each protect their own event independently.

## Timezone auto-detection via Nominatim
**Decision:** On blur of the location field, call the Nominatim (OpenStreetMap) geocoding API to get the country code (and state for multi-timezone countries), then map to the closest IANA timezone from our supported list. The select stays editable and the user can override.  
**Why:** Reduces a friction point — most organisers won't know the IANA tz name for their festival site. Nominatim is free and requires no API key. The detection is best-effort; the full dropdown remains as a fallback.

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

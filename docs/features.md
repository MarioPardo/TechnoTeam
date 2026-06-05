# Features

## Status Key
- [ ] Planned
- [~] In progress
- [x] Done

## Core Features

### Event Management
- [x] Create an event (name, dates, location, timezone, description)
- [x] List all events on home page
- [x] "Add New Event" button on home page — visible only to admins (manage password unlocked)
- [x] Logo upload (PNG/JPG/SVG/WebP) stored in Supabase Storage (`event-images` bucket)
- [x] Timezone auto-detected from location via Nominatim geocoding; user can override
- [x] Optional edit password per event — required to open the manage/edit page for that event (does not affect attendee access)
- [x] Add stages to an event
- [x] Add performances to a stage (artist, start time, end time)
- [x] Delete stages and performances

### Group Coordination
- [x] Create a group within an event → get shareable 6-char code
- [x] Join a group via code → enter name → session stored in localStorage
- [x] View group member list in sidebar

### Lineup Grid
- [x] Display stages as side-by-side columns
- [x] Display time as rows (top = earliest)
- [x] Performances rendered as cards spanning their time slot
- [x] Click performance to toggle "want to attend"
- [x] Show group members' picks as colored avatar dots on each card

### Real-time
- [x] Picks update live for all members in same group (no refresh needed)
- [x] New members appear live in sidebar

### Navigation & Pages
- [x] Top nav with Home / Your Events / Crew Search tabs (active tab highlighted)
- [x] Home page — landing with tagline + Available Events (all events)
- [x] Your Events page — shows groups the user has joined, sourced from `festival-my-groups` localStorage key
- [x] Join page (`/join`) — enter a crew code; accepts `?code=` query param for invite links
- [x] Crew Search page — placeholder with upcoming search-by-festival/crew-name feature
- [x] Group codes saved to localStorage on join so they appear in Your Events

### Admin / Access Control
- [x] `MANAGE_PASSWORD` env var — master password for the entire site; unlocks manage pages and the "Add New Event" button
- [x] Per-event edit password — stored as SHA-256 hash in the database; master password always bypasses it
- [x] Password state stored in httpOnly cookies (7-day expiry)

### Deployment
- [x] Vercel deployment ready (builds cleanly)
- [x] Environment variables documented in docs/deployment.md and .env.local.example

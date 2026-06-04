# Design Decisions

## No authentication
**Decision:** Anyone can create/edit events. Group members identify via a name + localStorage session token.  
**Why:** Festival planning is casual and social. Requiring accounts adds friction. Data is not sensitive.

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

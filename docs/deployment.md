# Deployment

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Run this migration to add the event edit password and any missing columns:
   ```sql
   ALTER TABLE events ADD COLUMN IF NOT EXISTS timezone      text NOT NULL DEFAULT 'UTC';
   ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url     text;
   ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url_dark text;
   ALTER TABLE events ADD COLUMN IF NOT EXISTS links         jsonb;
   ALTER TABLE events ADD COLUMN IF NOT EXISTS password_hash text;
   ```
4. Go to **Table Editor → plans** → **Replication** tab → enable real-time for the `plans` table
5. Go to **Storage** → **New bucket** → name it `event-images` → enable **Public bucket** → Create
6. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Local Development

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
MANAGE_PASSWORD=your-admin-password
```

`MANAGE_PASSWORD` is the master password for the site. It gates the "Add New Event" button, all event manage pages, and bypasses any per-event edit passwords.

Then run:

```bash
npm run dev
```

## Vercel Deployment

1. Push the repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `MANAGE_PASSWORD`
4. Deploy — Vercel auto-detects Next.js, no extra config needed

## Supabase RLS (Row Level Security)

For this v1, RLS is disabled — the app uses open access with the anon key.  
All data is public (appropriate for a festival planning tool with no private data).  
Enable RLS + policies in a future version if you need to restrict access.

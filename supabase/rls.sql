-- Row Level Security migration
-- Run this once in the Supabase SQL Editor (Project > SQL Editor).
--
-- If you get "relation does not exist" errors, your database is missing
-- some tables added after the initial setup. Run schema.sql first to
-- create any missing tables, then re-run this file.
--
-- Strategy: enable RLS on all tables, allow public SELECT via the anon key
-- (needed for client-side real-time subscriptions), and block all writes
-- from the anon key. All mutations go through server actions that use the
-- service_role key, which bypasses RLS automatically.

alter table events       enable row level security;
alter table stages       enable row level security;
alter table performances enable row level security;
alter table groups       enable row level security;
alter table members      enable row level security;
alter table plans        enable row level security;
alter table messages     enable row level security;

-- Public read access (anon key may SELECT, needed for real-time subscriptions).
-- Use IF NOT EXISTS so this is safe to re-run.
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'events'       and policyname = 'events_select')       then create policy "events_select"       on events       for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename = 'stages'       and policyname = 'stages_select')       then create policy "stages_select"       on stages       for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename = 'performances' and policyname = 'performances_select') then create policy "performances_select" on performances for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename = 'groups'       and policyname = 'groups_select')       then create policy "groups_select"       on groups       for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename = 'members'      and policyname = 'members_select')      then create policy "members_select"      on members      for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename = 'plans'        and policyname = 'plans_select')        then create policy "plans_select"        on plans        for select using (true); end if;
  if not exists (select 1 from pg_policies where tablename = 'messages'     and policyname = 'messages_select')     then create policy "messages_select"     on messages     for select using (true); end if;
end $$;

-- No INSERT / UPDATE / DELETE policies for the anon role.
-- The service_role key (used by server actions) bypasses RLS entirely,
-- so all writes from the app continue to work without extra policies.
-- Direct REST API calls using the anon key are now blocked for all mutations.

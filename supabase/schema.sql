-- Festival Planner Schema
-- Run this in the Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Events
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  date_start  date not null,
  date_end    date not null,
  location    text not null,
  timezone    text not null default 'UTC',
  description     text,
  image_url       text,
  image_url_dark  text,
  links           jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- Migration for existing databases:
-- alter table events add column if not exists timezone text not null default 'UTC';
-- alter table events add column if not exists image_url text;
-- alter table events add column if not exists image_url_dark text;
-- alter table events add column if not exists links jsonb not null default '[]';

-- Stages
create table if not exists stages (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,
  order_index int  not null default 0,
  color       text,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- Migration for existing databases:
-- alter table stages add column if not exists color text;

-- Performances
create table if not exists performances (
  id          uuid primary key default gen_random_uuid(),
  stage_id    uuid not null references stages(id) on delete cascade,
  artist      text not null,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  description text,
  created_at  timestamptz not null default now()
);

-- Groups
create table if not exists groups (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  name       text not null,
  code       text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists groups_code_idx on groups(code);

-- Members
create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references groups(id) on delete cascade,
  name          text not null,
  password_hash text,
  session_token uuid not null unique,
  created_at    timestamptz not null default now(),
  -- Names are unique per group (case-insensitive)
  constraint members_group_name_unique unique (group_id, name)
);

-- Migration for existing databases:
-- alter table members add column if not exists password_hash text;
-- alter table members add constraint members_group_name_unique unique (group_id, name);

-- Plans (which performances each member wants to attend)
create table if not exists plans (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references members(id) on delete cascade,
  performance_id uuid not null references performances(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (member_id, performance_id)
);

-- Enable real-time for plans table
-- After running this SQL, also enable real-time in the Supabase dashboard:
-- Table Editor → plans → Replication tab → toggle on
alter publication supabase_realtime add table plans;

-- Crew chat messages
create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_group_id_created_at_idx on messages(group_id, created_at);

alter publication supabase_realtime add table messages;

-- Migration for existing databases:
-- create table if not exists messages (...) [run the above]

-- Storage bucket for festival logos
-- Run this block in the Supabase SQL Editor:
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Allow anonymous reads (bucket is public, but policy is still required)
create policy "Public logo read"
  on storage.objects for select
  using (bucket_id = 'logos');

-- Allow anonymous uploads (app has no auth)
create policy "Public logo upload"
  on storage.objects for insert
  with check (bucket_id = 'logos');

-- Allow anonymous replacements
create policy "Public logo update"
  on storage.objects for update
  using (bucket_id = 'logos');

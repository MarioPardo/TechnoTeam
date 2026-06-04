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
  description text,
  created_at  timestamptz not null default now()
);

-- Stages
create table if not exists stages (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,
  order_index int  not null default 0,
  created_at  timestamptz not null default now()
);

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
  session_token uuid not null unique,
  created_at    timestamptz not null default now()
);

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

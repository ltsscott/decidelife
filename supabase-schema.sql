-- DecideLife Supabase schema
-- Paste this entire file into Supabase SQL Editor and run it once.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'DecideLife User',
  email text,
  current_level integer not null default 1,
  total_xp integer not null default 0 check (total_xp >= 0),
  highest_level_reached integer not null default 1,
  current_title text not null default 'Initiate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  current_level integer not null default 1,
  highest_level_reached integer not null default 1,
  current_title text not null default 'Initiate',
  last_habit_review_date date not null default current_date,
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  order_position integer not null default 1,
  unlocked boolean not null default false,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  category text not null default 'personal',
  base_xp integer not null default 100,
  prerequisite_habit_id text,
  streak_multiplier_enabled boolean not null default true,
  archived boolean not null default false,
  testing_streak_override integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.habit_logs (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null,
  date date not null,
  status text not null check (status in ('pending', 'completed', 'missed', 'protected')),
  xp_delta integer not null default 0,
  used_protector boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, habit_id, date)
);

create table if not exists public.missions (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null check (category in ('career', 'fitness', 'nutrition', 'finance', 'trading', 'personal')),
  xp_reward integer not null default 250,
  type text not null check (type in ('side', 'major')),
  locked boolean not null default false,
  completed boolean not null default false,
  prerequisites text[] not null default '{}',
  unlocks_mission_ids text[] not null default '{}',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.journal_entries (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  title text not null,
  mood text not null check (mood in ('focused', 'steady', 'tired', 'stressed', 'proud', 'resetting')),
  tags text[] not null default '{}',
  body text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.streak_protectors (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  total_available integer not null default 2,
  used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, month)
);

create index if not exists habits_user_order_idx on public.habits(user_id, order_position);
create index if not exists habit_logs_user_date_idx on public.habit_logs(user_id, date);
create index if not exists missions_user_status_idx on public.missions(user_id, locked, completed, archived);
create index if not exists journal_entries_user_date_idx on public.journal_entries(user_id, date desc);
create index if not exists streak_protectors_user_month_idx on public.streak_protectors(user_id, month);

alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.missions enable row level security;
alter table public.journal_entries enable row level security;
alter table public.streak_protectors enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

drop policy if exists "user_progress_select_own" on public.user_progress;
drop policy if exists "user_progress_insert_own" on public.user_progress;
drop policy if exists "user_progress_update_own" on public.user_progress;
drop policy if exists "user_progress_delete_own" on public.user_progress;

create policy "user_progress_select_own" on public.user_progress for select using (auth.uid() = user_id);
create policy "user_progress_insert_own" on public.user_progress for insert with check (auth.uid() = user_id);
create policy "user_progress_update_own" on public.user_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_progress_delete_own" on public.user_progress for delete using (auth.uid() = user_id);

drop policy if exists "habits_select_own" on public.habits;
drop policy if exists "habits_insert_own" on public.habits;
drop policy if exists "habits_update_own" on public.habits;
drop policy if exists "habits_delete_own" on public.habits;

create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

drop policy if exists "habit_logs_select_own" on public.habit_logs;
drop policy if exists "habit_logs_insert_own" on public.habit_logs;
drop policy if exists "habit_logs_update_own" on public.habit_logs;
drop policy if exists "habit_logs_delete_own" on public.habit_logs;

create policy "habit_logs_select_own" on public.habit_logs for select using (auth.uid() = user_id);
create policy "habit_logs_insert_own" on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "habit_logs_update_own" on public.habit_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_logs_delete_own" on public.habit_logs for delete using (auth.uid() = user_id);

drop policy if exists "missions_select_own" on public.missions;
drop policy if exists "missions_insert_own" on public.missions;
drop policy if exists "missions_update_own" on public.missions;
drop policy if exists "missions_delete_own" on public.missions;

create policy "missions_select_own" on public.missions for select using (auth.uid() = user_id);
create policy "missions_insert_own" on public.missions for insert with check (auth.uid() = user_id);
create policy "missions_update_own" on public.missions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "missions_delete_own" on public.missions for delete using (auth.uid() = user_id);

drop policy if exists "journal_entries_select_own" on public.journal_entries;
drop policy if exists "journal_entries_insert_own" on public.journal_entries;
drop policy if exists "journal_entries_update_own" on public.journal_entries;
drop policy if exists "journal_entries_delete_own" on public.journal_entries;

create policy "journal_entries_select_own" on public.journal_entries for select using (auth.uid() = user_id);
create policy "journal_entries_insert_own" on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "journal_entries_update_own" on public.journal_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journal_entries_delete_own" on public.journal_entries for delete using (auth.uid() = user_id);

drop policy if exists "streak_protectors_select_own" on public.streak_protectors;
drop policy if exists "streak_protectors_insert_own" on public.streak_protectors;
drop policy if exists "streak_protectors_update_own" on public.streak_protectors;
drop policy if exists "streak_protectors_delete_own" on public.streak_protectors;

create policy "streak_protectors_select_own" on public.streak_protectors for select using (auth.uid() = user_id);
create policy "streak_protectors_insert_own" on public.streak_protectors for insert with check (auth.uid() = user_id);
create policy "streak_protectors_update_own" on public.streak_protectors for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "streak_protectors_delete_own" on public.streak_protectors for delete using (auth.uid() = user_id);

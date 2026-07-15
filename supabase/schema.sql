-- Bi The Way — database schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query)

-- 1. Profiles ---------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  age int check (age >= 18),
  bio text default '',
  photo_url text,
  tags text[] default '{}',
  points int not null default 0,
  streak_days int not null default 0,
  last_swipe_date date,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles are viewable by any signed-in user"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- 2. Swipes ------------------------------------------------------------
create table if not exists swipes (
  id bigint generated always as identity primary key,
  swiper_id uuid references profiles(id) on delete cascade not null,
  target_id uuid references profiles(id) on delete cascade not null,
  direction text check (direction in ('like', 'pass', 'super')) not null,
  created_at timestamptz default now(),
  unique (swiper_id, target_id)
);

alter table swipes enable row level security;

create policy "users can see their own swipes"
  on swipes for select
  using (auth.uid() = swiper_id);

create policy "users can insert their own swipes"
  on swipes for insert
  with check (auth.uid() = swiper_id);

-- 3. Matches -------------------------------------------------------------
create table if not exists matches (
  id bigint generated always as identity primary key,
  user_a uuid references profiles(id) on delete cascade not null,
  user_b uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

alter table matches enable row level security;

create policy "users can see matches they're part of"
  on matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- 4. Points ledger (auditable log of every point award) -----------------
create table if not exists points_ledger (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount int not null,
  reason text not null, -- 'swipe_right' | 'match' | 'date_logged' | 'streak_bonus'
  created_at timestamptz default now()
);

alter table points_ledger enable row level security;

create policy "users can see their own ledger"
  on points_ledger for select
  using (auth.uid() = user_id);

-- 5. Dates logged (for "date_logged" points + stats) ---------------------
create table if not exists dates_logged (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  match_id bigint references matches(id) on delete cascade not null,
  logged_at timestamptz default now(),
  note text default ''
);

alter table dates_logged enable row level security;

create policy "users can see and log their own dates"
  on dates_logged for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Points helper function ----------------------------------------------
create or replace function award_points(p_user_id uuid, p_amount int, p_reason text)
returns void as $$
begin
  insert into points_ledger (user_id, amount, reason) values (p_user_id, p_amount, p_reason);
  update profiles set points = points + p_amount where id = p_user_id;
end;
$$ language plpgsql security definer;

-- 8. Messages ---------------------------------------------------------
create table if not exists messages (
  id bigint generated always as identity primary key,
  match_id bigint references matches(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  body text not null check (char_length(body) > 0 and char_length(body) <= 2000),
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "participants can read messages in their match"
  on messages for select
  using (
    match_id in (
      select id from matches where user_a = auth.uid() or user_b = auth.uid()
    )
  );

create policy "participants can send messages in their match"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and match_id in (
      select id from matches where user_a = auth.uid() or user_b = auth.uid()
    )
  );

-- Enable realtime so new messages push to subscribed clients instantly
alter publication supabase_realtime add table messages;

-- Call after inserting a 'like'/'super' swipe. Returns true if a mutual match was created.
create or replace function try_create_match(p_swiper uuid, p_target uuid)
returns boolean as $$
declare
  reciprocal_exists boolean;
  a uuid;
  b uuid;
begin
  select exists(
    select 1 from swipes
    where swiper_id = p_target and target_id = p_swiper and direction in ('like', 'super')
  ) into reciprocal_exists;

  if reciprocal_exists then
    -- store match with lower uuid first so the unique constraint dedupes consistently
    if p_swiper < p_target then a := p_swiper; b := p_target;
    else a := p_target; b := p_swiper;
    end if;

    insert into matches (user_a, user_b) values (a, b)
      on conflict (user_a, user_b) do nothing;

    perform award_points(p_swiper, 50, 'match');
    perform award_points(p_target, 50, 'match');
    return true;
  end if;

  return false;
end;
$$ language plpgsql security definer;

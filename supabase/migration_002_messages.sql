-- Bi The Way — migration: add chat
-- Run this if you already ran schema.sql before this feature existed.
-- (If you're setting the project up fresh, schema.sql already includes this —
-- no need to run this file separately.)

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

alter publication supabase_realtime add table messages;

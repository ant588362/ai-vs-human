-- Run this in your Supabase project: SQL Editor → New Query → paste → Run
-- Takes ~5 seconds.

create table if not exists public.game_results (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        text not null,                 -- "2026-05-19"
  puzzle_number int not null,
  score       int not null,
  total       int not null default 5,
  guesses     text not null,                 -- JSON array string
  correct_answers text not null,             -- JSON array string
  created_at  timestamptz default now(),
  unique (user_id, date)                     -- one result per user per day
);

-- Users can only read/write their own rows
alter table public.game_results enable row level security;

create policy "Users manage own results"
  on public.game_results
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

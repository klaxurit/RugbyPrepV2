create table public.athletic_tests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date_iso text not null,            -- YYYY-MM-DD
  type text not null,                -- cmj | sprint_10m | yyir1 | one_rm_squat | one_rm_bench | one_rm_deadlift | hooper
  value numeric not null,            -- cm | s | m | kg | score
  estimated_from jsonb default null, -- {loadKg, reps, formula} pour 1RM indirect
  notes text,
  created_at timestamptz default now()
);
alter table public.athletic_tests enable row level security;
create policy "Users see own tests"
  on public.athletic_tests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create index athletic_tests_user_date
  on public.athletic_tests(user_id, date_iso desc);

-- ─── match_calendar ───────────────────────────────────────────
-- Calendrier des matchs et événements (useCalendar)

create table if not exists public.match_calendar (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  date         date not null,
  type         text check (type in ('match', 'rest', 'unavailable')) not null,
  kickoff_time time,
  opponent     text,
  opponent_code text,
  is_home      boolean,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table public.match_calendar enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'match_calendar'
      and policyname = 'Users manage own calendar'
  ) then
    create policy "Users manage own calendar"
      on public.match_calendar for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists match_calendar_user_date
  on public.match_calendar(user_id, date);

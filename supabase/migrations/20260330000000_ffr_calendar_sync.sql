-- FFR Calendar Sync: cache centralisée + enrichissement match_calendar + profil compétition

-- 1. Table cache centralisée des calendriers FFR (par compétition)
create table if not exists public.ffr_competition_calendars (
  id              uuid primary key default gen_random_uuid(),
  competition_id  text not null,
  competition_name text not null,
  season          text not null,
  match_day       integer,
  match_date      date not null,
  kickoff_time    time,
  home_club_code  text,
  home_club_name  text,
  away_club_code  text,
  away_club_name  text,
  venue           text,
  external_id     text unique,
  raw_data        jsonb default '{}'::jsonb,
  fetched_at      timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_ffr_cal_competition
  on public.ffr_competition_calendars(competition_id, match_date);
create index if not exists idx_ffr_cal_club_home
  on public.ffr_competition_calendars(home_club_code, match_date);
create index if not exists idx_ffr_cal_club_away
  on public.ffr_competition_calendars(away_club_code, match_date);

alter table public.ffr_competition_calendars enable row level security;

create policy "Authenticated users can read FFR calendars"
  on public.ffr_competition_calendars for select
  using (auth.role() = 'authenticated');

-- 2. Enrichir match_calendar avec source/external_id/metadata FFR
alter table public.match_calendar
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'ffr_import')),
  add column if not exists external_id text,
  add column if not exists competition_id text,
  add column if not exists competition_name text,
  add column if not exists match_day integer,
  add column if not exists venue text,
  add column if not exists user_hidden boolean not null default false,
  add column if not exists user_override jsonb default null,
  add column if not exists synced_at timestamptz;

create unique index if not exists idx_match_calendar_external
  on public.match_calendar(user_id, external_id)
  where external_id is not null;

create index if not exists idx_match_calendar_source
  on public.match_calendar(user_id, source);

-- 3. Profil : compétition FFR sélectionnée
alter table public.profiles
  add column if not exists ffr_competition_id text,
  add column if not exists ffr_competition_name text,
  add column if not exists ffr_last_sync_at timestamptz;

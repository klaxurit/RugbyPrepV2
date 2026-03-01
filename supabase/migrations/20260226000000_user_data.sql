-- ─── profiles ────────────────────────────────────────────────
-- Profil utilisateur (1 ligne par user)

create table public.profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  level            text check (level in ('beginner', 'intermediate')) not null default 'intermediate',
  weekly_sessions  integer check (weekly_sessions in (2, 3)) not null default 2,
  equipment        text[] not null default '{}',
  injuries         text[] not null default '{}',
  position         text,
  rugby_position   text,
  league_level     text,
  club_code        text,
  club_name        text,
  club_ligue       text,
  club_department_code text,
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── session_logs ─────────────────────────────────────────────
-- Historique des séances (useHistory)

create table public.session_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  date_iso     text not null,  -- YYYY-MM-DD
  week         text not null,  -- CycleWeek : W1-W8, H1-H4, DELOAD
  session_type text check (session_type in ('UPPER', 'LOWER', 'FULL')) not null,
  fatigue      text check (fatigue in ('OK', 'FATIGUE')) not null,
  notes        text,
  rpe          integer check (rpe >= 1 and rpe <= 10),
  duration_min integer,
  created_at   timestamptz not null default now()
);

alter table public.session_logs enable row level security;

create policy "Users manage own session logs"
  on public.session_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index session_logs_user_date
  on public.session_logs(user_id, date_iso desc);

-- ─── block_logs ───────────────────────────────────────────────
-- Logs détaillés par bloc (useBlockLogs)

create table public.block_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  date_iso     text not null,
  week         text not null,
  session_type text check (session_type in ('UPPER', 'LOWER', 'FULL')) not null,
  block_id     text not null,
  block_name   text not null,
  entries      jsonb not null default '[]',
  created_at   timestamptz not null default now()
);

alter table public.block_logs enable row level security;

create policy "Users manage own block logs"
  on public.block_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index block_logs_user_date
  on public.block_logs(user_id, date_iso desc);

create index block_logs_user_block
  on public.block_logs(user_id, block_id);

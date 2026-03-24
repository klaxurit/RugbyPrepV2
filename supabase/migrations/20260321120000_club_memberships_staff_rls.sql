-- Club / staff memberships (V2) — additive schema + RLS read paths for authenticated staff.
-- No broad anon access; staff visibility is mediated by membership tables (not profiles.club_code alone).

-- ─── club_staff_memberships ───────────────────────────────────

create table if not exists public.club_staff_memberships (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references auth.users (id) on delete cascade,
  club_id text not null,
  squad_id text null,
  role text not null
    check (role in (
      'head_coach',
      'assistant_coach',
      'strength_coach',
      'physio',
      'analyst',
      'admin'
    )),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_staff_memberships_staff_club_squad_idx
  on public.club_staff_memberships (staff_user_id, club_id, squad_id);

create unique index if not exists club_staff_memberships_active_scope_uidx
  on public.club_staff_memberships (staff_user_id, club_id, (coalesce(squad_id, '')))
  where status = 'active';

alter table public.club_staff_memberships enable row level security;

drop trigger if exists club_staff_memberships_updated_at on public.club_staff_memberships;
create trigger club_staff_memberships_updated_at
  before update on public.club_staff_memberships
  for each row execute function update_updated_at_column();

-- Staff reads own rows only (SELECT additive; existing patterns unchanged elsewhere).
drop policy if exists "Staff read own club_staff_memberships" on public.club_staff_memberships;
create policy "Staff read own club_staff_memberships"
  on public.club_staff_memberships
  for select
  to authenticated
  using (staff_user_id = auth.uid());

-- ─── club_athlete_memberships ─────────────────────────────────

create table if not exists public.club_athlete_memberships (
  id uuid primary key default gen_random_uuid(),
  athlete_user_id uuid not null references auth.users (id) on delete cascade,
  club_id text not null,
  squad_id text null,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  source text not null default 'manual'
    check (source in ('manual', 'profile_backfill', 'import')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_athlete_memberships_athlete_club_squad_idx
  on public.club_athlete_memberships (athlete_user_id, club_id, squad_id);

create index if not exists club_athlete_memberships_club_squad_active_idx
  on public.club_athlete_memberships (club_id, squad_id)
  where status = 'active';

create unique index if not exists club_athlete_memberships_active_scope_uidx
  on public.club_athlete_memberships (athlete_user_id, club_id, (coalesce(squad_id, '')))
  where status = 'active';

alter table public.club_athlete_memberships enable row level security;

drop trigger if exists club_athlete_memberships_updated_at on public.club_athlete_memberships;
create trigger club_athlete_memberships_updated_at
  before update on public.club_athlete_memberships
  for each row execute function update_updated_at_column();

drop policy if exists "Athletes read own club_athlete_memberships" on public.club_athlete_memberships;
create policy "Athletes read own club_athlete_memberships"
  on public.club_athlete_memberships
  for select
  to authenticated
  using (athlete_user_id = auth.uid());

drop policy if exists "Staff read club_athlete_memberships via staff membership" on public.club_athlete_memberships;
create policy "Staff read club_athlete_memberships via staff membership"
  on public.club_athlete_memberships
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.club_staff_memberships sm
      where sm.staff_user_id = auth.uid()
        and sm.status = 'active'
        and sm.club_id = club_athlete_memberships.club_id
        and club_athlete_memberships.status = 'active'
        and (
          sm.squad_id is null
          or (
            club_athlete_memberships.squad_id is not null
            and club_athlete_memberships.squad_id = sm.squad_id
          )
        )
    )
  );

-- ─── profiles: additive SELECT for staff (membership-mediated) ─

drop policy if exists "Staff read profiles of club athletes via memberships" on public.profiles;
create policy "Staff read profiles of club athletes via memberships"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.club_staff_memberships sm
      inner join public.club_athlete_memberships am
        on am.club_id = sm.club_id
       and am.athlete_user_id = profiles.id
       and am.status = 'active'
      where sm.staff_user_id = auth.uid()
        and sm.status = 'active'
        and (
          sm.squad_id is null
          or (
            am.squad_id is not null
            and am.squad_id = sm.squad_id
          )
        )
    )
  );

-- ─── match_calendar: additive SELECT for staff ─────────────────

drop policy if exists "Staff read match_calendar of club athletes via memberships" on public.match_calendar;
create policy "Staff read match_calendar of club athletes via memberships"
  on public.match_calendar
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.club_staff_memberships sm
      inner join public.club_athlete_memberships am
        on am.club_id = sm.club_id
       and am.athlete_user_id = match_calendar.user_id
       and am.status = 'active'
      where sm.staff_user_id = auth.uid()
        and sm.status = 'active'
        and (
          sm.squad_id is null
          or (
            am.squad_id is not null
            and am.squad_id = sm.squad_id
          )
        )
    )
  );

-- ─── session_logs: additive SELECT for staff ───────────────────

drop policy if exists "Staff read session_logs of club athletes via memberships" on public.session_logs;
create policy "Staff read session_logs of club athletes via memberships"
  on public.session_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.club_staff_memberships sm
      inner join public.club_athlete_memberships am
        on am.club_id = sm.club_id
       and am.athlete_user_id = session_logs.user_id
       and am.status = 'active'
      where sm.staff_user_id = auth.uid()
        and sm.status = 'active'
        and (
          sm.squad_id is null
          or (
            am.squad_id is not null
            and am.squad_id = sm.squad_id
          )
        )
    )
  );

-- ─── Backfill athlete memberships from profiles.club_code ─────

insert into public.club_athlete_memberships (
  athlete_user_id,
  club_id,
  squad_id,
  status,
  source
)
select
  p.id,
  trim(p.club_code),
  null,
  'active',
  'profile_backfill'
from public.profiles p
where p.club_code is not null
  and length(trim(p.club_code)) > 0
  and not exists (
    select 1
    from public.club_athlete_memberships m
    where m.athlete_user_id = p.id
      and m.club_id = trim(p.club_code)
      and m.squad_id is null
      and m.status = 'active'
  );

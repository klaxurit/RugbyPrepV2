-- Enrichit les RPC de classement avec club + récence de séance.
--
--   * `club_code` / `club_name` : logo club à côté du pseudo (surtout utile
--     en ligue multi-clubs ; sur le board club tout le monde a le même).
--   * `days_since_last_session` : indice de forme 🔥 / 💤 côté client.
--     Ce n'est PAS une donnée de santé (pas de RPE / fatigue / blessure) —
--     uniquement l'âge de la dernière ligne `session_logs`.
--
-- CREATE OR REPLACE ne peut pas changer la liste des colonnes OUT : on drop
-- puis on recrée.

drop function if exists public.get_club_leaderboard(date);
drop function if exists public.get_league_cohort(date);

create or replace function public.get_club_leaderboard(
  p_week_start date default null
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  club_code text,
  club_name text,
  points integer,
  sessions_completed integer,
  days_since_last_session integer,
  level text,
  is_self boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_club text;
  v_week date := coalesce(p_week_start, (date_trunc('week', current_date))::date);
begin
  if v_caller is null then
    return;
  end if;

  if not public.gamification_is_exposable(v_caller, 'club') then
    return;
  end if;

  select nullif(trim(p.club_code), '') into v_club
  from public.profiles p
  where p.id = v_caller;

  if v_club is null then
    return;
  end if;

  return query
  select
    p.id,
    trim(p.display_name),
    p.avatar_url,
    nullif(trim(p.club_code), ''),
    nullif(trim(p.club_name), ''),
    coalesce(s.points, 0),
    coalesce(s.sessions_completed, 0),
    case
      when last_log.last_date is null then null
      else (current_date - last_log.last_date)::integer
    end,
    coalesce(g.level, 'espoir'),
    p.id = v_caller
  from public.profiles p
  left join public.gamification_weekly_scores s
    on s.user_id = p.id and s.week_start = v_week
  left join public.user_gamification_profile g
    on g.user_id = p.id
  left join lateral (
    select max(sl.date_iso::date) as last_date
    from public.session_logs sl
    where sl.user_id = p.id
  ) last_log on true
  where nullif(trim(p.club_code), '') = v_club
    and public.gamification_is_exposable(p.id, 'club')
  order by coalesce(s.points, 0) desc, trim(p.display_name) asc;
end;
$$;

comment on function public.get_club_leaderboard is
  'Classement hebdomadaire du club. Colonnes : nom, avatar, club, points, '
  'séances, récence, niveau. Aucune donnée de santé (RPE, fatigue, blessures).';

revoke all on function public.get_club_leaderboard(date) from public;
grant execute on function public.get_club_leaderboard(date) to authenticated;

create or replace function public.get_league_cohort(
  p_week_start date default null
)
returns table (
  cohort_id uuid,
  tier text,
  promotion_cutoff integer,
  relegation_cutoff integer,
  user_id uuid,
  display_name text,
  avatar_url text,
  club_code text,
  club_name text,
  points integer,
  sessions_completed integer,
  days_since_last_session integer,
  level text,
  is_self boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_cohort uuid;
  v_week date := coalesce(p_week_start, (date_trunc('week', current_date))::date);
begin
  if v_caller is null then
    return;
  end if;

  if not public.gamification_is_exposable(v_caller, 'cohort') then
    return;
  end if;

  select m.cohort_id into v_cohort
  from public.league_cohort_members m
  inner join public.league_cohorts c on c.id = m.cohort_id
  where m.user_id = v_caller
    and c.week_start = v_week
  limit 1;

  if v_cohort is null then
    return;
  end if;

  return query
  select
    c.id,
    c.tier,
    c.promotion_cutoff,
    c.relegation_cutoff,
    p.id,
    trim(p.display_name),
    p.avatar_url,
    nullif(trim(p.club_code), ''),
    nullif(trim(p.club_name), ''),
    coalesce(s.points, 0),
    coalesce(s.sessions_completed, 0),
    case
      when last_log.last_date is null then null
      else (current_date - last_log.last_date)::integer
    end,
    coalesce(g.level, 'espoir'),
    p.id = v_caller
  from public.league_cohort_members m
  inner join public.league_cohorts c on c.id = m.cohort_id
  inner join public.profiles p on p.id = m.user_id
  left join public.gamification_weekly_scores s
    on s.user_id = p.id and s.week_start = v_week
  left join public.user_gamification_profile g
    on g.user_id = p.id
  left join lateral (
    select max(sl.date_iso::date) as last_date
    from public.session_logs sl
    where sl.user_id = p.id
  ) last_log on true
  where m.cohort_id = v_cohort
    and public.gamification_is_exposable(p.id, 'cohort')
  order by coalesce(s.points, 0) desc, trim(p.display_name) asc;
end;
$$;

comment on function public.get_league_cohort is
  'Cohorte de ligue hebdomadaire. Colonnes : club + récence pour logo et '
  'indice de forme. Aucune donnée de santé. Opt-in ''cohort'' requis.';

revoke all on function public.get_league_cohort(date) from public;
grant execute on function public.get_league_cohort(date) to authenticated;

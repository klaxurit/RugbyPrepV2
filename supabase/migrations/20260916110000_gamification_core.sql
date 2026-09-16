-- Gamification — socle : état cumulatif, scores hebdomadaires, badges,
-- consentement de visibilité sociale, et RPC de classement club.
--
-- Doctrine de confidentialité (cf. docs/gamification-competition-plan.md § 4) :
--   * `profiles.social_visibility` vaut 'private' par défaut. Aucune donnée
--     n'est exposée à un pair sans opt-in explicite, recueilli sur un écran
--     dédié et non via les CGU.
--   * Aucune policy RLS n'ouvre la lecture croisée. Les classements passent
--     exclusivement par des RPC SECURITY DEFINER qui appliquent une liste
--     blanche de colonnes.
--   * Les données de santé (RPE, fatigue, blessures, poids, charges) ne
--     sortent jamais du périmètre de l'athlète.
--   * Les mineurs sont exclus des classements tant que le consentement santé
--     n'est pas accordé.

-- ─── profiles.social_visibility ───────────────────────────────

alter table public.profiles
  add column if not exists social_visibility text not null default 'private';

alter table public.profiles
  drop constraint if exists profiles_social_visibility_check;
alter table public.profiles
  add constraint profiles_social_visibility_check
  check (social_visibility in ('private', 'club', 'cohort'));

comment on column public.profiles.social_visibility is
  'Périmètre de visibilité des données de gamification par les autres athlètes. '
  '''private'' (défaut) : aucune exposition. ''club'' : classement du club. '
  '''cohort'' : classement du club + ligues hebdomadaires. Finalité distincte de '
  'la visibilité staff : exige son propre consentement explicite.';

-- ─── user_gamification_profile ────────────────────────────────
-- État cumulatif. L'XP ne décroît jamais : une blessure ne défait pas le
-- travail accompli. La pression de récurrence est portée par la ligue
-- hebdomadaire, qui se réinitialise.

create table if not exists public.user_gamification_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  level text not null default 'espoir'
    check (level in ('espoir', 'titulaire', 'cadre', 'capitaine', 'legende')),
  current_week_streak integer not null default 0 check (current_week_streak >= 0),
  longest_week_streak integer not null default 0 check (longest_week_streak >= 0),
  -- Lundi de la semaine pour laquelle la tolérance de streak a été consommée.
  freeze_used_at date,
  -- Lundi de la dernière semaine clôturée, pour ne pas recompter un streak.
  streak_week_start date,
  league_tier text not null default 'reserve'
    check (league_tier in ('reserve', 'espoirs', 'premiere', 'federale', 'elite')),
  updated_at timestamptz not null default now()
);

alter table public.user_gamification_profile enable row level security;

drop policy if exists "Users read own gamification profile"
  on public.user_gamification_profile;
create policy "Users read own gamification profile"
  on public.user_gamification_profile
  for select
  to authenticated
  using (user_id = auth.uid());

-- Pas de policy d'écriture : le scoring est écrit exclusivement par les Edge
-- Functions en service role. Un client ne doit jamais pouvoir s'attribuer des
-- points.

drop trigger if exists user_gamification_profile_updated_at
  on public.user_gamification_profile;
create trigger user_gamification_profile_updated_at
  before update on public.user_gamification_profile
  for each row execute function update_updated_at_column();

comment on table public.user_gamification_profile is
  'État cumulatif de gamification. Écriture réservée au service role (Edge Functions).';

-- ─── gamification_weekly_scores ───────────────────────────────

create table if not exists public.gamification_weekly_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Lundi de la semaine ISO.
  week_start date not null,
  points integer not null default 0 check (points >= 0),
  sessions_planned integer not null default 0 check (sessions_planned >= 0),
  sessions_completed integer not null default 0 check (sessions_completed >= 0),
  deload_respected boolean not null default false,
  -- L'athlète était en zone de surcharge : les séances hors plan n'ont rien
  -- rapporté. Conservé pour pouvoir l'expliquer dans l'UI.
  acwr_capped boolean not null default false,
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.gamification_weekly_scores enable row level security;

drop policy if exists "Users read own weekly scores" on public.gamification_weekly_scores;
create policy "Users read own weekly scores"
  on public.gamification_weekly_scores
  for select
  to authenticated
  using (user_id = auth.uid());

create index if not exists gamification_weekly_scores_week_idx
  on public.gamification_weekly_scores (week_start desc, points desc);

create index if not exists gamification_weekly_scores_user_week_idx
  on public.gamification_weekly_scores (user_id, week_start desc);

drop trigger if exists gamification_weekly_scores_updated_at
  on public.gamification_weekly_scores;
create trigger gamification_weekly_scores_updated_at
  before update on public.gamification_weekly_scores
  for each row execute function update_updated_at_column();

comment on column public.gamification_weekly_scores.breakdown is
  'Détail des points par poste, pour expliquer le score au lieu d''afficher un total opaque.';

-- ─── gamification_badges ──────────────────────────────────────
-- Les jalons étaient recalculés à chaque affichage, donc sans date de
-- déblocage réelle et non notifiables. On persiste le déblocage.

create table if not exists public.gamification_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.gamification_badges enable row level security;

drop policy if exists "Users read own badges" on public.gamification_badges;
create policy "Users read own badges"
  on public.gamification_badges
  for select
  to authenticated
  using (user_id = auth.uid());

-- ─── Helper : éligibilité à l'exposition sociale ──────────────
-- Centralise la règle de consentement. Toute RPC de classement doit passer
-- par ici : une seule définition évite qu'un futur endpoint oublie le cas des
-- mineurs.

create or replace function public.gamification_is_exposable(
  p_user_id uuid,
  p_required_visibility text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and (
        p.social_visibility = p_required_visibility
        -- 'cohort' est plus permissif que 'club' : il l'inclut.
        or (p_required_visibility = 'club' and p.social_visibility = 'cohort')
      )
      and coalesce(nullif(trim(p.display_name), ''), null) is not null
      -- Mineurs : jamais exposés sans consentement santé accordé.
      and (
        coalesce(p.age_band, 'adult') = 'adult'
        or p.health_consent_status = 'granted'
      )
  );
$$;

comment on function public.gamification_is_exposable is
  'Règle unique de consentement à l''exposition sociale : opt-in explicite, nom '
  'd''affichage renseigné, et consentement santé accordé pour les mineurs.';

-- ─── RPC : classement du club ─────────────────────────────────
-- Seule voie de lecture croisée. Liste blanche stricte de colonnes : aucun
-- champ de santé ne peut transiter, même par erreur d'appel.

create or replace function public.get_club_leaderboard(
  p_week_start date default null
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  points integer,
  sessions_completed integer,
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

  -- L'appelant doit lui-même avoir accepté d'entrer dans le classement. On ne
  -- laisse pas consulter les autres en restant invisible.
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
    coalesce(s.points, 0),
    coalesce(s.sessions_completed, 0),
    coalesce(g.level, 'espoir'),
    p.id = v_caller
  from public.profiles p
  left join public.gamification_weekly_scores s
    on s.user_id = p.id and s.week_start = v_week
  left join public.user_gamification_profile g
    on g.user_id = p.id
  where nullif(trim(p.club_code), '') = v_club
    and public.gamification_is_exposable(p.id, 'club')
  order by coalesce(s.points, 0) desc, trim(p.display_name) asc;
end;
$$;

comment on function public.get_club_leaderboard is
  'Classement hebdomadaire du club de l''appelant. Liste blanche de colonnes : '
  'nom affiché, avatar, points, séances, niveau. Aucune donnée de santé. '
  'Exclut les athlètes non opt-in et exige que l''appelant soit lui-même opt-in.';

revoke all on function public.get_club_leaderboard(date) from public;
grant execute on function public.get_club_leaderboard(date) to authenticated;

revoke all on function public.gamification_is_exposable(uuid, text) from public;
grant execute on function public.gamification_is_exposable(uuid, text) to authenticated;

-- ─── RPC : pouls du club ──────────────────────────────────────
-- Agrégat non nominatif pour le nudge « pouls du club ». Renvoie 0 en dessous
-- de deux athlètes : avec un seul actif, le compteur révélerait son activité
-- individuelle sous couvert d'information collective.

create or replace function public.get_club_pulse(
  p_week_start date default null
)
returns table (
  club_name text,
  athletes_on_plan integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_club text;
  v_club_name text;
  v_count integer;
  v_week date := coalesce(p_week_start, (date_trunc('week', current_date))::date);
begin
  if v_caller is null then
    return;
  end if;

  select nullif(trim(p.club_code), ''), p.club_name
    into v_club, v_club_name
  from public.profiles p
  where p.id = v_caller;

  if v_club is null then
    return;
  end if;

  select count(*)::integer into v_count
  from public.profiles p
  inner join public.gamification_weekly_scores s
    on s.user_id = p.id and s.week_start = v_week
  where nullif(trim(p.club_code), '') = v_club
    and p.id <> v_caller
    and s.sessions_completed > 0
    and public.gamification_is_exposable(p.id, 'club');

  if v_count < 2 then
    return;
  end if;

  return query select v_club_name, v_count;
end;
$$;

comment on function public.get_club_pulse is
  'Compteur non nominatif d''athlètes du club ayant tenu leur plan cette semaine. '
  'Muet en dessous de deux athlètes, pour ne pas révéler une activité individuelle.';

revoke all on function public.get_club_pulse(date) from public;
grant execute on function public.get_club_pulse(date) to authenticated;

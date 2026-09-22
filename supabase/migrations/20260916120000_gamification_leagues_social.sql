-- Gamification — ligues hebdomadaires, défi de club, duels, kudos, file de
-- nudges.
--
-- Pourquoi des cohortes plutôt qu'un classement global : une arène de 20 à 30
-- athlètes appariés rend le haut de tableau plausible pour n'importe qui,
-- alors qu'un classement global place la plupart des utilisateurs à une place
-- qu'ils n'atteindront jamais et qu'ils cessent de consulter. La remise à zéro
-- hebdomadaire est ce qui entretient la compétition : un classement perpétuel
-- se figerait.
--
-- Toutes les lectures croisées passent par des RPC SECURITY DEFINER qui
-- appliquent `gamification_is_exposable` et une liste blanche de colonnes.

-- ─── league_cohorts ───────────────────────────────────────────

create table if not exists public.league_cohorts (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  tier text not null
    check (tier in ('reserve', 'espoirs', 'premiere', 'federale', 'elite')),
  -- Seuils calculés à la taille réelle de la cohorte : une cohorte
  -- sous-remplie garde la même proportion de promus et de relégués.
  promotion_cutoff integer not null default 0 check (promotion_cutoff >= 0),
  relegation_cutoff integer not null default 0 check (relegation_cutoff >= 0),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.league_cohorts enable row level security;

create index if not exists league_cohorts_week_tier_idx
  on public.league_cohorts (week_start desc, tier);

-- Pas de policy de lecture directe : l'accès se fait via get_league_cohort.

-- ─── league_cohort_members ────────────────────────────────────

create table if not exists public.league_cohort_members (
  cohort_id uuid not null references public.league_cohorts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  final_rank integer check (final_rank >= 1),
  points_snapshot integer check (points_snapshot >= 0),
  outcome text check (outcome in ('promoted', 'stayed', 'relegated')),
  created_at timestamptz not null default now(),
  primary key (cohort_id, user_id)
);

alter table public.league_cohort_members enable row level security;

create index if not exists league_cohort_members_user_idx
  on public.league_cohort_members (user_id);

-- Un athlète ne peut appartenir qu'à une cohorte par semaine.
create unique index if not exists league_cohort_members_user_week_uidx
  on public.league_cohort_members (user_id, cohort_id);

drop policy if exists "Users read own cohort membership" on public.league_cohort_members;
create policy "Users read own cohort membership"
  on public.league_cohort_members
  for select
  to authenticated
  using (user_id = auth.uid());

-- ─── duels ────────────────────────────────────────────────────
-- Engagement volontaire : c'est ce qui rend la compétition directe
-- acceptable. Personne n'est enrôlé dans un duel sans l'avoir accepté.

create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references auth.users (id) on delete cascade,
  opponent_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'declined')),
  challenger_points integer not null default 0 check (challenger_points >= 0),
  opponent_points integer not null default 0 check (opponent_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint duels_distinct_participants check (challenger_id <> opponent_id)
);

alter table public.duels enable row level security;

-- Un seul duel par paire et par semaine, quel que soit le sens de
-- l'invitation : sinon deux invitations croisées créeraient deux duels.
create unique index if not exists duels_pair_week_uidx
  on public.duels (
    least(challenger_id, opponent_id),
    greatest(challenger_id, opponent_id),
    week_start
  );

create index if not exists duels_opponent_week_idx
  on public.duels (opponent_id, week_start desc);

drop policy if exists "Participants read own duels" on public.duels;
create policy "Participants read own duels"
  on public.duels
  for select
  to authenticated
  using (challenger_id = auth.uid() or opponent_id = auth.uid());

drop policy if exists "Challenger creates duel with exposable opponent" on public.duels;
create policy "Challenger creates duel with exposable opponent"
  on public.duels
  for insert
  to authenticated
  with check (
    challenger_id = auth.uid()
    and public.gamification_is_exposable(auth.uid(), 'club')
    and public.gamification_is_exposable(opponent_id, 'club')
  );

-- L'adversaire accepte ou refuse. Les scores restent écrits par le service
-- role : un participant ne doit pas pouvoir éditer le résultat.
drop policy if exists "Opponent answers duel" on public.duels;
create policy "Opponent answers duel"
  on public.duels
  for update
  to authenticated
  using (opponent_id = auth.uid() and status = 'pending')
  with check (opponent_id = auth.uid() and status in ('active', 'declined'));

drop trigger if exists duels_updated_at on public.duels;
create trigger duels_updated_at
  before update on public.duels
  for each row execute function update_updated_at_column();

-- ─── kudos ────────────────────────────────────────────────────
-- Reconnaissance en un tap. Coût de build faible, boucle de validation
-- sociale démontrée, et aucun effet compétitif négatif : on ne peut que
-- valoriser un coéquipier.

create table if not exists public.kudos (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users (id) on delete cascade,
  to_user_id uuid not null references auth.users (id) on delete cascade,
  session_log_id uuid not null references public.session_logs (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint kudos_no_self check (from_user_id <> to_user_id),
  unique (from_user_id, session_log_id)
);

alter table public.kudos enable row level security;

create index if not exists kudos_to_user_idx
  on public.kudos (to_user_id, created_at desc);

drop policy if exists "Users read kudos they received or gave" on public.kudos;
create policy "Users read kudos they received or gave"
  on public.kudos
  for select
  to authenticated
  using (to_user_id = auth.uid() or from_user_id = auth.uid());

drop policy if exists "Users give kudos to exposable athletes" on public.kudos;
create policy "Users give kudos to exposable athletes"
  on public.kudos
  for insert
  to authenticated
  with check (
    from_user_id = auth.uid()
    and public.gamification_is_exposable(to_user_id, 'club')
    -- La séance saluée doit bien appartenir à l'athlète salué.
    and exists (
      select 1
      from public.session_logs sl
      where sl.id = session_log_id
        and sl.user_id = to_user_id
    )
  );

drop policy if exists "Users retract own kudos" on public.kudos;
create policy "Users retract own kudos"
  on public.kudos
  for delete
  to authenticated
  using (from_user_id = auth.uid());

-- ─── social_nudges ────────────────────────────────────────────
-- File serveur, source unique des pop-ups sociales. Centraliser en base rend
-- l'anti-spam vérifiable, au lieu de le disperser dans le client.

create table if not exists public.social_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null
    check (kind in (
      'level_up',
      'league_promotion',
      'league_overtaken',
      'duel_result',
      'duel_invite',
      'kudos_received',
      'club_pulse',
      'peer_emulation'
    )),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '48 hours')
);

alter table public.social_nudges enable row level security;

create index if not exists social_nudges_user_pending_idx
  on public.social_nudges (user_id, created_at desc)
  where consumed_at is null;

drop policy if exists "Users read own nudges" on public.social_nudges;
create policy "Users read own nudges"
  on public.social_nudges
  for select
  to authenticated
  using (user_id = auth.uid());

-- Le client ne peut que marquer un nudge comme consommé. Il ne peut pas en
-- créer : un nudge doit correspondre à un événement constaté côté serveur.
drop policy if exists "Users consume own nudges" on public.social_nudges;
create policy "Users consume own nudges"
  on public.social_nudges
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on table public.social_nudges is
  'File des nudges sociaux. Écriture réservée au service role : chaque nudge '
  'correspond à un événement réel, jamais à une relance générique.';

-- ─── RPC : cohorte de ligue de l'appelant ─────────────────────

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
    coalesce(s.points, 0),
    coalesce(s.sessions_completed, 0),
    coalesce(g.level, 'espoir'),
    p.id = v_caller
  from public.league_cohort_members m
  inner join public.league_cohorts c on c.id = m.cohort_id
  inner join public.profiles p on p.id = m.user_id
  left join public.gamification_weekly_scores s
    on s.user_id = p.id and s.week_start = v_week
  left join public.user_gamification_profile g
    on g.user_id = p.id
  where m.cohort_id = v_cohort
    and public.gamification_is_exposable(p.id, 'cohort')
  order by coalesce(s.points, 0) desc, trim(p.display_name) asc;
end;
$$;

comment on function public.get_league_cohort is
  'Cohorte de ligue hebdomadaire de l''appelant. Liste blanche de colonnes, '
  'aucune donnée de santé. Exige que l''appelant soit opt-in ''cohort''.';

revoke all on function public.get_league_cohort(date) from public;
grant execute on function public.get_league_cohort(date) to authenticated;

-- ─── RPC : défi collectif de club ─────────────────────────────
-- Objectif coopératif : la pression sociale sans la comparaison
-- interpersonnelle, ce qui évite les effets indésirables du classement pur.

create or replace function public.get_club_challenge(
  p_week_start date default null
)
returns table (
  club_code text,
  target integer,
  current_total integer,
  participant_count integer
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
  v_participants integer;
  v_total integer;
  v_target integer;
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

  select
    count(*)::integer,
    coalesce(sum(coalesce(s.sessions_completed, 0)), 0)::integer
  into v_participants, v_total
  from public.profiles p
  left join public.gamification_weekly_scores s
    on s.user_id = p.id and s.week_start = v_week
  where nullif(trim(p.club_code), '') = v_club
    and public.gamification_is_exposable(p.id, 'club');

  if v_participants < 2 then
    return;
  end if;

  -- Cible proportionnelle à l'effectif engagé : trois séances par athlète.
  -- Un objectif fixe serait trivial pour un gros club et hors d'atteinte pour
  -- un petit.
  v_target := greatest(v_participants * 3, 6);

  return query select v_club, v_target, v_total, v_participants;
end;
$$;

comment on function public.get_club_challenge is
  'Défi collectif hebdomadaire du club : objectif proportionnel à l''effectif '
  'opt-in, avancement agrégé. Aucune donnée individuelle.';

revoke all on function public.get_club_challenge(date) from public;
grant execute on function public.get_club_challenge(date) to authenticated;

-- ─── RPC : duels de la semaine ────────────────────────────────
-- Expose le nom de l'adversaire, que les policies RLS seules ne permettraient
-- pas de joindre depuis `profiles`.

create or replace function public.get_my_duels(
  p_week_start date default null
)
returns table (
  duel_id uuid,
  week_start date,
  status text,
  is_challenger boolean,
  opponent_display_name text,
  opponent_avatar_url text,
  self_points integer,
  opponent_points integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_week date := coalesce(p_week_start, (date_trunc('week', current_date))::date);
begin
  if v_caller is null then
    return;
  end if;

  return query
  select
    d.id,
    d.week_start,
    d.status,
    d.challenger_id = v_caller,
    trim(other.display_name),
    other.avatar_url,
    case when d.challenger_id = v_caller then d.challenger_points else d.opponent_points end,
    case when d.challenger_id = v_caller then d.opponent_points else d.challenger_points end
  from public.duels d
  inner join public.profiles other
    on other.id = case when d.challenger_id = v_caller then d.opponent_id else d.challenger_id end
  where (d.challenger_id = v_caller or d.opponent_id = v_caller)
    and d.week_start = v_week
  order by d.created_at desc;
end;
$$;

comment on function public.get_my_duels is
  'Duels de la semaine de l''appelant, avec le nom d''affichage de l''adversaire. '
  'Aucune donnée de santé.';

revoke all on function public.get_my_duels(date) from public;
grant execute on function public.get_my_duels(date) to authenticated;

-- ─── RPC : coéquipiers duellables ─────────────────────────────

create or replace function public.get_duel_candidates(
  p_week_start date default null
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  level text
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
    coalesce(g.level, 'espoir')
  from public.profiles p
  left join public.user_gamification_profile g on g.user_id = p.id
  where nullif(trim(p.club_code), '') = v_club
    and p.id <> v_caller
    and public.gamification_is_exposable(p.id, 'club')
    -- Exclut les athlètes déjà engagés avec l'appelant cette semaine.
    and not exists (
      select 1
      from public.duels d
      where d.week_start = v_week
        and d.status <> 'declined'
        and (
          (d.challenger_id = v_caller and d.opponent_id = p.id)
          or (d.challenger_id = p.id and d.opponent_id = v_caller)
        )
    )
  order by trim(p.display_name) asc
  limit 50;
end;
$$;

comment on function public.get_duel_candidates is
  'Coéquipiers opt-in du club, hors duel en cours avec l''appelant.';

revoke all on function public.get_duel_candidates(date) from public;
grant execute on function public.get_duel_candidates(date) to authenticated;

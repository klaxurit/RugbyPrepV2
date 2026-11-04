-- KPI activation figé : 1ʳᵉ séance dans les 7 j après signup (docs/product-analytics.md).

create or replace function public.admin_product_insights(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_days int := greatest(7, least(180, coalesce(p_days, 30)));
  v_since timestamptz := now() - make_interval(days => v_days);
  v_result jsonb;
begin
  with
  cohort as (
    select
      p.id,
      p.created_at,
      coalesce(p.onboarding_complete, false) as onboarded,
      p.training_level,
      p.weekly_sessions,
      p.position,
      case
        when p.equipment is null then 'unknown'
        when p.equipment::text ilike '%barbell%'
          or p.equipment::text ilike '%rack%'
          or p.equipment::text ilike '%dumbbell%'
          then 'gym_leaning'
        when p.equipment::text ilike '%bodyweight%'
          or p.equipment::text = '[]'
          or p.equipment::text = 'null'
          then 'bw_leaning'
        else 'mixed'
      end as equipment_bucket
    from public.profiles p
  ),
  logs as (
    select
      sl.user_id,
      count(*)::int as session_count,
      min(sl.created_at) as first_log_at,
      max(sl.created_at) as last_log_at,
      count(*) filter (
        where sl.created_at >= now() - interval '7 days'
      )::int as sessions_last_7d,
      count(*) filter (
        where sl.created_at >= now() - interval '28 days'
      )::int as sessions_last_28d
    from public.session_logs sl
    group by sl.user_id
  ),
  joined as (
    select
      c.*,
      coalesce(l.session_count, 0) as session_count,
      l.first_log_at,
      l.last_log_at,
      coalesce(l.sessions_last_7d, 0) as sessions_last_7d,
      coalesce(l.sessions_last_28d, 0) as sessions_last_28d,
      (
        l.first_log_at is not null
        and l.first_log_at >= c.created_at
        and l.first_log_at <= c.created_at + interval '7 days'
      ) as activated_within_7d
    from cohort c
    left join logs l on l.user_id = c.id
  ),
  funnel as (
    select
      count(*)::int as profiles_total,
      count(*) filter (where created_at >= v_since)::int as signups_window,
      count(*) filter (where onboarded)::int as onboarded_total,
      count(*) filter (where created_at >= v_since and onboarded)::int as onboarded_window,
      count(*) filter (where session_count > 0)::int as activated_total,
      count(*) filter (
        where created_at >= v_since and session_count > 0
      )::int as activated_window,
      count(*) filter (where activated_within_7d)::int as activated_within_7d,
      count(*) filter (
        where onboarded and activated_within_7d
      )::int as onboarded_activated_within_7d,
      count(*) filter (
        where session_count > 0 and not activated_within_7d
      )::int as activated_beyond_7d,
      count(*) filter (
        where onboarded and session_count = 0
      )::int as onboarded_never_trained,
      count(*) filter (
        where session_count = 1
      )::int as one_and_done,
      count(*) filter (
        where session_count >= 2
      )::int as returned_at_least_once,
      count(*) filter (
        where sessions_last_7d > 0
      )::int as active_7d,
      count(*) filter (
        where sessions_last_28d > 0
      )::int as active_28d,
      count(*) filter (
        where onboarded
          and session_count > 0
          and coalesce(last_log_at, created_at) < now() - interval '14 days'
      )::int as dormant_14d,
      round(
        avg(
          extract(epoch from (first_log_at - created_at)) / 3600.0
        ) filter (where first_log_at is not null and first_log_at >= created_at),
        1
      ) as avg_hours_to_first_session
    from joined
  ),
  by_equipment as (
    select coalesce(equipment_bucket, 'unknown') as key, count(*)::int as n
    from joined
    where onboarded
    group by 1
  ),
  by_equipment_activated as (
    select coalesce(equipment_bucket, 'unknown') as key, count(*)::int as n
    from joined
    where session_count > 0
    group by 1
  ),
  by_level as (
    select coalesce(training_level, 'unset') as key, count(*)::int as n
    from joined
    where onboarded
    group by 1
  ),
  by_level_activated as (
    select coalesce(training_level, 'unset') as key, count(*)::int as n
    from joined
    where session_count > 0
    group by 1
  ),
  by_sessions_target as (
    select coalesce(weekly_sessions::text, 'unset') as key, count(*)::int as n
    from joined
    where onboarded
    group by 1
  ),
  by_position as (
    select coalesce(position, 'unset') as key, count(*)::int as n
    from joined
    where onboarded
    group by 1
    order by n desc
    limit 12
  ),
  session_mix as (
    select sl.session_type as key, count(*)::int as n
    from public.session_logs sl
    where sl.created_at >= v_since
    group by 1
    order by n desc
  ),
  recent_signups as (
    select
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
      count(*)::int as n
    from joined
    where created_at >= v_since
    group by 1
    order by 1
  ),
  recent_logs as (
    select
      to_char(date_trunc('day', first_log_at), 'YYYY-MM-DD') as day,
      count(*)::int as n
    from joined
    where first_log_at >= v_since
    group by 1
    order by 1
  )
  select jsonb_build_object(
    'windowDays', v_days,
    'generatedAt', now(),
    'definitions', jsonb_build_object(
      'activation', 'first session_log within 7 days of profiles.created_at',
      'activationWindowDays', 7,
      'schemaDoc', 'docs/product-analytics.md'
    ),
    'funnel', (
      select jsonb_build_object(
        'profiles_total', profiles_total,
        'signups_window', signups_window,
        'onboarded_total', onboarded_total,
        'onboarded_window', onboarded_window,
        'activated_total', activated_total,
        'activated_window', activated_window,
        'activated_within_7d', activated_within_7d,
        'onboarded_activated_within_7d', onboarded_activated_within_7d,
        'activated_beyond_7d', activated_beyond_7d,
        'onboarded_never_trained', onboarded_never_trained,
        'one_and_done', one_and_done,
        'returned_at_least_once', returned_at_least_once,
        'active_7d', active_7d,
        'active_28d', active_28d,
        'dormant_14d', dormant_14d,
        'avg_hours_to_first_session', avg_hours_to_first_session
      )
      from funnel
    ),
    'breakdowns', jsonb_build_object(
      'equipmentOnboarded', coalesce(
        (select jsonb_object_agg(key, n) from by_equipment), '{}'::jsonb
      ),
      'equipmentActivated', coalesce(
        (select jsonb_object_agg(key, n) from by_equipment_activated), '{}'::jsonb
      ),
      'trainingLevelOnboarded', coalesce(
        (select jsonb_object_agg(key, n) from by_level), '{}'::jsonb
      ),
      'trainingLevelActivated', coalesce(
        (select jsonb_object_agg(key, n) from by_level_activated), '{}'::jsonb
      ),
      'weeklySessionsTarget', coalesce(
        (select jsonb_object_agg(key, n) from by_sessions_target), '{}'::jsonb
      ),
      'positionOnboarded', coalesce(
        (select jsonb_object_agg(key, n) from by_position), '{}'::jsonb
      ),
      'sessionTypesWindow', coalesce(
        (select jsonb_object_agg(key, n) from session_mix), '{}'::jsonb
      )
    ),
    'series', jsonb_build_object(
      'signupsByDay', coalesce(
        (select jsonb_agg(jsonb_build_object('day', day, 'n', n) order by day) from recent_signups),
        '[]'::jsonb
      ),
      'firstSessionsByDay', coalesce(
        (select jsonb_agg(jsonb_build_object('day', day, 'n', n) order by day) from recent_logs),
        '[]'::jsonb
      )
    )
  )
  into v_result;

  return v_result;
end;
$$;

comment on function public.admin_product_insights is
  'Agrégats funnel / rétention admin. Activation = 1er log ≤7j après signup. Pas de PII.';

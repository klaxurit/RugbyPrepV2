-- Aligne onboarding_complete avec la logique app (profils legacy position + niveau).
update public.profiles
set onboarding_complete = true
where onboarding_complete = false
  and coalesce(nullif(trim(position), ''), nullif(trim(rugby_position), '')) is not null
  and (
    nullif(trim(training_level), '') is not null
    or nullif(trim(level_modifier_profile->>'visibleLabel'), '') is not null
  );

create or replace function public.admin_list_users_page(
  p_page int default 1,
  p_page_size int default 20,
  p_search text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_page int;
  v_page_size int;
  v_offset int;
  v_total bigint;
  v_week_start text;
  v_week_end text;
  v_search text;
  v_users jsonb;
begin
  v_page := greatest(1, coalesce(p_page, 1));
  v_page_size := least(50, greatest(1, coalesce(p_page_size, 20)));
  v_offset := (v_page - 1) * v_page_size;
  v_search := nullif(trim(coalesce(p_search, '')), '');

  v_week_start := to_char(
    date_trunc('week', (timezone('Europe/Paris', now())))::date,
    'YYYY-MM-DD'
  );
  v_week_end := to_char(
    (date_trunc('week', (timezone('Europe/Paris', now())))::date + interval '6 days')::date,
    'YYYY-MM-DD'
  );

  select count(*)::bigint
  into v_total
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.deleted_at is null
    and (
      v_search is null
      or u.email ilike '%' || v_search || '%'
      or coalesce(nullif(trim(p.display_name), ''), nullif(trim(u.raw_user_meta_data->>'display_name'), '')) ilike '%' || v_search || '%'
      or coalesce(p.club_name, '') ilike '%' || v_search || '%'
      or coalesce(p.club_code, '') ilike '%' || v_search || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(t) order by t.sessions_this_week desc, t.updated_at desc), '[]'::jsonb)
  into v_users
  from (
    select
      u.id as user_id,
      u.email,
      coalesce(
        nullif(trim(p.display_name), ''),
        nullif(trim(u.raw_user_meta_data->>'display_name'), '')
      ) as display_name,
      coalesce(
        nullif(trim(p.avatar_url), ''),
        nullif(trim(u.raw_user_meta_data->>'avatar_url'), '')
      ) as avatar_url,
      coalesce(
        nullif(trim(p.avatar_path), ''),
        nullif(trim(u.raw_user_meta_data->>'avatar_path'), '')
      ) as avatar_path,
      p.club_code,
      p.club_name,
      p.weekly_sessions,
      p.season_mode,
      case
        when p.id is null then false
        when coalesce(p.onboarding_complete, false) then true
        when coalesce(nullif(trim(p.position), ''), nullif(trim(p.rugby_position), '')) is not null
          and (
            nullif(trim(p.training_level), '') is not null
            or nullif(trim(p.level_modifier_profile->>'visibleLabel'), '') is not null
          ) then true
        else false
      end as onboarding_complete,
      (p.id is not null) as has_profile,
      coalesce(p.updated_at, p.created_at, u.updated_at, u.created_at) as updated_at,
      coalesce(sc.cnt, 0)::int as sessions_this_week
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join lateral (
      select count(*)::int as cnt
      from public.session_logs sl
      where sl.user_id = u.id
        and sl.date_iso >= v_week_start
        and sl.date_iso <= v_week_end
    ) sc on true
    where u.deleted_at is null
      and (
        v_search is null
        or u.email ilike '%' || v_search || '%'
        or coalesce(nullif(trim(p.display_name), ''), nullif(trim(u.raw_user_meta_data->>'display_name'), '')) ilike '%' || v_search || '%'
        or coalesce(p.club_name, '') ilike '%' || v_search || '%'
        or coalesce(p.club_code, '') ilike '%' || v_search || '%'
      )
    order by coalesce(sc.cnt, 0) desc, coalesce(p.updated_at, p.created_at, u.updated_at, u.created_at) desc nulls last
    limit v_page_size
    offset v_offset
  ) t;

  return jsonb_build_object(
    'page', v_page,
    'pageSize', v_page_size,
    'total', v_total,
    'weekStart', v_week_start,
    'weekEnd', v_week_end,
    'users', v_users
  );
end;
$$;

revoke all on function public.admin_list_users_page(int, int, text) from public;
grant execute on function public.admin_list_users_page(int, int, text) to service_role;

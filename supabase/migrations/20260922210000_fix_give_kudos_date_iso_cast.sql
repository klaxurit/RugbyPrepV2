-- give_kudos : `session_logs.date_iso` est text (YYYY-MM-DD), `v_week` est date.
-- Sans cast → ERROR: operator does not exist: text >= date

create or replace function public.give_kudos(
  p_to_user_id uuid,
  p_week_start date default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_week date := coalesce(p_week_start, (date_trunc('week', current_date))::date);
  v_log uuid;
begin
  if v_caller is null or p_to_user_id is null then
    return false;
  end if;

  if v_caller = p_to_user_id then
    return false;
  end if;

  if not public.gamification_is_exposable(v_caller, 'club') then
    return false;
  end if;

  if not public.gamification_is_exposable(p_to_user_id, 'club') then
    return false;
  end if;

  -- left(..., 10) tolère d'anciens logs horodatés (…T…) tout en restant
  -- comparable à une date calendaire.
  select sl.id into v_log
  from public.session_logs sl
  where sl.user_id = p_to_user_id
    and left(sl.date_iso, 10)::date >= v_week
    and left(sl.date_iso, 10)::date < v_week + 7
  order by left(sl.date_iso, 10) desc, sl.created_at desc
  limit 1;

  if v_log is null then
    return false;
  end if;

  insert into public.kudos (from_user_id, to_user_id, session_log_id)
  values (v_caller, p_to_user_id, v_log)
  on conflict (from_user_id, session_log_id) do nothing;

  return true;
end;
$$;

comment on function public.give_kudos is
  'Salue la dernière séance de la semaine d''un coéquipier opt-in. Le client '
  'n''a jamais besoin d''un identifiant de séance. Idempotent sur la semaine.';

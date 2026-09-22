-- give_kudos : uniquement une séance **du jour** + nudge in-app immédiat.
--
-- Le cœur UI n'apparaît que si days_since_last_session = 0 ; le serveur doit
-- appliquer la même règle (pas « n'importe quelle séance de la semaine »).
-- Après un vrai insert, on enfile un `kudos_received` pour le destinataire
-- (SocialNudgeHost), sans attendre le cron quotidien.

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
  v_log uuid;
  v_kudos_id uuid;
  v_caller_name text;
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

  -- Séance du jour seulement (« Faite » aujourd'hui).
  select sl.id into v_log
  from public.session_logs sl
  where sl.user_id = p_to_user_id
    and left(sl.date_iso, 10)::date = current_date
  order by sl.created_at desc
  limit 1;

  if v_log is null then
    return false;
  end if;

  insert into public.kudos (from_user_id, to_user_id, session_log_id)
  values (v_caller, p_to_user_id, v_log)
  on conflict (from_user_id, session_log_id) do nothing
  returning id into v_kudos_id;

  -- Idempotent : pas de second nudge si le kudos existait déjà.
  if v_kudos_id is null then
    return true;
  end if;

  select nullif(trim(p.display_name), '') into v_caller_name
  from public.profiles p
  where p.id = v_caller;

  insert into public.social_nudges (user_id, kind, payload)
  values (
    p_to_user_id,
    'kudos_received',
    jsonb_build_object(
      'count', 1,
      'peerDisplayName', v_caller_name
    )
  );

  return true;
end;
$$;

comment on function public.give_kudos is
  'Salue la séance du jour d''un coéquipier opt-in et enfile un nudge '
  'kudos_received immédiat. Idempotent : un second appel ne recrée ni kudos '
  'ni nudge. Le client n''a jamais besoin d''un identifiant de séance.';

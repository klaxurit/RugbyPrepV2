-- Gamification — attribution des kudos sans exposer d'identifiant de séance.
--
-- La table `kudos` référence `session_log_id` : un kudos porte sur une séance
-- réelle, ce qui empêche de saluer une activité qui n'a pas eu lieu. Mais le
-- client ne doit pas connaître les identifiants de séance de ses coéquipiers,
-- et aucune RPC de classement ne les expose.
--
-- On résout les deux contraintes ici : le client n'envoie que l'identifiant de
-- l'athlète salué, et le serveur choisit lui-même la séance concernée (la plus
-- récente de la semaine). La contrainte d'unicité (from_user_id,
-- session_log_id) rend l'appel idempotent : un second kudos sur la même
-- semaine ne crée rien.

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

  -- Les deux athlètes doivent être opt-in : on ne salue pas quelqu'un qui n'a
  -- pas accepté d'être visible, et on ne participe pas au social en restant
  -- soi-même invisible.
  if not public.gamification_is_exposable(v_caller, 'club') then
    return false;
  end if;

  if not public.gamification_is_exposable(p_to_user_id, 'club') then
    return false;
  end if;

  -- Un kudos ne peut porter que sur une séance réellement enregistrée.
  select sl.id into v_log
  from public.session_logs sl
  where sl.user_id = p_to_user_id
    and sl.date_iso >= v_week
    and sl.date_iso < v_week + 7
  order by sl.date_iso desc, sl.created_at desc
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

revoke all on function public.give_kudos(uuid, date) from public;
grant execute on function public.give_kudos(uuid, date) to authenticated;

-- ─── RPC : kudos déjà donnés cette semaine ────────────────────
-- Permet à l'UI de rendre le bouton inactif au lieu de laisser croire à un
-- envoi qui sera silencieusement ignoré.

create or replace function public.get_kudos_given(
  p_week_start date default null
)
returns table (to_user_id uuid)
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
  select distinct k.to_user_id
  from public.kudos k
  where k.from_user_id = v_caller
    and k.created_at >= v_week::timestamptz
    and k.created_at < (v_week + 7)::timestamptz;
end;
$$;

comment on function public.get_kudos_given is
  'Athlètes déjà salués par l''appelant cette semaine, pour l''état du bouton.';

revoke all on function public.get_kudos_given(date) from public;
grant execute on function public.get_kudos_given(date) to authenticated;

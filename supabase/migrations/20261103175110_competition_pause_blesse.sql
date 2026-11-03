-- Pause compétition déclarée (« Blessé ») + RPC client.
--
-- Non médical : gel des malus / relégations d'inactivité de la ligue.
-- Aucune localisation, diagnostic ou donnée de santé. Cap 28 jours.
-- L'écriture reste limitée : le client ne peut pas toucher XP / points /
-- league_tier — seulement activer ou lever sa propre pause via RPC.

alter table public.user_gamification_profile
  add column if not exists competition_pause_kind text
    check (
      competition_pause_kind is null
      or competition_pause_kind in ('blesse')
    ),
  add column if not exists competition_pause_started_on date,
  add column if not exists competition_pause_ends_on date;

comment on column public.user_gamification_profile.competition_pause_kind is
  'Pause compétition déclarée (blesse). Pas un suivi médical.';

comment on column public.user_gamification_profile.competition_pause_ends_on is
  'Fin inclusive de la pause. Au-delà, le bouclier anti-relég expire.';

create or replace function public.set_competition_pause(p_active boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_today date := (timezone('utc', now()))::date;
  v_ends date;
  v_row public.user_gamification_profile%rowtype;
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;

  -- Garantit une ligne profil (créée au premier recompute sinon).
  insert into public.user_gamification_profile (user_id)
  values (v_caller)
  on conflict (user_id) do nothing;

  if coalesce(p_active, false) then
    v_ends := v_today + 27; -- 28 jours inclusifs
    update public.user_gamification_profile
    set
      competition_pause_kind = 'blesse',
      competition_pause_started_on = v_today,
      competition_pause_ends_on = v_ends
    where user_id = v_caller
    returning * into v_row;
  else
    update public.user_gamification_profile
    set
      competition_pause_kind = null,
      competition_pause_started_on = null,
      competition_pause_ends_on = null
    where user_id = v_caller
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'kind', v_row.competition_pause_kind,
    'startedOn', v_row.competition_pause_started_on,
    'endsOn', v_row.competition_pause_ends_on
  );
end;
$$;

comment on function public.set_competition_pause is
  'Active ou lève une pause compétition « Blessé » (max 28 j). '
  'Bouclier ligue uniquement — pas de donnée médicale.';

revoke all on function public.set_competition_pause(boolean) from public;
grant execute on function public.set_competition_pause(boolean) to authenticated;

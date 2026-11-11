-- Pause « Blessé » ouverte : plus de cap 28 j.
-- On ne peut pas prévoir la durée d'une blessure — la pause dure
-- jusqu'à levée manuelle (ends_on = null).

comment on column public.user_gamification_profile.competition_pause_ends_on is
  'Fin inclusive optionnelle (legacy). Null = jusqu’à levée manuelle.';

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
  v_row public.user_gamification_profile%rowtype;
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;

  insert into public.user_gamification_profile (user_id)
  values (v_caller)
  on conflict (user_id) do nothing;

  if coalesce(p_active, false) then
    update public.user_gamification_profile
    set
      competition_pause_kind = 'blesse',
      competition_pause_started_on = v_today,
      competition_pause_ends_on = null
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
  'Active ou lève une pause compétition « Blessé » (ouverte jusqu’à levée). '
  'Bouclier ligue uniquement — pas de donnée médicale.';

-- Pauses déjà actives : retirer le plafond calendaire restant.
update public.user_gamification_profile
set competition_pause_ends_on = null
where competition_pause_kind is not null
  and competition_pause_ends_on is not null;

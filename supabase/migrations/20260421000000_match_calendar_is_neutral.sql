-- Ajout colonne is_neutral pour les matchs joués sur terrain neutre
-- (ex : finales playoffs). Prend priorité sur is_home dans l'UI.
-- Default false pour préserver le comportement existant.

alter table public.match_calendar
  add column if not exists is_neutral boolean not null default false;

comment on column public.match_calendar.is_neutral is
  'Terrain neutre (ex: finale playoffs, barrage). Si true, prend priorité sur is_home dans l''UI.';

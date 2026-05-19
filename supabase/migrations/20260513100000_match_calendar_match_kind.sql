-- Contexte match après ajout manuel : championnat / amical / coupe ou phase finale
alter table public.match_calendar
  add column if not exists match_kind text
    check (match_kind is null or match_kind in ('league', 'friendly', 'cup_final'));

comment on column public.match_calendar.match_kind is
  'Classifications métier post-ajout : league=reprise saison, cup_final=playoffs taper, friendly=hors compétition.';

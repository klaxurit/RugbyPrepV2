-- FFR sync enrichment: persist journée label and match state from GraphQL

alter table public.match_calendar
  add column if not exists journee_name text,
  add column if not exists match_status text;

comment on column public.match_calendar.journee_name is
  'FFR Journee.nom at last sync (e.g. Journée 12, Demi-finale).';
comment on column public.match_calendar.match_status is
  'FFR Etat.nom at last sync (e.g. Jouée, Reportée).';

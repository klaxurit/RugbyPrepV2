-- Scores officiels FFR (locale / visiteur) pour affichage post-match.

alter table public.match_calendar
  add column if not exists ffr_score_locale integer,
  add column if not exists ffr_score_visiteur integer,
  add column if not exists ffr_score_valid boolean not null default false;

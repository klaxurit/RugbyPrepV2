-- Athlete match participation (coach-ready). Load = 0 when not_selected / did_not_play.
ALTER TABLE public.match_calendar
  ADD COLUMN IF NOT EXISTS participation_status text
  CHECK (participation_status IS NULL OR participation_status IN ('played', 'not_selected', 'did_not_play'));

COMMENT ON COLUMN public.match_calendar.participation_status IS
  'Athlete match participation: played | not_selected | did_not_play. Load = 0 when not played.';

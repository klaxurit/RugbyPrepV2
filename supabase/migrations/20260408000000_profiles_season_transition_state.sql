ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS season_transition_state JSONB DEFAULT NULL;

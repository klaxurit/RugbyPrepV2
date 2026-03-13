-- Migration: population-aware profile fields for program safety contracts (P0)

alter table public.profiles
  add column if not exists population_segment text check (population_segment in ('male_senior', 'female_senior', 'u18_female', 'u18_male', 'unknown')),
  add column if not exists age_band text check (age_band in ('u18', 'adult')),
  add column if not exists parental_consent_health_data boolean,
  add column if not exists adult_play_eligibility_approved boolean,
  add column if not exists maturity_status text check (maturity_status in ('pre_phv', 'circa_phv', 'post_phv', 'unknown')),
  add column if not exists cycle_tracking_opt_in boolean,
  add column if not exists cycle_symptom_score_today integer check (cycle_symptom_score_today between 0 and 3),
  add column if not exists prevention_sessions_week integer,
  add column if not exists weekly_load_context jsonb;

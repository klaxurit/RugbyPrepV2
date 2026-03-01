-- Migration: Add training_level and season_mode to profiles
-- training_level: 'starter' | 'builder' | 'performance' (default = 'performance')
-- season_mode:    'in_season' | 'off_season' | 'pre_season' (default = 'in_season')

alter table public.profiles
  add column if not exists training_level text check (training_level in ('starter', 'builder', 'performance')),
  add column if not exists season_mode    text check (season_mode in ('in_season', 'off_season', 'pre_season'));

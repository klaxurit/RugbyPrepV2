-- Add RPE and duration columns to match_calendar for ACWR match load tracking
alter table public.match_calendar
  add column if not exists rpe          integer check (rpe >= 1 and rpe <= 10),
  add column if not exists duration_min integer check (duration_min > 0);

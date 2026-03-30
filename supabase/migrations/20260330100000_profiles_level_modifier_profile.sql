-- Add missing level_modifier_profile column to profiles
alter table public.profiles
  add column if not exists level_modifier_profile jsonb default null;

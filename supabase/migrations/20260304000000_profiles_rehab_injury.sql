-- Migration: add rehab_injury JSONB column to profiles
alter table public.profiles
  add column if not exists rehab_injury jsonb default null;

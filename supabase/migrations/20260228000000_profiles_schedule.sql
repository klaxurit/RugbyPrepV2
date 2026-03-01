-- Migration: add club_schedule and sc_schedule JSONB columns to profiles
-- These store the user's club training days and computed S&C schedule

alter table public.profiles
  add column if not exists club_schedule  jsonb,
  add column if not exists sc_schedule    jsonb;

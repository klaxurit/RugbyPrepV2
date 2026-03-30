-- Add missing created_at column to profiles
alter table public.profiles
  add column if not exists created_at timestamptz default now();

-- Migration: performance focus selector for speed/strength routing

alter table public.profiles
  add column if not exists performance_focus text check (performance_focus in ('balanced', 'speed', 'strength'));


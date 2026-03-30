alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists avatar_url text;

-- Nom affiché du joueur (signup auth metadata), visible par le staff du club.
alter table public.profiles
  add column if not exists display_name text;

comment on column public.profiles.display_name is
  'Prénom / nom affiché (copie de auth.users.raw_user_meta_data.display_name).';

update public.profiles p
set display_name = nullif(trim(u.raw_user_meta_data->>'display_name'), '')
from auth.users u
where u.id = p.id
  and (p.display_name is null or trim(p.display_name) = '')
  and nullif(trim(u.raw_user_meta_data->>'display_name'), '') is not null;

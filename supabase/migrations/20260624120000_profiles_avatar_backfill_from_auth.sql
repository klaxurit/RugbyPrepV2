-- Copie avatar auth → profiles pour que le staff puisse afficher les photos des joueurs.
update public.profiles p
set
  avatar_path = coalesce(
    nullif(trim(p.avatar_path), ''),
    nullif(trim(u.raw_user_meta_data->>'avatar_path'), '')
  ),
  avatar_url = coalesce(
    nullif(trim(p.avatar_url), ''),
    nullif(trim(u.raw_user_meta_data->>'avatar_url'), '')
  )
from auth.users u
where u.id = p.id
  and (
    (p.avatar_url is null and nullif(trim(u.raw_user_meta_data->>'avatar_url'), '') is not null)
    or (p.avatar_path is null and nullif(trim(u.raw_user_meta_data->>'avatar_path'), '') is not null)
  );

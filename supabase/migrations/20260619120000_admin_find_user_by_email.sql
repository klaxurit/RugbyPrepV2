-- Helper service_role : résolution email → user id pour le panneau admin (edge function).
create or replace function public.admin_find_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.admin_find_user_id_by_email(text) from public;
grant execute on function public.admin_find_user_id_by_email(text) to service_role;

comment on function public.admin_find_user_id_by_email(text) is
  'Service-role only : lookup auth.users.id par email (panneau admin).';

-- Harden admin RPCs: never callable with the public anon key (APK / web).
-- History already had REVOKE FROM PUBLIC + GRANT TO service_role, but
-- anon/authenticated can still hold EXECUTE if granted directly.
-- Admin panel uses the Edge Function service_role client only.

revoke all on function public.admin_find_user_id_by_email(text) from public, anon, authenticated;
revoke all on function public.admin_list_users_page(integer, integer, text) from public, anon, authenticated;
revoke all on function public.grant_premium_to_tester(uuid) from public, anon, authenticated;
revoke all on function public.revoke_premium_from_tester(uuid) from public, anon, authenticated;

grant execute on function public.admin_find_user_id_by_email(text) to service_role;
grant execute on function public.admin_list_users_page(integer, integer, text) to service_role;
grant execute on function public.grant_premium_to_tester(uuid) to service_role;
grant execute on function public.revoke_premium_from_tester(uuid) to service_role;

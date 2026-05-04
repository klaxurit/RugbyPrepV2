-- Helpers admin pour accorder/révoquer un accès premium "à vie" à un testeur.
--
-- Insère toutes les entitlement keys (basic + premium) avec
--   source = 'admin'  → permet de filtrer/identifier les grants manuels
--   status = 'active'
--   expires_at = NULL → l'accès est permanent tant que `revoke` n'est pas appelé
--
-- Pas de souscription Stripe / Play Store associée. Le hook `useEntitlements`
-- côté client allume `isPremium` dès qu'au moins une entitlement key dans
-- PREMIUM_HINTS est active — donc les rows insérées ici suffisent.
--
-- Sécurité (defense-in-depth) :
--   1. SECURITY DEFINER : la fonction tourne avec les droits du créateur
--      (postgres), pas du caller — utile pour insérer dans des tables
--      protégées par RLS.
--   2. set search_path = public : protège contre les attaques de
--      search-path quand SECURITY DEFINER.
--   3. Check auth.role() : bloque explicitement les appels via PostgREST
--      avec rôle 'authenticated' ou 'anon' (un user authentifié ne pourrait
--      pas s'auto-promouvoir premium en appelant rpc).
--   4. revoke execute from public + grant execute to service_role :
--      verrou Postgres natif, double rideau.
--
-- Usage (depuis le SQL editor Supabase, en tant que postgres) :
--   select public.grant_premium_to_tester(id)
--     from auth.users where email = 'testeur@example.com';
--   select public.revoke_premium_from_tester(id)
--     from auth.users where email = 'testeur@example.com';

create or replace function public.grant_premium_to_tester(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() in ('authenticated', 'anon') then
    raise exception 'forbidden: admin/service_role only';
  end if;

  insert into public.user_entitlements (user_id, entitlement_key, source, status, expires_at)
  select target_user_id, k, 'admin', 'active', null
  from unnest(array[
    'program_basic',
    'notifications_basic',
    'calendar_basic',
    'athletic_tests_basic',
    'premium_logging',
    'premium_program_adaptations',
    'advanced_notifications',
    'premium_analytics',
    'coach_mode',
    'priority_support'
  ]) as k
  on conflict (user_id, entitlement_key) do update
    set status = 'active',
        expires_at = null,
        source = 'admin',
        updated_at = now();
end;
$$;

create or replace function public.revoke_premium_from_tester(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() in ('authenticated', 'anon') then
    raise exception 'forbidden: admin/service_role only';
  end if;

  -- On ne supprime QUE les rows posées par grant_premium_to_tester
  -- (source = 'admin' + clés premium). Les entitlements basic restent —
  -- ils sont aussi accordés via le plan 'free' au quotidien et leur
  -- suppression ici casserait l'app pour le testeur.
  delete from public.user_entitlements
  where user_id = target_user_id
    and source = 'admin'
    and entitlement_key in (
      'premium_logging',
      'premium_program_adaptations',
      'advanced_notifications',
      'premium_analytics',
      'coach_mode',
      'priority_support'
    );
end;
$$;

-- Verrou Postgres : seul service_role (et postgres implicitement) peut
-- appeler ces fonctions. PostgREST refusera les appels rpc des users
-- authenticated/anon avec une erreur 401/403.
revoke execute on function public.grant_premium_to_tester(uuid) from public;
revoke execute on function public.revoke_premium_from_tester(uuid) from public;
grant execute on function public.grant_premium_to_tester(uuid) to service_role;
grant execute on function public.revoke_premium_from_tester(uuid) to service_role;

comment on function public.grant_premium_to_tester(uuid) is
  'Admin-only : accorde toutes les entitlement keys (basic + premium) à un user, sans expiration. Source = admin. Idempotent (upsert).';
comment on function public.revoke_premium_from_tester(uuid) is
  'Admin-only : retire les entitlements premium accordés via grant_premium_to_tester. Conserve les entitlements basic.';

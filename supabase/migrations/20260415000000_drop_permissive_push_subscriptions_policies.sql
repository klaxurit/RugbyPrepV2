-- Remove legacy permissive write policies on push_subscriptions.
-- All client writes now go through secure Edge Functions
-- (register-push-subscription, unsubscribe-push).
DROP POLICY IF EXISTS "allow_insert_subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "allow_upsert_subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "allow_delete_subscription" ON public.push_subscriptions;

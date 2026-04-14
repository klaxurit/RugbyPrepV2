-- Add premium_logging entitlement to both premium plans
INSERT INTO public.plan_entitlements (plan_id, entitlement_key)
VALUES
  ('premium_monthly', 'premium_logging'),
  ('premium_yearly', 'premium_logging')
ON CONFLICT (plan_id, entitlement_key) DO NOTHING;

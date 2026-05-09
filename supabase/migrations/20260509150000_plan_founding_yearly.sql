-- WS0 Décision #52 — Founding plan (49€/an à vie, pre-sale offer post-D2 + first session)
--
-- Le plan founding_yearly est un tier dérivé de premium_yearly (mêmes entitlements)
-- avec un prix réduit garanti à vie pour les early adopters. Il ne se reconvertit
-- jamais en premium_yearly standard : un user founding paie 49€/an aussi longtemps
-- qu'il maintient son abonnement.
--
-- Trigger UX (frontend) : created_at + 24h écoulé ET ≥ 1 session_log ET pas
-- déjà premium ET pas dismissed. Routing checkout : Android Play Billing
-- (productId rugbyforge.founding.yearly), iOS PWA / web Stripe (price ID
-- configuré via STRIPE_PRICE_FOUNDING_YEARLY secret Supabase).

INSERT INTO public.plans (id, name, billing_interval, price_cents, currency, is_active, metadata)
VALUES
  ('founding_yearly', 'Founding (49€/an à vie)', 'year', 4900, 'eur', true, '{"tier":"founding","lifetime_price":true}'::jsonb)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  billing_interval = EXCLUDED.billing_interval,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Founding hérite de tous les entitlements premium_yearly (parité fonctionnelle).
INSERT INTO public.plan_entitlements (plan_id, entitlement_key)
VALUES
  ('founding_yearly', 'program_basic'),
  ('founding_yearly', 'notifications_basic'),
  ('founding_yearly', 'calendar_basic'),
  ('founding_yearly', 'athletic_tests_basic'),
  ('founding_yearly', 'premium_program_adaptations'),
  ('founding_yearly', 'advanced_notifications'),
  ('founding_yearly', 'premium_analytics'),
  ('founding_yearly', 'coach_mode'),
  ('founding_yearly', 'priority_support'),
  ('founding_yearly', 'premium_logging')
ON CONFLICT (plan_id, entitlement_key) DO NOTHING;

-- WS0 follow-up — Pricing realignment (V1 final pricing)
--
-- premium_monthly : 9.99€ → 5.99€ (599 cents)
-- premium_yearly  : 99.90€ → 64.99€ (6499 cents) — soit ~10% de remise
--                   par rapport à 12 × 5.99 = 71.88€
-- founding_yearly : inchangé à 49€ à vie (4900 cents) — Décision #52
--
-- ATTENTION : un Stripe Price object n'est pas modifiable. Il faut créer
-- DEUX nouveaux Price objects côté Stripe Dashboard (un pour chaque plan)
-- puis mettre à jour les secrets Supabase :
--   STRIPE_PRICE_PREMIUM_MONTHLY = price_xxx (599 EUR/month)
--   STRIPE_PRICE_PREMIUM_YEARLY  = price_xxx (6499 EUR/year)
-- Sinon le checkout Stripe continuera de débiter aux anciens montants.

UPDATE public.plans
SET price_cents = 599
WHERE id = 'premium_monthly';

UPDATE public.plans
SET price_cents = 6499
WHERE id = 'premium_yearly';

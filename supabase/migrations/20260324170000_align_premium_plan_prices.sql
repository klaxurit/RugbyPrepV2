-- Align premium plan prices with the public pricing shown on the landing page.
-- Source of truth in-app should match:
-- premium_monthly = 5.99 EUR
-- premium_yearly  = 47.99 EUR

update public.plans
set
  price_cents = case id
    when 'premium_monthly' then 599
    when 'premium_yearly' then 4799
    else price_cents
  end,
  updated_at = now()
where id in ('premium_monthly', 'premium_yearly');

-- Backend foundation for notifications, plans, premium entitlements and auditability.
-- This migration is additive: it prepares the secure server paths without breaking
-- the current client flows. Legacy direct writes can be removed after the frontend
-- is migrated to the new Edge Functions.

-- ─── plans ─────────────────────────────────────────────────────

create table if not exists public.plans (
  id text primary key,
  name text not null,
  billing_interval text not null check (billing_interval in ('one_time', 'month', 'year')),
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'eur',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'plans'
      and policyname = 'Anyone can read plans'
  ) then
    create policy "Anyone can read plans"
      on public.plans for select
      using (true);
  end if;
end $$;

drop trigger if exists plans_updated_at on public.plans;
create trigger plans_updated_at
  before update on public.plans
  for each row execute function update_updated_at_column();

insert into public.plans (id, name, billing_interval, price_cents, currency, is_active, metadata)
values
  ('free', 'Free', 'month', 0, 'eur', true, '{"tier":"free"}'::jsonb),
  ('premium_monthly', 'Premium Mensuel', 'month', 999, 'eur', true, '{"tier":"premium"}'::jsonb),
  ('premium_yearly', 'Premium Annuel', 'year', 9990, 'eur', true, '{"tier":"premium"}'::jsonb)
on conflict (id) do update
set
  name = excluded.name,
  billing_interval = excluded.billing_interval,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  is_active = excluded.is_active,
  metadata = excluded.metadata;

-- ─── plan_entitlements ────────────────────────────────────────

create table if not exists public.plan_entitlements (
  plan_id text not null references public.plans(id) on delete cascade,
  entitlement_key text not null,
  created_at timestamptz not null default now(),
  primary key (plan_id, entitlement_key)
);

alter table public.plan_entitlements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_entitlements'
      and policyname = 'Anyone can read plan entitlements'
  ) then
    create policy "Anyone can read plan entitlements"
      on public.plan_entitlements for select
      using (true);
  end if;
end $$;

insert into public.plan_entitlements (plan_id, entitlement_key)
values
  ('free', 'program_basic'),
  ('free', 'notifications_basic'),
  ('free', 'calendar_basic'),
  ('free', 'athletic_tests_basic'),
  ('premium_monthly', 'program_basic'),
  ('premium_monthly', 'notifications_basic'),
  ('premium_monthly', 'calendar_basic'),
  ('premium_monthly', 'athletic_tests_basic'),
  ('premium_monthly', 'premium_program_adaptations'),
  ('premium_monthly', 'advanced_notifications'),
  ('premium_monthly', 'premium_analytics'),
  ('premium_monthly', 'coach_mode'),
  ('premium_monthly', 'priority_support'),
  ('premium_yearly', 'program_basic'),
  ('premium_yearly', 'notifications_basic'),
  ('premium_yearly', 'calendar_basic'),
  ('premium_yearly', 'athletic_tests_basic'),
  ('premium_yearly', 'premium_program_adaptations'),
  ('premium_yearly', 'advanced_notifications'),
  ('premium_yearly', 'premium_analytics'),
  ('premium_yearly', 'coach_mode'),
  ('premium_yearly', 'priority_support')
on conflict do nothing;

-- ─── user_subscriptions ───────────────────────────────────────

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(id),
  provider text not null default 'manual' check (provider in ('manual', 'stripe', 'app_store', 'play_store')),
  provider_customer_id text,
  provider_subscription_id text,
  status text not null check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_subscriptions_provider_subscription_id_idx
  on public.user_subscriptions(provider, provider_subscription_id)
  where provider_subscription_id is not null;

create unique index if not exists user_subscriptions_user_provider_idx
  on public.user_subscriptions(user_id, provider);

create index if not exists user_subscriptions_user_status_idx
  on public.user_subscriptions(user_id, status, current_period_end desc);

alter table public.user_subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_subscriptions'
      and policyname = 'Users read own subscriptions'
  ) then
    create policy "Users read own subscriptions"
      on public.user_subscriptions for select
      using (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists user_subscriptions_updated_at on public.user_subscriptions;
create trigger user_subscriptions_updated_at
  before update on public.user_subscriptions
  for each row execute function update_updated_at_column();

-- ─── user_entitlements ────────────────────────────────────────

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null,
  source text not null check (source in ('plan', 'billing', 'admin', 'promo')),
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entitlement_key)
);

create index if not exists user_entitlements_user_status_idx
  on public.user_entitlements(user_id, status, entitlement_key);

alter table public.user_entitlements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_entitlements'
      and policyname = 'Users read own entitlements'
  ) then
    create policy "Users read own entitlements"
      on public.user_entitlements for select
      using (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists user_entitlements_updated_at on public.user_entitlements;
create trigger user_entitlements_updated_at
  before update on public.user_entitlements
  for each row execute function update_updated_at_column();

create or replace function public.grant_default_free_entitlements(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_entitlements (
    user_id,
    entitlement_key,
    source,
    status,
    metadata
  )
  select
    target_user_id,
    plan_entitlements.entitlement_key,
    'plan',
    'active',
    jsonb_build_object('plan_id', 'free')
  from public.plan_entitlements
  where plan_entitlements.plan_id = 'free'
  on conflict (user_id, entitlement_key) do nothing;
end;
$$;

revoke all on function public.grant_default_free_entitlements(uuid) from public, anon, authenticated;
grant execute on function public.grant_default_free_entitlements(uuid) to service_role;

create or replace function public.handle_profile_created_grant_free_entitlements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.grant_default_free_entitlements(new.id);
  return new;
end;
$$;

revoke all on function public.handle_profile_created_grant_free_entitlements() from public, anon, authenticated;

drop trigger if exists profiles_grant_free_entitlements on public.profiles;
create trigger profiles_grant_free_entitlements
  after insert on public.profiles
  for each row execute function public.handle_profile_created_grant_free_entitlements();

insert into public.user_entitlements (
  user_id,
  entitlement_key,
  source,
  status,
  metadata
)
select
  profiles.id,
  plan_entitlements.entitlement_key,
  'plan',
  'active',
  jsonb_build_object('plan_id', 'free')
from public.profiles
join public.plan_entitlements
  on plan_entitlements.plan_id = 'free'
on conflict (user_id, entitlement_key) do nothing;

-- ─── notification_preferences ─────────────────────────────────

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default false,
  training_reminder_enabled boolean not null default true,
  safety_alerts_enabled boolean not null default true,
  reminder_hour integer not null default 7 check (reminder_hour between 0 and 23),
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '07:00',
  training_day_only boolean not null default true,
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_preferences'
      and policyname = 'Users manage own notification preferences'
  ) then
    create policy "Users manage own notification preferences"
      on public.notification_preferences for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists notification_preferences_updated_at on public.notification_preferences;
create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function update_updated_at_column();

-- ─── push_subscriptions extension ─────────────────────────────

alter table public.push_subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists user_agent text;

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id, is_active);

create index if not exists push_subscriptions_active_days_idx
  on public.push_subscriptions using gin (training_days)
  where is_active = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
      and policyname = 'Users read own push subscriptions'
  ) then
    create policy "Users read own push subscriptions"
      on public.push_subscriptions for select
      using (user_id is not null and auth.uid() = user_id);
  end if;
end $$;

-- Legacy permissive write policies remain temporarily to avoid breaking the
-- current client. Remove them after the frontend is migrated to secure Edge Functions.

-- ─── notification_delivery_logs ───────────────────────────────

create table if not exists public.notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  push_subscription_id uuid references public.push_subscriptions(id) on delete set null,
  template_key text not null,
  channel text not null check (channel in ('push', 'email', 'in_app')),
  status text not null check (status in ('queued', 'sent', 'failed', 'skipped', 'expired')),
  scheduled_for timestamptz,
  delivered_at timestamptz,
  skipped_reason text,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notification_delivery_logs_user_idx
  on public.notification_delivery_logs(user_id, created_at desc);

create index if not exists notification_delivery_logs_status_idx
  on public.notification_delivery_logs(status, created_at desc);

alter table public.notification_delivery_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_delivery_logs'
      and policyname = 'Users read own notification logs'
  ) then
    create policy "Users read own notification logs"
      on public.notification_delivery_logs for select
      using (user_id is not null and auth.uid() = user_id);
  end if;
end $$;

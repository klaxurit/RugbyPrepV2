-- Decision #23 — Billing idempotence ledger + grant_billing_entitlements RPC
--
-- WHY: 4 Edge Functions (verify-play-purchase, billing-webhook,
-- sync-checkout-session, refresh-play-subscription) currently mutate billing
-- state via separate UPSERT + DELETE + INSERT statements. This creates:
--   * Race window where user has zero entitlements mid-transaction
--   * Account takeover via leaked play_store purchaseToken (no UNIQUE)
--   * 3-day Stripe replay grants Premium repeatedly (no event_id dedup)
--   * Out-of-order events overwriting fresher state
--   * checkout.session.completed with NULL current_period_end → infinite Premium
--
-- WHAT: Single source-of-truth RPC `grant_billing_entitlements` with:
--   * processed_billing_events ledger keyed (provider, event_id) — replay reject
--   * provider_event_created_at — stale-event reject vs same subscription
--   * provider_purchase_token dedicated column + partial UNIQUE — token binding
--   * plan_id-driven entitlement set reconciliation (NOT caller-supplied keys)
--   * Free entitlement restoration on canceled/expired/inactive
--
-- Hardening: SECURITY INVOKER (caller is service-role, no privilege expansion).
-- Caller-controlled p_entitlement_keys[] removed → derived from plan_entitlements.

begin;

-- ─── 0. Preflight assertion ───────────────────────────────────────────
-- Fails loudly if existing play_store rows have duplicate purchase tokens
-- across the 3 historic key variants the frontend has tolerated. Required
-- because the partial UNIQUE INDEX below would otherwise abort the whole
-- transaction and leave a confusing partial state.
do $$
declare
  v_dups int;
begin
  with tokens as (
    select id, user_id,
      coalesce(
        metadata->>'purchase_token',
        metadata->>'purchaseToken',
        metadata->>'token'
      ) as token
    from public.user_subscriptions
    where provider = 'play_store'
  ),
  grouped as (
    select token, count(*) as c
    from tokens
    where nullif(token, '') is not null
    group by token
    having count(*) > 1
  )
  select count(*) into v_dups from grouped;

  if v_dups > 0 then
    raise exception E'Found % duplicate play_store purchase tokens. '
      'Resolve duplicates before applying this migration. Diagnostic query:\n'
      'with tokens as (select id, user_id, coalesce(metadata->>''purchase_token'', metadata->>''purchaseToken'', metadata->>''token'') as token from public.user_subscriptions where provider = ''play_store'') '
      'select token, count(*), array_agg(id), array_agg(user_id) from tokens where nullif(token, '''') is not null group by token having count(*) > 1;',
      v_dups;
  end if;
end $$;

-- ─── 1. Add dedicated column for play_store purchase token ────────────

alter table public.user_subscriptions
  add column if not exists provider_purchase_token text;

-- Backfill from existing metadata, tolerating the 3 historic key variants
-- the frontend stored under (purchase_token / purchaseToken / token —
-- see src/hooks/usePlayBilling.ts:171).
update public.user_subscriptions
  set provider_purchase_token = coalesce(
    metadata->>'purchase_token',
    metadata->>'purchaseToken',
    metadata->>'token'
  )
  where provider = 'play_store'
    and provider_purchase_token is null
    and (
      metadata ? 'purchase_token'
      or metadata ? 'purchaseToken'
      or metadata ? 'token'
    );

-- Partial UNIQUE: token binding is a security boundary for Play Store only.
-- Stripe doesn't expose an equivalent token; provider_subscription_id covers it.
-- No IF NOT EXISTS — if a same-named relation already exists with a different
-- definition, we want loud failure rather than silent skip.
create unique index user_subscriptions_play_token_uniq_idx
  on public.user_subscriptions(provider_purchase_token)
  where provider = 'play_store' and provider_purchase_token is not null;

-- ─── 2. Idempotence ledger ────────────────────────────────────────────

create table if not exists public.processed_billing_events (
  provider text not null check (provider in ('stripe', 'play_store')),
  event_id text not null,
  provider_subscription_id text,
  provider_event_created_at timestamptz,
  processed_at timestamptz not null default now(),
  primary key (provider, event_id)
);

create index if not exists processed_billing_events_subscription_idx
  on public.processed_billing_events(provider, provider_subscription_id, provider_event_created_at desc)
  where provider_subscription_id is not null;

alter table public.processed_billing_events enable row level security;
-- Intentionally no policies = service role only.

-- ─── 3. grant_billing_entitlements RPC ────────────────────────────────

create or replace function public.grant_billing_entitlements(
  p_provider text,
  p_event_id text,
  p_event_created_at timestamptz,
  p_user_id uuid,
  p_plan_id text,
  p_provider_subscription_id text,
  p_provider_purchase_token text,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_provider_customer_id text default null,
  p_cancel_at_period_end boolean default false,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing_owner uuid;
  v_max_processed_at timestamptz;
  v_inserted int;
  v_granted_keys text[];
begin
  -- Validate inputs
  if p_provider not in ('stripe', 'play_store') then
    raise exception 'invalid provider: %', p_provider using errcode = 'invalid_parameter_value';
  end if;

  if p_status not in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'expired') then
    raise exception 'invalid status: %', p_status using errcode = 'invalid_parameter_value';
  end if;

  if not exists (select 1 from public.plans where id = p_plan_id) then
    raise exception 'unknown plan_id: %', p_plan_id using errcode = 'foreign_key_violation';
  end if;

  -- Defense-in-depth: an active/trialing subscription must carry a period_end.
  -- The Stripe webhook should not call this RPC for checkout.session.completed
  -- before the corresponding subscription event arrives (see Decision #25),
  -- but if it does, we reject rather than create an infinite-Premium row.
  if p_status in ('active', 'trialing') and p_current_period_end is null then
    raise exception 'status % requires non-null current_period_end', p_status
      using errcode = 'check_violation';
  end if;

  -- Per-subscription serialization (transaction-scoped advisory lock).
  -- Without this, two concurrent calls for different events on the SAME
  -- subscription can both pass the stale-event check (they each see only
  -- committed rows up to that point), and the older one's UPDATE may land
  -- last in wall clock, overwriting fresher state. The advisory lock
  -- forces them to serialize so the stale check is authoritative.
  -- Lock is auto-released at transaction end. No-op when no subscription_id.
  if p_provider_subscription_id is not null then
    perform pg_advisory_xact_lock(
      hashtextextended(p_provider || ':' || p_provider_subscription_id, 0)
    );
  end if;

  -- 1. Idempotence gate — replay protection on (provider, event_id)
  insert into public.processed_billing_events (
    provider, event_id, provider_subscription_id, provider_event_created_at
  )
  values (p_provider, p_event_id, p_provider_subscription_id, p_event_created_at)
  on conflict (provider, event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return jsonb_build_object('result', 'already_processed', 'event_id', p_event_id);
  end if;

  -- 2. Stale-event protection — reject if a fresher event for the same
  -- subscription has already been processed. Prevents older Stripe/Play
  -- events from overwriting current state when delivered out of order.
  if p_provider_subscription_id is not null and p_event_created_at is not null then
    select max(provider_event_created_at) into v_max_processed_at
    from public.processed_billing_events
    where provider = p_provider
      and provider_subscription_id = p_provider_subscription_id
      and event_id != p_event_id
      and provider_event_created_at is not null;

    if v_max_processed_at is not null and p_event_created_at < v_max_processed_at then
      -- Roll back the ledger insert so a fresher version with the same event_id
      -- (unlikely but defensible) isn't preempted. Use a savepoint instead?
      -- Simpler: just return; the ledger row stays as audit trail.
      return jsonb_build_object(
        'result', 'stale_event_rejected',
        'event_id', p_event_id,
        'max_processed_at', v_max_processed_at
      );
    end if;
  end if;

  -- 3. Token binding (play_store only) — reject if leaked token bound to
  -- another user. Account takeover protection.
  if p_provider = 'play_store' and p_provider_purchase_token is not null then
    select user_id into v_existing_owner
    from public.user_subscriptions
    where provider_purchase_token = p_provider_purchase_token
      and provider = 'play_store'
    limit 1;

    if v_existing_owner is not null and v_existing_owner != p_user_id then
      raise exception 'purchase_token already bound to another user'
        using errcode = 'unique_violation';
    end if;
  end if;

  -- 4. Upsert subscription. ON CONFLICT key = (provider, provider_subscription_id)
  -- which is the only stable identity across events.
  insert into public.user_subscriptions (
    user_id, plan_id, provider, provider_customer_id,
    provider_subscription_id, provider_purchase_token,
    status, current_period_start, current_period_end,
    cancel_at_period_end, metadata
  )
  values (
    p_user_id, p_plan_id, p_provider, p_provider_customer_id,
    p_provider_subscription_id, p_provider_purchase_token,
    p_status, p_current_period_start, p_current_period_end,
    coalesce(p_cancel_at_period_end, false), coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (provider, provider_subscription_id) where provider_subscription_id is not null
  do update set
    plan_id = excluded.plan_id,
    provider_customer_id = coalesce(excluded.provider_customer_id, user_subscriptions.provider_customer_id),
    provider_purchase_token = coalesce(excluded.provider_purchase_token, user_subscriptions.provider_purchase_token),
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    metadata = user_subscriptions.metadata || excluded.metadata,
    updated_at = now();

  -- 5. Reconcile entitlements based on plan_id (NOT caller-supplied keys).
  if p_status in ('active', 'trialing') then
    -- Delete billing keys not in target plan (handles plan switch / downgrade)
    delete from public.user_entitlements
    where user_id = p_user_id
      and source = 'billing'
      and entitlement_key not in (
        select entitlement_key from public.plan_entitlements where plan_id = p_plan_id
      );

    -- Upsert desired keys. UNIQUE on (user_id, entitlement_key) means a
    -- pre-existing 'plan' (free) row gets flipped to 'billing' here. That's
    -- intentional — on cancel we restore via grant_default_free_entitlements.
    insert into public.user_entitlements (
      user_id, entitlement_key, source, status, expires_at, metadata
    )
    select
      p_user_id, pe.entitlement_key, 'billing', 'active',
      p_current_period_end,
      jsonb_build_object('plan_id', p_plan_id, 'provider', p_provider)
    from public.plan_entitlements pe
    where pe.plan_id = p_plan_id
    on conflict (user_id, entitlement_key) do update set
      source = 'billing',
      status = 'active',
      expires_at = excluded.expires_at,
      metadata = user_entitlements.metadata || excluded.metadata,
      updated_at = now();

    select array_agg(entitlement_key) into v_granted_keys
    from public.plan_entitlements
    where plan_id = p_plan_id;
  else
    -- canceled / expired / past_due / inactive
    -- Drop billing entitlements, then restore free baseline.
    delete from public.user_entitlements
    where user_id = p_user_id and source = 'billing';

    perform public.grant_default_free_entitlements(p_user_id);
    v_granted_keys := array[]::text[];
  end if;

  return jsonb_build_object(
    'result', 'granted',
    'event_id', p_event_id,
    'plan_id', p_plan_id,
    'status', p_status,
    'expires_at', p_current_period_end,
    'granted_keys', coalesce(v_granted_keys, array[]::text[])
  );
end;
$$;

revoke all on function public.grant_billing_entitlements(
  text, text, timestamptz, uuid, text, text, text, text,
  timestamptz, timestamptz, text, boolean, jsonb
) from public, anon, authenticated;

grant execute on function public.grant_billing_entitlements(
  text, text, timestamptz, uuid, text, text, text, text,
  timestamptz, timestamptz, text, boolean, jsonb
) to service_role;

comment on function public.grant_billing_entitlements is
  'Single source-of-truth RPC for billing state mutations. Idempotent on '
  '(provider, event_id), rejects stale events vs same subscription, '
  'enforces play_store token binding, derives entitlements from plan_id. '
  'Caller must be service_role. See Decision #23 in docs/release-v1-plan.md.';

commit;

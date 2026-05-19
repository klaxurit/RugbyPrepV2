-- V1.1 — Founding cohort cap (100 distinct users holding founding_yearly)
-- Spec: docs/release-v1-1-plan.md §2.1
--
-- Count = count(distinct user_id) where plan_id = founding_yearly (any status).
-- Canceled founders still occupy a slot (no recycling).
--
-- New RPC get_founding_cohort_stats() for checkout gating + client UI.

begin;

create or replace function public.get_founding_cohort_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cap constant int := 100;
  v_issued int;
begin
  select count(distinct user_id)::int into v_issued
  from public.user_subscriptions
  where plan_id = 'founding_yearly';

  return jsonb_build_object(
    'cap', v_cap,
    'issued', coalesce(v_issued, 0),
    'accepting_new', coalesce(v_issued, 0) < v_cap
  );
end;
$$;

comment on function public.get_founding_cohort_stats() is
  'Aggregate founding cohort occupancy (cap 100). Safe for anon/authenticated read. §2.1 release-v1-1-plan.';

revoke all on function public.get_founding_cohort_stats() from public;
grant execute on function public.get_founding_cohort_stats() to anon, authenticated, service_role;

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
  v_founding_cap constant int := 100;
  v_user_has_founding boolean;
  v_founding_issued int;
begin
  if p_provider not in ('stripe', 'play_store') then
    raise exception 'invalid provider: %', p_provider using errcode = 'invalid_parameter_value';
  end if;

  if p_status not in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'expired') then
    raise exception 'invalid status: %', p_status using errcode = 'invalid_parameter_value';
  end if;

  if not exists (select 1 from public.plans where id = p_plan_id) then
    raise exception 'unknown plan_id: %', p_plan_id using errcode = 'foreign_key_violation';
  end if;

  if p_status in ('active', 'trialing') and p_current_period_end is null then
    raise exception 'status % requires non-null current_period_end', p_status
      using errcode = 'check_violation';
  end if;

  if p_provider_subscription_id is not null then
    perform pg_advisory_xact_lock(
      hashtextextended(p_provider || ':' || p_provider_subscription_id, 0)
    );
  end if;

  insert into public.processed_billing_events (
    provider, event_id, provider_subscription_id, provider_event_created_at
  )
  values (p_provider, p_event_id, p_provider_subscription_id, p_event_created_at)
  on conflict (provider, event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return jsonb_build_object('result', 'already_processed', 'event_id', p_event_id);
  end if;

  if p_provider_subscription_id is not null and p_event_created_at is not null then
    select max(provider_event_created_at) into v_max_processed_at
    from public.processed_billing_events
    where provider = p_provider
      and provider_subscription_id = p_provider_subscription_id
      and event_id != p_event_id
      and provider_event_created_at is not null;

    if v_max_processed_at is not null and p_event_created_at < v_max_processed_at then
      return jsonb_build_object(
        'result', 'stale_event_rejected',
        'event_id', p_event_id,
        'max_processed_at', v_max_processed_at
      );
    end if;
  end if;

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

  -- Founding cohort cap — advisory lock avoids concurrent last-slot races.
  if p_plan_id = 'founding_yearly' and p_status in ('active', 'trialing') then
    perform pg_advisory_xact_lock(hashtextextended('founding_cohort_cap', 0));

    select exists (
      select 1
      from public.user_subscriptions
      where user_id = p_user_id
        and plan_id = 'founding_yearly'
    ) into v_user_has_founding;

    if not coalesce(v_user_has_founding, false) then
      select count(distinct user_id)::int into v_founding_issued
      from public.user_subscriptions
      where plan_id = 'founding_yearly';

      if coalesce(v_founding_issued, 0) >= v_founding_cap then
        raise exception 'founding_cohort_full'
          using errcode = 'P0001';
      end if;
    end if;
  end if;

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

  if p_status in ('active', 'trialing') then
    delete from public.user_entitlements
    where user_id = p_user_id
      and source = 'billing'
      and entitlement_key not in (
        select entitlement_key from public.plan_entitlements where plan_id = p_plan_id
      );

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

comment on function public.grant_billing_entitlements is
  'Single source-of-truth RPC for billing state mutations. Includes founding cohort cap '
  '(100 slots, §2.1). Idempotent on (provider, event_id); founding_cohort_full → SQLSTATE P0001.';

commit;

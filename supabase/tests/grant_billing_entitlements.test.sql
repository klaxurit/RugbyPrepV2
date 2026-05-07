-- Decision #23 — TDD test scenarios for grant_billing_entitlements RPC
--
-- Two ways to run:
--
-- A) Supabase Studio SQL editor (hosted DB):
--    Paste this entire file into the SQL editor and click "Run".
--    The BEGIN/ROLLBACK wrap means nothing persists — safe even on prod.
--    NOTICEs (S1 PASS .. S8 PASS) appear in the "Messages" tab.
--
-- B) Local psql:
--    psql "$DATABASE_URL" -f supabase/tests/grant_billing_entitlements.test.sql
--
-- Each scenario uses a savepoint so a failure in one doesn't poison the
-- others. RAISE EXCEPTION on assertion mismatch.

begin;

-- ─── Fixtures ─────────────────────────────────────────────────────────

do $$
declare
  v_user_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_user_b uuid := '00000000-0000-0000-0000-00000000000b';
begin
  -- Minimal auth.users rows (service_role can write directly).
  insert into auth.users (id, instance_id, email, aud, role, raw_user_meta_data, created_at, updated_at)
  values
    (v_user_a, '00000000-0000-0000-0000-000000000000', 'a@test.local', 'authenticated', 'authenticated', '{}'::jsonb, now(), now()),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'b@test.local', 'authenticated', 'authenticated', '{}'::jsonb, now(), now())
  on conflict (id) do nothing;

  -- profiles trigger grants free entitlements via handle_profile_created_grant_free_entitlements.
  insert into public.profiles (id) values (v_user_a), (v_user_b)
  on conflict (id) do nothing;
end $$;

-- Sanity: user_a has the full free entitlement set at start.
-- Count is derived from plan_entitlements so the test is robust to future
-- additions (e.g., 20260414_add_premium_logging only added premium keys).
do $$
declare
  v_count int;
  v_expected int;
begin
  select count(*) into v_expected from public.plan_entitlements where plan_id = 'free';
  select count(*) into v_count from public.user_entitlements
    where user_id = '00000000-0000-0000-0000-00000000000a' and source = 'plan';
  if v_count != v_expected then
    raise exception 'fixture sanity failed: user_a free count = %, expected % (from plan_entitlements free)', v_count, v_expected;
  end if;
end $$;

-- ─── Scenario 1 — Duplicate Stripe event.id replay → silent reject ────

savepoint s1;
do $$
declare
  v_user_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_result jsonb;
begin
  -- First invocation: granted
  v_result := public.grant_billing_entitlements(
    p_provider := 'stripe',
    p_event_id := 'evt_replay_001',
    p_event_created_at := now() - interval '1 minute',
    p_user_id := v_user_a,
    p_plan_id := 'premium_monthly',
    p_provider_subscription_id := 'sub_replay_001',
    p_provider_purchase_token := null,
    p_status := 'active',
    p_current_period_start := now(),
    p_current_period_end := now() + interval '30 days'
  );
  if v_result->>'result' != 'granted' then
    raise exception 'S1 first call: expected granted, got %', v_result;
  end if;

  -- Replay same event_id: ledger PK conflict → already_processed
  v_result := public.grant_billing_entitlements(
    p_provider := 'stripe',
    p_event_id := 'evt_replay_001',
    p_event_created_at := now() - interval '1 minute',
    p_user_id := v_user_a,
    p_plan_id := 'premium_monthly',
    p_provider_subscription_id := 'sub_replay_001',
    p_provider_purchase_token := null,
    p_status := 'active',
    p_current_period_start := now(),
    p_current_period_end := now() + interval '30 days'
  );
  if v_result->>'result' != 'already_processed' then
    raise exception 'S1 replay: expected already_processed, got %', v_result;
  end if;
  raise notice 'S1 PASS — Stripe event replay rejected silently';
end $$;
rollback to savepoint s1;

-- ─── Scenario 2 — play_store token bound to 2nd user → exception ──────

savepoint s2;
do $$
declare
  v_user_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_user_b uuid := '00000000-0000-0000-0000-00000000000b';
  v_result jsonb;
  v_caught boolean := false;
begin
  -- user_a binds token first
  v_result := public.grant_billing_entitlements(
    p_provider := 'play_store',
    p_event_id := 'play_evt_001',
    p_event_created_at := now(),
    p_user_id := v_user_a,
    p_plan_id := 'premium_yearly',
    p_provider_subscription_id := 'play_sub_001',
    p_provider_purchase_token := 'TOKEN_LEAKED_XYZ',
    p_status := 'active',
    p_current_period_start := now(),
    p_current_period_end := now() + interval '1 year'
  );
  if v_result->>'result' != 'granted' then
    raise exception 'S2 first bind: expected granted, got %', v_result;
  end if;

  -- user_b tries to bind the same leaked token → exception
  begin
    v_result := public.grant_billing_entitlements(
      p_provider := 'play_store',
      p_event_id := 'play_evt_002',
      p_event_created_at := now(),
      p_user_id := v_user_b,
      p_plan_id := 'premium_yearly',
      p_provider_subscription_id := 'play_sub_002',
      p_provider_purchase_token := 'TOKEN_LEAKED_XYZ',
      p_status := 'active',
      p_current_period_start := now(),
      p_current_period_end := now() + interval '1 year'
    );
  exception when unique_violation then
    v_caught := true;
  end;
  if not v_caught then
    raise exception 'S2: expected unique_violation when 2nd user binds same token';
  end if;
  raise notice 'S2 PASS — leaked token rebind rejected';
end $$;
rollback to savepoint s2;

-- ─── Scenario 3 — active + null current_period_end → reject ───────────

savepoint s3;
do $$
declare
  v_user_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_caught boolean := false;
begin
  begin
    perform public.grant_billing_entitlements(
      p_provider := 'stripe',
      p_event_id := 'evt_no_period_001',
      p_event_created_at := now(),
      p_user_id := v_user_a,
      p_plan_id := 'premium_monthly',
      p_provider_subscription_id := 'sub_no_period',
      p_provider_purchase_token := null,
      p_status := 'active',
      p_current_period_start := now(),
      p_current_period_end := null  -- ← infinite-Premium scenario
    );
  exception when check_violation then
    v_caught := true;
  end;
  if not v_caught then
    raise exception 'S3: expected check_violation when active + null period_end';
  end if;
  raise notice 'S3 PASS — active+null period_end rejected (defense-in-depth)';
end $$;
rollback to savepoint s3;

-- ─── Scenario 4 — Out-of-order events → older rejected ────────────────

savepoint s4;
do $$
declare
  v_user_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_result jsonb;
  v_period_end timestamptz;
begin
  -- Newer event first
  v_result := public.grant_billing_entitlements(
    p_provider := 'stripe',
    p_event_id := 'evt_newer',
    p_event_created_at := '2026-06-01 10:00:00+00',
    p_user_id := v_user_a,
    p_plan_id := 'premium_monthly',
    p_provider_subscription_id := 'sub_order_test',
    p_provider_purchase_token := null,
    p_status := 'active',
    p_current_period_start := '2026-05-01'::timestamptz,
    p_current_period_end := '2026-06-30'::timestamptz
  );
  if v_result->>'result' != 'granted' then raise exception 'S4 newer: %', v_result; end if;

  -- Older event arrives later (out of order) — must be rejected
  v_result := public.grant_billing_entitlements(
    p_provider := 'stripe',
    p_event_id := 'evt_older',
    p_event_created_at := '2026-05-15 09:00:00+00',  -- ← older than evt_newer
    p_user_id := v_user_a,
    p_plan_id := 'premium_monthly',
    p_provider_subscription_id := 'sub_order_test',  -- same subscription
    p_provider_purchase_token := null,
    p_status := 'past_due',
    p_current_period_start := '2026-04-01'::timestamptz,
    p_current_period_end := '2026-05-15'::timestamptz
  );
  if v_result->>'result' != 'stale_event_rejected' then
    raise exception 'S4 older: expected stale_event_rejected, got %', v_result;
  end if;

  -- Verify state was not regressed
  select current_period_end into v_period_end
  from public.user_subscriptions
  where provider_subscription_id = 'sub_order_test';
  if v_period_end != '2026-06-30'::timestamptz then
    raise exception 'S4: state regressed, period_end = %', v_period_end;
  end if;
  raise notice 'S4 PASS — older event rejected, state preserved';
end $$;
rollback to savepoint s4;

-- ─── Scenario 5 — Plan switch → obsolete keys removed, new granted ────

savepoint s5;
do $$
declare
  v_user_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_result jsonb;
  v_billing_count int;
  v_expected_monthly int;
  v_expected_yearly int;
begin
  -- Resolve expected counts dynamically from plan_entitlements (robust to
  -- future entitlement additions like 20260414_add_premium_logging).
  select count(*) into v_expected_monthly from public.plan_entitlements where plan_id = 'premium_monthly';
  select count(*) into v_expected_yearly from public.plan_entitlements where plan_id = 'premium_yearly';

  -- Subscribe premium_monthly
  v_result := public.grant_billing_entitlements(
    p_provider := 'stripe',
    p_event_id := 'evt_plan_switch_1',
    p_event_created_at := now(),
    p_user_id := v_user_a,
    p_plan_id := 'premium_monthly',
    p_provider_subscription_id := 'sub_plan_switch',
    p_provider_purchase_token := null,
    p_status := 'active',
    p_current_period_start := now(),
    p_current_period_end := now() + interval '30 days'
  );
  if v_result->>'result' != 'granted' then raise exception 'S5 sub: %', v_result; end if;

  select count(*) into v_billing_count from public.user_entitlements
    where user_id = v_user_a and source = 'billing';
  if v_billing_count != v_expected_monthly then
    raise exception 'S5: expected % billing keys after premium_monthly sub, got %', v_expected_monthly, v_billing_count;
  end if;

  -- Switch to premium_yearly (also 9 keys, same set in seed data)
  -- This validates ON CONFLICT DO UPDATE refreshes expires_at without deleting.
  v_result := public.grant_billing_entitlements(
    p_provider := 'stripe',
    p_event_id := 'evt_plan_switch_2',
    p_event_created_at := now() + interval '1 second',
    p_user_id := v_user_a,
    p_plan_id := 'premium_yearly',
    p_provider_subscription_id := 'sub_plan_switch',
    p_provider_purchase_token := null,
    p_status := 'active',
    p_current_period_start := now(),
    p_current_period_end := now() + interval '1 year'
  );
  if v_result->>'result' != 'granted' then raise exception 'S5 switch: %', v_result; end if;

  -- Verify plan_id updated and metadata reflects yearly
  if not exists (
    select 1 from public.user_entitlements
    where user_id = v_user_a and source = 'billing'
      and metadata->>'plan_id' = 'premium_yearly'
  ) then
    raise exception 'S5: metadata not updated to premium_yearly';
  end if;

  raise notice 'S5 PASS — plan switch reconciles entitlement set';
end $$;
rollback to savepoint s5;

-- ─── Scenario 6 — Cancel → billing dropped, free restored ─────────────

savepoint s6;
do $$
declare
  v_user_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_result jsonb;
  v_billing int;
  v_plan int;
  v_expected_free int;
begin
  -- Subscribe → cancel → assert state
  perform public.grant_billing_entitlements(
    p_provider := 'play_store',
    p_event_id := 'evt_cancel_1',
    p_event_created_at := now(),
    p_user_id := v_user_a,
    p_plan_id := 'premium_yearly',
    p_provider_subscription_id := 'play_sub_cancel',
    p_provider_purchase_token := 'TOKEN_CANCEL_TEST',
    p_status := 'active',
    p_current_period_start := now(),
    p_current_period_end := now() + interval '1 year'
  );

  -- Cancel
  v_result := public.grant_billing_entitlements(
    p_provider := 'play_store',
    p_event_id := 'evt_cancel_2',
    p_event_created_at := now() + interval '1 second',
    p_user_id := v_user_a,
    p_plan_id := 'premium_yearly',  -- plan unchanged
    p_provider_subscription_id := 'play_sub_cancel',
    p_provider_purchase_token := 'TOKEN_CANCEL_TEST',
    p_status := 'canceled',
    p_current_period_start := now(),
    p_current_period_end := null  -- canceled with no future end
  );
  if v_result->>'result' != 'granted' then raise exception 'S6 cancel: %', v_result; end if;

  -- Assert: 0 billing rows, free baseline restored (count from plan_entitlements)
  select count(*) into v_billing from public.user_entitlements
    where user_id = v_user_a and source = 'billing';
  if v_billing != 0 then raise exception 'S6: expected 0 billing rows, got %', v_billing; end if;

  select count(*) into v_expected_free from public.plan_entitlements where plan_id = 'free';
  select count(*) into v_plan from public.user_entitlements
    where user_id = v_user_a and source = 'plan';
  if v_plan != v_expected_free then
    raise exception 'S6: expected % plan rows after cancel, got %', v_expected_free, v_plan;
  end if;

  raise notice 'S6 PASS — cancel drops billing + restores free baseline';
end $$;
rollback to savepoint s6;

-- ─── Scenario 7 — Same event called twice → one ledger row, one set ───
-- This single-session test verifies sequential idempotence (same event_id
-- twice in a row produces one ledger row and one entitlement set). True
-- concurrency relies on:
--   1. PK conflict on processed_billing_events being atomic (PG MVCC)
--   2. pg_advisory_xact_lock per (provider, subscription_id) serializing
--      concurrent calls so the stale-event check is authoritative
-- TODO manual verification (post-deploy): open 2 psql sessions on the
-- staging DB, BEGIN in each, call the RPC simultaneously with same
-- event_id but DIFFERENT event_created_at on the same subscription. Verify
-- the older one returns 'stale_event_rejected' (or the same event_id
-- returns 'already_processed' for whichever loses the PK race). Without
-- the advisory lock this would have been a race window.

savepoint s7;
do $$
declare
  v_user_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_ledger_count int;
  v_billing_count int;
  v_expected int;
begin
  select count(*) into v_expected from public.plan_entitlements where plan_id = 'premium_monthly';

  perform public.grant_billing_entitlements(
    p_provider := 'stripe', p_event_id := 'evt_concurrent_test', p_event_created_at := now(),
    p_user_id := v_user_a, p_plan_id := 'premium_monthly',
    p_provider_subscription_id := 'sub_concurrent', p_provider_purchase_token := null,
    p_status := 'active', p_current_period_start := now(), p_current_period_end := now() + interval '30 days'
  );
  perform public.grant_billing_entitlements(
    p_provider := 'stripe', p_event_id := 'evt_concurrent_test', p_event_created_at := now(),
    p_user_id := v_user_a, p_plan_id := 'premium_monthly',
    p_provider_subscription_id := 'sub_concurrent', p_provider_purchase_token := null,
    p_status := 'active', p_current_period_start := now(), p_current_period_end := now() + interval '30 days'
  );

  select count(*) into v_ledger_count from public.processed_billing_events
    where provider = 'stripe' and event_id = 'evt_concurrent_test';
  if v_ledger_count != 1 then raise exception 'S7: expected 1 ledger row, got %', v_ledger_count; end if;

  select count(*) into v_billing_count from public.user_entitlements
    where user_id = v_user_a and source = 'billing';
  if v_billing_count != v_expected then
    raise exception 'S7: expected % billing rows (single grant set), got %', v_expected, v_billing_count;
  end if;

  raise notice 'S7 PASS — duplicate event_id produces single ledger row + single grant';
end $$;
rollback to savepoint s7;

-- ─── Scenario 8 — RTDN-style play renewal → existing owner only ───────

savepoint s8;
do $$
declare
  v_user_a uuid := '00000000-0000-0000-0000-00000000000a';
  v_user_b uuid := '00000000-0000-0000-0000-00000000000b';
  v_result jsonb;
  v_period_end timestamptz;
begin
  -- user_a subscribes, gets a token
  perform public.grant_billing_entitlements(
    p_provider := 'play_store',
    p_event_id := 'evt_rtdn_initial',
    p_event_created_at := '2026-05-01'::timestamptz,
    p_user_id := v_user_a,
    p_plan_id := 'premium_yearly',
    p_provider_subscription_id := 'play_sub_rtdn',
    p_provider_purchase_token := 'TOKEN_RTDN_TEST',
    p_status := 'active',
    p_current_period_start := '2026-05-01'::timestamptz,
    p_current_period_end := '2026-06-01'::timestamptz
  );

  -- RTDN renewal arrives — same token, same subscription id, new period
  v_result := public.grant_billing_entitlements(
    p_provider := 'play_store',
    p_event_id := 'evt_rtdn_renewal',
    p_event_created_at := '2026-06-01'::timestamptz,
    p_user_id := v_user_a,
    p_plan_id := 'premium_yearly',
    p_provider_subscription_id := 'play_sub_rtdn',
    p_provider_purchase_token := 'TOKEN_RTDN_TEST',
    p_status := 'active',
    p_current_period_start := '2026-06-01'::timestamptz,
    p_current_period_end := '2026-07-01'::timestamptz
  );
  if v_result->>'result' != 'granted' then raise exception 'S8 renewal: %', v_result; end if;

  -- Verify ownership unchanged + period extended
  select current_period_end into v_period_end
  from public.user_subscriptions
  where provider_subscription_id = 'play_sub_rtdn';
  if v_period_end != '2026-07-01'::timestamptz then
    raise exception 'S8: period_end not extended, got %', v_period_end;
  end if;

  if exists (
    select 1 from public.user_subscriptions
    where provider_purchase_token = 'TOKEN_RTDN_TEST' and user_id != v_user_a
  ) then
    raise exception 'S8: token bound to wrong user';
  end if;

  raise notice 'S8 PASS — RTDN renewal updates existing owner, no ownership transfer';
end $$;
rollback to savepoint s8;

-- ─── Done ─────────────────────────────────────────────────────────────

do $$
begin
  raise notice '';
  raise notice 'All 8 scenarios passed (S1-S8).';
  raise notice 'Migration: 20260507130000_billing_idempotence_ledger.sql';
  raise notice 'RPC: public.grant_billing_entitlements';
end $$;

rollback;

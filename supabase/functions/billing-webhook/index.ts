import { captureEdgeException } from '../_shared/sentry.ts'
import { isFoundingCohortFullError } from '../_shared/billingRpcErrors.ts'
import { corsHeaders, json } from '../_shared/http.ts'
import { createClients } from '../_shared/supabase.ts'
import { getPlanIdForStripePrice, verifyStripeWebhookSignature } from '../_shared/stripe.ts'

interface BillingWebhookBody {
  type: 'subscription.activated' | 'subscription.updated' | 'subscription.canceled'
  userId: string
  planId: string
  provider?: 'manual' | 'stripe' | 'app_store' | 'play_store'
  providerCustomerId?: string
  providerSubscriptionId?: string
  status?: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
  metadata?: Record<string, unknown>
}

type BillingStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
type BillingProvider = 'manual' | 'stripe' | 'app_store' | 'play_store'

type StripeWebhookEvent = {
  id?: string
  type?: string
  created?: number
  data?: { object?: unknown }
}

type StripeSubscriptionEvent = {
  id: string
  customer?: string
  status?: string
  current_period_start?: number
  current_period_end?: number
  cancel_at_period_end?: boolean
  metadata?: Record<string, string>
  items?: {
    data?: Array<{
      price?: {
        id?: string
      }
    }>
  }
}

type StripeCheckoutSessionEvent = {
  id: string
  customer?: string
  subscription?: string
  client_reference_id?: string
  metadata?: Record<string, string>
}

const ACTIVE_STATUSES = new Set<BillingStatus>(['active', 'trialing'])

const fromUnixSecondsToIso = (seconds: number | undefined): string | null => {
  if (!seconds || !Number.isFinite(seconds)) return null
  return new Date(seconds * 1000).toISOString()
}

const mapStripeStatus = (status: string | undefined): BillingStatus => {
  if (status === 'active') return 'active'
  if (status === 'trialing') return 'trialing'
  if (status === 'past_due' || status === 'unpaid') return 'past_due'
  if (status === 'canceled') return 'canceled'
  if (status === 'incomplete_expired') return 'expired'
  return 'inactive'
}

// Map Postgres SQLSTATE codes from RPC errors to HTTP responses.
const mapRpcError = (rpcError: { code?: string; message?: string }): { status: number; body: Record<string, unknown> } => {
  if (isFoundingCohortFullError(rpcError)) {
    // 200 avoids Stripe webhook retry storms — payment may need manual refund if checkout slipped through.
    return {
      status: 200,
      body: {
        ok: true,
        ignored: true,
        reason: 'founding_cohort_full',
        code: 'founding_cohort_full',
      },
    }
  }
  if (rpcError.code === '23505') {
    // unique_violation — token already bound to another user
    return { status: 409, body: { error: 'Purchase already linked to another account.', code: 'token_already_bound' } }
  }
  if (rpcError.code === '23514') {
    // check_violation — e.g., active + null period_end
    return { status: 400, body: { error: rpcError.message ?? 'Invalid billing payload', code: 'check_violation' } }
  }
  if (rpcError.code === '23503') {
    // foreign_key_violation — unknown plan_id
    return { status: 404, body: { error: rpcError.message ?? 'Unknown plan', code: 'unknown_plan' } }
  }
  return { status: 500, body: { error: rpcError.message ?? 'RPC error', code: rpcError.code } }
}

/**
 * DEPRECATED for stripe/play_store paths — use grant_billing_entitlements RPC.
 * Kept ONLY for the internal manual webhook path (admin/tester promotions),
 * which has no provider event_id and runs at single-actor concurrency.
 * Migrate to RPC if/when manual path needs idempotence guarantees.
 */
const syncSubscriptionAndEntitlements_legacyManual = async (
  serviceClient: ReturnType<typeof createClients>['serviceClient'],
  payload: {
    userId: string
    planId: string
    provider: BillingProvider
    providerCustomerId?: string | null
    providerSubscriptionId?: string | null
    status: BillingStatus
    currentPeriodStart?: string | null
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
    metadata?: Record<string, unknown>
  },
) => {
  const { data: plan, error: planError } = await serviceClient
    .from('plans')
    .select('id')
    .eq('id', payload.planId)
    .maybeSingle()

  if (planError) return { error: planError.message, code: 400 }
  if (!plan) return { error: `Unknown plan '${payload.planId}'`, code: 404 }

  const { error: subscriptionError } = await serviceClient
    .from('user_subscriptions')
    .upsert(
      {
        user_id: payload.userId,
        plan_id: payload.planId,
        provider: payload.provider,
        provider_customer_id: payload.providerCustomerId ?? null,
        provider_subscription_id: payload.providerSubscriptionId ?? null,
        status: payload.status,
        current_period_start: payload.currentPeriodStart ?? null,
        current_period_end: payload.currentPeriodEnd ?? null,
        cancel_at_period_end: payload.cancelAtPeriodEnd ?? false,
        metadata: payload.metadata ?? {},
      },
      { onConflict: 'user_id,provider' },
    )

  if (subscriptionError) return { error: subscriptionError.message, code: 400 }

  const { error: deleteError } = await serviceClient
    .from('user_entitlements')
    .delete()
    .eq('user_id', payload.userId)
    .eq('source', 'billing')

  if (deleteError) return { error: deleteError.message, code: 400 }

  if (ACTIVE_STATUSES.has(payload.status)) {
    const { data: planEntitlements, error: entitlementsError } = await serviceClient
      .from('plan_entitlements')
      .select('entitlement_key')
      .eq('plan_id', payload.planId)

    if (entitlementsError) return { error: entitlementsError.message, code: 400 }

    if ((planEntitlements ?? []).length > 0) {
      const rows = planEntitlements!.map((row) => ({
        user_id: payload.userId,
        entitlement_key: row.entitlement_key,
        source: 'billing',
        status: 'active',
        expires_at: payload.currentPeriodEnd ?? null,
        metadata: {
          plan_id: payload.planId,
          provider: payload.provider,
          ...(payload.metadata ?? {}),
        },
      }))

      const { error: insertError } = await serviceClient
        .from('user_entitlements')
        .upsert(rows, { onConflict: 'user_id,entitlement_key' })

      if (insertError) return { error: insertError.message, code: 400 }
    }
  } else {
    const { error: restoreFreeError } = await serviceClient
      .rpc('grant_default_free_entitlements', { target_user_id: payload.userId })
    if (restoreFreeError) return { error: restoreFreeError.message, code: 400 }
  }

  return {
    ok: true,
    userId: payload.userId,
    planId: payload.planId,
    status: payload.status,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { serviceClient } = createClients(req)

  try {
    const rawBody = await req.text()
    const stripeSignature = req.headers.get('stripe-signature')
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (stripeSignature) {
      if (!stripeWebhookSecret) {
        return json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' }, 500)
      }

      const isSignatureValid = await verifyStripeWebhookSignature(
        rawBody,
        stripeSignature,
        stripeWebhookSecret,
      )
      if (!isSignatureValid) {
        return json({ error: 'Invalid Stripe signature' }, 401)
      }

      const event = JSON.parse(rawBody) as StripeWebhookEvent
      const eventType = event.type ?? ''
      const eventId = event.id ?? null
      const eventCreatedIso = fromUnixSecondsToIso(event.created)
      const object = event.data?.object

      if (!eventId) {
        return json({ error: 'Stripe event missing id (cannot dedupe)' }, 400)
      }

      // ─── checkout.session.completed: customer→user linkage ONLY ──────
      // Decision #25 fix: do NOT grant entitlements here. The session may
      // arrive before customer.subscription.created carries the period
      // end, which would create an infinite-Premium row. Record only the
      // customer linkage so the subscription event can resolve user_id.
      if (eventType === 'checkout.session.completed') {
        const session = (object ?? {}) as StripeCheckoutSessionEvent
        const userId = session.metadata?.supabase_user_id ?? session.client_reference_id ?? null
        const planId = session.metadata?.plan_id ?? null

        if (!userId || !planId) {
          return json({ ok: true, ignored: true, reason: 'missing_user_or_plan_metadata' })
        }

        // Upsert a placeholder subscription row tagged inactive — entitlements
        // will be granted later by the customer.subscription.* event via the RPC.
        const { error: linkageError } = await serviceClient
          .from('user_subscriptions')
          .upsert(
            {
              user_id: userId,
              plan_id: planId,
              provider: 'stripe',
              provider_customer_id: session.customer ?? null,
              provider_subscription_id: session.subscription ?? null,
              status: 'inactive',
              current_period_start: null,
              current_period_end: null,
              cancel_at_period_end: false,
              metadata: {
                stripe_event_id: eventId,
                stripe_event_type: eventType,
                stripe_session_id: session.id,
                checkout_completed_at: eventCreatedIso,
              },
            },
            { onConflict: 'user_id,provider' },
          )

        if (linkageError) {
          console.error('[billing-webhook] checkout linkage error:', linkageError)
          return json({ error: linkageError.message }, 400)
        }

        return json({
          ok: true,
          synced: false,
          source: 'stripe',
          eventType,
          reason: 'linkage_only_awaiting_subscription_event',
          userId,
          planId,
        })
      }

      // ─── customer.subscription.* events: full RPC grant via Decision #23 ─
      if (
        eventType !== 'customer.subscription.created' &&
        eventType !== 'customer.subscription.updated' &&
        eventType !== 'customer.subscription.deleted'
      ) {
        return json({
          ok: true,
          ignored: true,
          reason: 'unsupported_event',
          eventType,
        })
      }

      const subscription = (object ?? {}) as StripeSubscriptionEvent
      const stripePriceId = subscription.items?.data?.[0]?.price?.id ?? null
      const planId = subscription.metadata?.plan_id ?? getPlanIdForStripePrice(stripePriceId)
      if (!planId) {
        return json({
          ok: true,
          ignored: true,
          reason: 'unknown_price_mapping',
          stripePriceId,
        })
      }

      let userId = subscription.metadata?.supabase_user_id ?? null
      if (!userId && subscription.customer) {
        // Look up via the user_subscriptions row created at checkout.session.completed.
        const { data: linkRow } = await serviceClient
          .from('user_subscriptions')
          .select('user_id')
          .eq('provider', 'stripe')
          .eq('provider_customer_id', subscription.customer)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        userId = (linkRow?.user_id as string | undefined) ?? null
      }
      if (!userId) {
        return json({
          ok: true,
          ignored: true,
          reason: 'unknown_user',
          stripeCustomerId: subscription.customer ?? null,
        })
      }

      const status = mapStripeStatus(subscription.status)
      const currentPeriodEnd = fromUnixSecondsToIso(subscription.current_period_end)

      // Defense-in-depth: if Stripe sent us active without a period end,
      // refuse before the RPC raises check_violation. Surfaces Stripe API
      // contract weirdness rather than dressing it up as an internal error.
      if (ACTIVE_STATUSES.has(status) && !currentPeriodEnd) {
        return json({
          ok: false,
          error: 'Stripe subscription event has active status but no current_period_end',
          eventType,
          subscriptionId: subscription.id,
        }, 422)
      }

      const { data: rpc, error: rpcError } = await serviceClient.rpc('grant_billing_entitlements', {
        p_provider: 'stripe',
        p_event_id: eventId,
        p_event_created_at: eventCreatedIso,
        p_user_id: userId,
        p_plan_id: planId,
        p_provider_subscription_id: subscription.id,
        p_provider_purchase_token: null,
        p_status: status,
        p_current_period_start: fromUnixSecondsToIso(subscription.current_period_start),
        p_current_period_end: currentPeriodEnd,
        p_provider_customer_id: subscription.customer ?? null,
        p_cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        p_metadata: {
          stripe_event_id: eventId,
          stripe_event_type: eventType,
          stripe_price_id: stripePriceId,
        },
      })

      if (rpcError) {
        console.error('[billing-webhook] RPC error:', rpcError)
        const mapped = mapRpcError(rpcError)
        return json(mapped.body, mapped.status)
      }

      const rpcResult = rpc as {
        result: 'granted' | 'already_processed' | 'stale_event_rejected'
        event_id?: string
        plan_id?: string
        status?: string
        expires_at?: string | null
      }

      console.log('[billing-webhook] RPC result:', rpcResult.result, {
        eventType, eventId, subscriptionId: subscription.id,
      })

      return json({
        ok: true,
        synced: rpcResult.result === 'granted',
        idempotenceResult: rpcResult.result,
        source: 'stripe',
        eventType,
        userId,
        planId,
        status,
      })
    }

    // ─── Manual / non-Stripe webhook (admin promotions, app_store, etc) ──
    // Uses x-webhook-secret. Keeps the legacy direct-mutation helper because
    // the manual path has no provider event_id (no idempotence ledger key)
    // and runs at single-actor admin concurrency. Race risk is essentially
    // nil here. Migrate when/if app_store flow ships.
    const webhookSecret = Deno.env.get('BILLING_WEBHOOK_SHARED_SECRET')
    if (!webhookSecret) {
      return json({ error: 'BILLING_WEBHOOK_SHARED_SECRET is not configured' }, 500)
    }
    if (req.headers.get('x-webhook-secret') !== webhookSecret) {
      return json({ error: 'Invalid webhook secret' }, 401)
    }

    const body = JSON.parse(rawBody) as BillingWebhookBody
    if (!body.type || !body.userId || !body.planId) {
      return json({ error: 'Missing webhook payload' }, 400)
    }

    const status: BillingStatus =
      body.type === 'subscription.canceled'
        ? 'canceled'
        : body.status ?? 'active'
    const provider = body.provider ?? 'manual'

    const result = await syncSubscriptionAndEntitlements_legacyManual(serviceClient, {
      userId: body.userId,
      planId: body.planId,
      provider,
      providerCustomerId: body.providerCustomerId ?? null,
      providerSubscriptionId: body.providerSubscriptionId ?? null,
      status,
      currentPeriodStart: body.currentPeriodStart ?? null,
      currentPeriodEnd: body.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: body.cancelAtPeriodEnd ?? false,
      metadata: body.metadata ?? {},
    })

    if ('error' in result) return json({ error: result.error }, result.code)

    return json({
      ok: true,
      synced: true,
      source: 'manual',
      planId: result.planId,
      userId: result.userId,
      status: result.status,
    })
  } catch (error) {
    console.error('[billing-webhook] Uncaught error:', String(error))
    await captureEdgeException(error, { function: 'billing-webhook' })
    return json({ error: String(error) }, 500)
  }
})

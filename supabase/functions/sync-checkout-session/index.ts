import { isFoundingCohortFullError } from '../_shared/billingRpcErrors.ts'
import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'
import { getPlanIdForStripePrice, stripeRequest } from '../_shared/stripe.ts'

type BillingStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

type SyncBody = {
  sessionId?: string
}

type StripeCheckoutSession = {
  id?: string
  customer?: string
  client_reference_id?: string
  payment_status?: string
  metadata?: Record<string, string>
  line_items?: {
    data?: Array<{
      price?: {
        id?: string
      }
    }>
  }
  subscription?: {
    id?: string
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
  } | string | null
}

const ACTIVE_STATUSES = new Set<BillingStatus>(['active', 'trialing'])

const fromUnixSecondsToIso = (seconds: number | undefined): string | null => {
  if (!seconds || !Number.isFinite(seconds)) return null
  return new Date(seconds * 1000).toISOString()
}

const mapStripeStatus = (status: string | undefined, paymentStatus?: string): BillingStatus => {
  if (status === 'active') return 'active'
  if (status === 'trialing') return 'trialing'
  if (status === 'past_due' || status === 'unpaid') return 'past_due'
  if (status === 'canceled') return 'canceled'
  if (status === 'incomplete_expired') return 'expired'
  if (paymentStatus === 'paid') return 'active'
  return 'inactive'
}

const mapRpcError = (rpcError: { code?: string; message?: string }): { status: number; body: Record<string, unknown> } => {
  if (isFoundingCohortFullError(rpcError)) {
    return {
      status: 403,
      body: {
        ok: false,
        reason: 'founding_cohort_full',
        code: 'founding_cohort_full',
        message: 'L’offre Founding est complète (100 places).',
      },
    }
  }
  if (rpcError.code === '23505') {
    return { status: 409, body: { error: 'Purchase already linked to another account.', code: 'token_already_bound' } }
  }
  if (rpcError.code === '23514') {
    return { status: 400, body: { error: rpcError.message ?? 'Invalid billing payload', code: 'check_violation' } }
  }
  if (rpcError.code === '23503') {
    return { status: 404, body: { error: rpcError.message ?? 'Unknown plan', code: 'unknown_plan' } }
  }
  return { status: 500, body: { error: rpcError.message ?? 'RPC error', code: rpcError.code } }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeSecretKey) {
    return json({ error: 'STRIPE_SECRET_KEY is not configured' }, 500)
  }

  try {
    const body = await req.json() as SyncBody
    const sessionId = body.sessionId?.trim()
    if (!sessionId) return json({ error: 'Missing sessionId' }, 400)

    const response = await stripeRequest(
      stripeSecretKey,
      `/v1/checkout/sessions/${sessionId}?expand[]=subscription&expand[]=line_items.data.price`,
    )

    if (!response.ok) {
      return json({ error: 'Stripe checkout session fetch failed', details: response.data }, 502)
    }

    const session = (response.data ?? null) as StripeCheckoutSession | null
    if (!session?.id) return json({ error: 'Invalid Stripe checkout session payload' }, 502)

    const sessionUserId = session.metadata?.supabase_user_id ?? session.client_reference_id ?? null
    if (!sessionUserId || sessionUserId !== user.id) {
      return json({ error: 'Checkout session does not belong to current user' }, 403)
    }

    const subscription = typeof session.subscription === 'object' && session.subscription
      ? session.subscription
      : null

    const stripePriceIdFromSession = session.line_items?.data?.[0]?.price?.id ?? null
    const stripePriceIdFromSubscription = subscription?.items?.data?.[0]?.price?.id ?? null

    const planId =
      session.metadata?.plan_id ??
      subscription?.metadata?.plan_id ??
      getPlanIdForStripePrice(stripePriceIdFromSubscription) ??
      getPlanIdForStripePrice(stripePriceIdFromSession)

    if (!planId) {
      return json({
        error: 'Unable to determine planId from Stripe session',
        stripePriceIdFromSession,
        stripePriceIdFromSubscription,
      }, 422)
    }

    // Race case: Stripe says session is paid but subscription propagation
    // hasn't finished yet. Frontend should retry. Better than granting an
    // active subscription with null period_end (Decision #25 anti-pattern).
    if (!subscription) {
      if (session.payment_status === 'paid') {
        return json({
          ok: false,
          pending: true,
          reason: 'subscription_not_yet_propagated',
          retryAfterMs: 2000,
        }, 202)
      }
      // Not paid yet, nothing to sync.
      return json({ ok: true, synced: false, reason: 'session_not_paid' })
    }

    const status = mapStripeStatus(subscription.status, session.payment_status)
    const currentPeriodEnd = fromUnixSecondsToIso(subscription.current_period_end)

    // Same defense-in-depth as billing-webhook: refuse active without period_end.
    if (ACTIVE_STATUSES.has(status) && !currentPeriodEnd) {
      return json({
        ok: false,
        pending: true,
        reason: 'subscription_period_end_missing',
        retryAfterMs: 2000,
      }, 202)
    }

    // Synthetic event_id keyed on subscription identity. The Stripe webhook
    // uses Stripe's `evt_*` event ids; this `sync_*` namespace cannot collide
    // with webhook events. The ledger will dedupe sync calls vs each other
    // (e.g., user reloads /checkout/success page) and the stale-event guard
    // protects against this sync racing the webhook for the same subscription.
    const syntheticEventId = `sync_session_${session.id}_${currentPeriodEnd ?? 'unbound'}`

    const { data: rpc, error: rpcError } = await serviceClient.rpc('grant_billing_entitlements', {
      p_provider: 'stripe',
      p_event_id: syntheticEventId,
      p_event_created_at: new Date().toISOString(),
      p_user_id: user.id,
      p_plan_id: planId,
      p_provider_subscription_id: subscription.id,
      p_provider_purchase_token: null,
      p_status: status,
      p_current_period_start: fromUnixSecondsToIso(subscription.current_period_start),
      p_current_period_end: currentPeriodEnd,
      p_provider_customer_id: session.customer ?? null,
      p_cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      p_metadata: {
        source: 'sync_checkout_session',
        stripe_checkout_session_id: session.id,
        stripe_price_id: stripePriceIdFromSubscription ?? stripePriceIdFromSession,
      },
    })

    if (rpcError) {
      console.error('[sync-checkout-session] RPC error:', rpcError)
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

    return json({
      ok: true,
      synced: rpcResult.result === 'granted',
      idempotenceResult: rpcResult.result,
      userId: user.id,
      planId,
      status,
      expiresAt: currentPeriodEnd,
    })
  } catch (error) {
    console.error('[sync-checkout-session] Uncaught error:', String(error))
    await captureEdgeException(error, { function: 'sync-checkout-session' })
    return json({ error: String(error) }, 500)
  }
})

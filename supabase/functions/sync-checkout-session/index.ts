import { corsHeaders, json } from '../_shared/http.ts'
import { requireUser } from '../_shared/supabase.ts'
import { getPlanIdForStripePrice, stripeRequest } from '../_shared/stripe.ts'

type BillingStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
type BillingProvider = 'manual' | 'stripe' | 'app_store' | 'play_store'

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

const syncSubscriptionAndEntitlements = async (
  serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient'],
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

  if (planError) return { error: planError.message, code: 400 as const }
  if (!plan) return { error: `Unknown plan '${payload.planId}'`, code: 404 as const }

  const onConflict = 'user_id,provider'

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
      { onConflict },
    )

  if (subscriptionError) return { error: subscriptionError.message, code: 400 as const }

  const { error: deleteError } = await serviceClient
    .from('user_entitlements')
    .delete()
    .eq('user_id', payload.userId)
    .eq('source', 'billing')

  if (deleteError) return { error: deleteError.message, code: 400 as const }

  if (ACTIVE_STATUSES.has(payload.status)) {
    const { data: planEntitlements, error: entitlementsError } = await serviceClient
      .from('plan_entitlements')
      .select('entitlement_key')
      .eq('plan_id', payload.planId)

    if (entitlementsError) return { error: entitlementsError.message, code: 400 as const }

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

      if (insertError) return { error: insertError.message, code: 400 as const }
    }
  } else {
    const { error: restoreFreeError } = await serviceClient
      .rpc('grant_default_free_entitlements', { target_user_id: payload.userId })
    if (restoreFreeError) return { error: restoreFreeError.message, code: 400 as const }
  }

  return {
    ok: true as const,
    userId: payload.userId,
    planId: payload.planId,
    status: payload.status,
  }
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

    const status = mapStripeStatus(subscription?.status, session.payment_status)

    const syncResult = await syncSubscriptionAndEntitlements(serviceClient, {
      userId: user.id,
      planId,
      provider: 'stripe',
      providerCustomerId: session.customer ?? null,
      providerSubscriptionId: subscription?.id ?? null,
      status,
      currentPeriodStart: fromUnixSecondsToIso(subscription?.current_period_start),
      currentPeriodEnd: fromUnixSecondsToIso(subscription?.current_period_end),
      cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
      metadata: {
        source: 'sync_checkout_session',
        stripe_checkout_session_id: session.id,
        stripe_price_id: stripePriceIdFromSubscription ?? stripePriceIdFromSession,
      },
    })

    if ('error' in syncResult) return json({ error: syncResult.error }, syncResult.code)

    return json({
      ok: true,
      synced: true,
      userId: syncResult.userId,
      planId: syncResult.planId,
      status: syncResult.status,
    })
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

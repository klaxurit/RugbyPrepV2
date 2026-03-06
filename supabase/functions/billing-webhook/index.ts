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

const syncSubscriptionAndEntitlements = async (
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

const findUserIdByStripeCustomer = async (
  serviceClient: ReturnType<typeof createClients>['serviceClient'],
  customerId: string,
): Promise<string | null> => {
  const { data, error } = await serviceClient
    .from('user_subscriptions')
    .select('user_id')
    .eq('provider', 'stripe')
    .eq('provider_customer_id', customerId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return (data?.user_id as string | undefined) ?? null
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

      const event = JSON.parse(rawBody) as {
        id?: string
        type?: string
        data?: { object?: unknown }
      }
      const eventType = event.type ?? ''
      const object = event.data?.object

      if (eventType === 'checkout.session.completed') {
        const session = (object ?? {}) as StripeCheckoutSessionEvent
        const userId = session.metadata?.supabase_user_id ?? session.client_reference_id ?? null
        const planId = session.metadata?.plan_id ?? null

        if (!userId || !planId) {
          return json({ ok: true, ignored: true, reason: 'missing_user_or_plan_metadata' })
        }

        const result = await syncSubscriptionAndEntitlements(serviceClient, {
          userId,
          planId,
          provider: 'stripe',
          providerCustomerId: session.customer ?? null,
          providerSubscriptionId: session.subscription ?? null,
          status: 'active',
          metadata: {
            stripe_event_id: event.id ?? null,
            stripe_event_type: eventType,
          },
        })

        if ('error' in result) return json({ error: result.error }, result.code)

        return json({
          ok: true,
          synced: true,
          source: 'stripe',
          eventType,
          userId: result.userId,
          planId: result.planId,
          status: result.status,
        })
      }

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
        userId = await findUserIdByStripeCustomer(serviceClient, subscription.customer)
      }
      if (!userId) {
        return json({
          ok: true,
          ignored: true,
          reason: 'unknown_user',
          stripeCustomerId: subscription.customer ?? null,
        })
      }

      const result = await syncSubscriptionAndEntitlements(serviceClient, {
        userId,
        planId,
        provider: 'stripe',
        providerCustomerId: subscription.customer ?? null,
        providerSubscriptionId: subscription.id ?? null,
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: fromUnixSecondsToIso(subscription.current_period_start),
        currentPeriodEnd: fromUnixSecondsToIso(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        metadata: {
          stripe_event_id: event.id ?? null,
          stripe_event_type: eventType,
          stripe_price_id: stripePriceId,
        },
      })

      if ('error' in result) return json({ error: result.error }, result.code)

      return json({
        ok: true,
        synced: true,
        source: 'stripe',
        eventType,
        userId: result.userId,
        planId: result.planId,
        status: result.status,
      })
    }

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

    const result = await syncSubscriptionAndEntitlements(serviceClient, {
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
    return json({ error: String(error) }, 500)
  }
})

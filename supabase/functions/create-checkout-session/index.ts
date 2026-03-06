import { corsHeaders, json } from '../_shared/http.ts'
import { requireUser } from '../_shared/supabase.ts'
import { getStripePriceIdForPlan, stripeRequest } from '../_shared/stripe.ts'

interface CheckoutBody {
  planId: string
  successUrl: string
  cancelUrl: string
}

interface CheckoutResponse {
  ok: boolean
  ready: boolean
  plan?: {
    id: string
    name: string
    billing_interval: string
    price_cents: number
    currency: string
    is_active: boolean
  }
  entitlements?: string[]
  checkoutUrl?: string
  message?: string
  reason?: 'provider_not_configured' | 'provider_not_wired'
  nextStep?: string
  sessionId?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  try {
    const body = await req.json() as CheckoutBody
    if (!body.planId || !body.successUrl || !body.cancelUrl) {
      return json({ error: 'Missing checkout payload' }, 400)
    }
    if (body.planId === 'free') {
      return json({ error: 'The free plan does not require checkout' }, 400)
    }

    const { data: plan, error: planError } = await serviceClient
      .from('plans')
      .select('id, name, billing_interval, price_cents, currency, is_active')
      .eq('id', body.planId)
      .eq('is_active', true)
      .maybeSingle()

    if (planError) return json({ error: planError.message }, 400)
    if (!plan) return json({ error: 'Plan not found' }, 404)

    const { data: entitlements, error: entitlementsError } = await serviceClient
      .from('plan_entitlements')
      .select('entitlement_key')
      .eq('plan_id', body.planId)

    if (entitlementsError) return json({ error: entitlementsError.message }, 400)

    const responseBase: CheckoutResponse = {
      ok: false,
      ready: false,
      plan,
      entitlements: (entitlements ?? []).map((row) => row.entitlement_key),
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return json({
        ...responseBase,
        reason: 'provider_not_configured',
        message: 'Checkout provider not configured yet',
        nextStep: 'Connect Stripe and replace this placeholder with a real checkout session builder.',
      })
    }

    const priceId = getStripePriceIdForPlan(body.planId)
    if (!priceId) {
      return json({
        ...responseBase,
        reason: 'provider_not_configured',
        message: `No Stripe price configured for plan '${body.planId}'.`,
        nextStep: 'Set STRIPE_PRICE_PREMIUM_MONTHLY and STRIPE_PRICE_PREMIUM_YEARLY in Supabase secrets.',
      })
    }

    let customerId: string | null = null
    const { data: existingStripeSubscription } = await serviceClient
      .from('user_subscriptions')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .eq('provider', 'stripe')
      .not('provider_customer_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    customerId = (existingStripeSubscription?.provider_customer_id as string | null | undefined) ?? null

    if (!customerId) {
      const customerBody = new URLSearchParams()
      if (user.email) customerBody.set('email', user.email)
      customerBody.set('metadata[supabase_user_id]', user.id)

      const customerResponse = await stripeRequest(stripeSecretKey, '/v1/customers', {
        method: 'POST',
        body: customerBody,
      })

      if (!customerResponse.ok) {
        return json({
          ...responseBase,
          message: 'Stripe customer creation failed.',
          nextStep: JSON.stringify(customerResponse.data),
        }, 502)
      }

      customerId = (customerResponse.data as { id?: string } | null)?.id ?? null
    }

    if (!customerId) {
      return json({
        ...responseBase,
        message: 'Stripe customer id is missing.',
      }, 502)
    }

    const checkoutBody = new URLSearchParams()
    checkoutBody.set('mode', 'subscription')
    checkoutBody.set('success_url', body.successUrl)
    checkoutBody.set('cancel_url', body.cancelUrl)
    checkoutBody.set('customer', customerId)
    checkoutBody.set('client_reference_id', user.id)
    checkoutBody.set('allow_promotion_codes', 'true')
    checkoutBody.set('line_items[0][price]', priceId)
    checkoutBody.set('line_items[0][quantity]', '1')
    checkoutBody.set('metadata[supabase_user_id]', user.id)
    checkoutBody.set('metadata[plan_id]', body.planId)
    checkoutBody.set('subscription_data[metadata][supabase_user_id]', user.id)
    checkoutBody.set('subscription_data[metadata][plan_id]', body.planId)

    const checkoutResponse = await stripeRequest(stripeSecretKey, '/v1/checkout/sessions', {
      method: 'POST',
      body: checkoutBody,
    })

    if (!checkoutResponse.ok) {
      return json({
        ...responseBase,
        message: 'Stripe checkout session creation failed.',
        nextStep: JSON.stringify(checkoutResponse.data),
      }, 502)
    }

    const session = checkoutResponse.data as { id?: string; url?: string } | null
    if (!session?.id || !session.url) {
      return json({
        ...responseBase,
        message: 'Stripe checkout session response is incomplete.',
      }, 502)
    }

    return json({
      ok: true,
      ready: true,
      plan,
      entitlements: responseBase.entitlements,
      checkoutUrl: session.url,
      sessionId: session.id,
      message: 'Checkout session created.',
    } satisfies CheckoutResponse)
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

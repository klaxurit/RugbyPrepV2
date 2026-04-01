import { corsHeaders, json } from '../_shared/http.ts'
import { requireUser } from '../_shared/supabase.ts'
import { verifyPlayPurchase, getPlanIdForPlayProduct } from '../_shared/playBilling.ts'

const PACKAGE_NAME = 'fr.rugbyforge.app'

type RequestBody = {
  productId: string
  purchaseToken: string
}

type BillingStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

const ACTIVE_STATUSES = new Set<BillingStatus>(['active', 'trialing'])

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  try {
    const body = (await req.json()) as RequestBody

    if (!body.productId || !body.purchaseToken) {
      return json({ error: 'Missing productId or purchaseToken' }, 400)
    }

    const planId = getPlanIdForPlayProduct(body.productId)
    if (!planId) {
      return json({ error: `Unknown product ID: ${body.productId}` }, 400)
    }

    // Verify the purchase with Google Play Developer API
    const result = await verifyPlayPurchase(PACKAGE_NAME, body.productId, body.purchaseToken)

    if (!result.valid) {
      return json({
        ok: false,
        error: result.error ?? 'Purchase is not valid or expired',
      }, 400)
    }

    // Verify plan exists
    const { data: plan, error: planError } = await serviceClient
      .from('plans')
      .select('id')
      .eq('id', planId)
      .maybeSingle()

    if (planError || !plan) {
      return json({ error: `Unknown plan '${planId}'` }, 404)
    }

    // Upsert subscription
    const status: BillingStatus = 'active'

    const { error: subscriptionError } = await serviceClient
      .from('user_subscriptions')
      .upsert(
        {
          user_id: user.id,
          plan_id: planId,
          provider: 'play_store',
          provider_customer_id: null,
          provider_subscription_id: result.orderId,
          status,
          current_period_start: result.startedAt,
          current_period_end: result.expiresAt,
          cancel_at_period_end: !result.autoRenewing,
          metadata: {
            product_id: body.productId,
            purchase_token: body.purchaseToken,
          },
        },
        { onConflict: 'user_id,provider' },
      )

    if (subscriptionError) {
      return json({ error: subscriptionError.message }, 400)
    }

    // Clear existing billing entitlements and grant new ones
    const { error: deleteError } = await serviceClient
      .from('user_entitlements')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'billing')

    if (deleteError) {
      return json({ error: deleteError.message }, 400)
    }

    if (ACTIVE_STATUSES.has(status)) {
      const { data: planEntitlements, error: entitlementsError } = await serviceClient
        .from('plan_entitlements')
        .select('entitlement_key')
        .eq('plan_id', planId)

      if (entitlementsError) {
        return json({ error: entitlementsError.message }, 400)
      }

      if ((planEntitlements ?? []).length > 0) {
        const rows = planEntitlements!.map((row) => ({
          user_id: user.id,
          entitlement_key: row.entitlement_key,
          source: 'billing',
          status: 'active',
          expires_at: result.expiresAt,
          metadata: {
            plan_id: planId,
            provider: 'play_store',
            product_id: body.productId,
          },
        }))

        const { error: insertError } = await serviceClient
          .from('user_entitlements')
          .upsert(rows, { onConflict: 'user_id,entitlement_key' })

        if (insertError) {
          return json({ error: insertError.message }, 400)
        }
      }
    }

    return json({
      ok: true,
      planId,
      status,
      expiresAt: result.expiresAt,
      autoRenewing: result.autoRenewing,
    })
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

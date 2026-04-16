import { corsHeaders, json } from '../_shared/http.ts'
import { requireUser } from '../_shared/supabase.ts'
import { verifyPlayPurchase, getPlanIdForPlayProduct } from '../_shared/playBilling.ts'

const PACKAGE_NAME = 'fr.rugbyforge.app'

/**
 * Re-verifies the user's Play Store subscription using the stored purchase token.
 * Called by the frontend when current_period_end has passed to check if Google renewed.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  try {
    // Get the user's play_store subscription with stored purchase token
    const { data: sub, error: subError } = await serviceClient
      .from('user_subscriptions')
      .select('plan_id, metadata, current_period_end')
      .eq('user_id', user.id)
      .eq('provider', 'play_store')
      .maybeSingle()

    if (subError || !sub) {
      return json({ ok: false, reason: 'no_play_subscription' })
    }

    const purchaseToken = (sub.metadata as { purchase_token?: string })?.purchase_token
    const productId = (sub.metadata as { product_id?: string })?.product_id
    if (!purchaseToken || !productId) {
      return json({ ok: false, reason: 'no_stored_token' })
    }

    // Re-verify with Google
    const result = await verifyPlayPurchase(PACKAGE_NAME, productId, purchaseToken)

    if (!result.valid) {
      // Subscription truly expired — update status
      await serviceClient
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .eq('provider', 'play_store')

      // Revoke billing entitlements
      await serviceClient
        .from('user_entitlements')
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .eq('source', 'billing')

      return json({ ok: true, renewed: false, status: 'expired' })
    }

    // Subscription still active (Google renewed) — update period
    const planId = getPlanIdForPlayProduct(productId)

    await serviceClient
      .from('user_subscriptions')
      .update({
        status: 'active',
        current_period_start: result.startedAt,
        current_period_end: result.expiresAt,
        cancel_at_period_end: !result.autoRenewing,
      })
      .eq('user_id', user.id)
      .eq('provider', 'play_store')

    // Refresh entitlements expiry
    if (planId) {
      const { data: planEntitlements } = await serviceClient
        .from('plan_entitlements')
        .select('entitlement_key')
        .eq('plan_id', planId)

      if (planEntitlements?.length) {
        const rows = planEntitlements.map((row) => ({
          user_id: user.id,
          entitlement_key: row.entitlement_key,
          source: 'billing',
          status: 'active',
          expires_at: result.expiresAt,
          metadata: { plan_id: planId, provider: 'play_store', product_id: productId },
        }))
        await serviceClient
          .from('user_entitlements')
          .upsert(rows, { onConflict: 'user_id,entitlement_key' })
      }
    }

    return json({
      ok: true,
      renewed: true,
      status: 'active',
      expiresAt: result.expiresAt,
    })
  } catch (error) {
    console.error('[refresh-play-subscription] Error:', String(error))
    return json({ error: String(error) }, 500)
  }
})

import { isFoundingCohortFullError } from '../_shared/billingRpcErrors.ts'
import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'
import { verifyPlayPurchase, getPlanIdForPlayProduct } from '../_shared/playBilling.ts'

const PACKAGE_NAME = 'fr.rugbyforge.app'

const mapRpcError = (rpcError: { code?: string; message?: string }): { status: number; body: Record<string, unknown> } => {
  if (isFoundingCohortFullError(rpcError)) {
    return {
      status: 403,
      body: {
        ok: false,
        error: 'L’offre Founding est complète (100 places).',
        code: 'founding_cohort_full',
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

/**
 * Re-verifies the user's Play Store subscription using the stored purchase token.
 * Called by the frontend when current_period_end has passed to check if Google renewed.
 *
 * Decision #23: state mutations go through grant_billing_entitlements RPC
 * (idempotent on (provider, event_id), per-subscription advisory lock,
 * stale-event rejection, plan_id-driven entitlement reconciliation).
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  try {
    // Get the user's play_store subscription with stored purchase token.
    // Read provider_purchase_token (column, post-migration) with fallback to
    // metadata.purchase_token to gracefully handle any pre-backfill rows.
    const { data: sub, error: subError } = await serviceClient
      .from('user_subscriptions')
      .select('plan_id, metadata, provider_purchase_token, provider_subscription_id, current_period_end')
      .eq('user_id', user.id)
      .eq('provider', 'play_store')
      .maybeSingle()

    if (subError || !sub) {
      return json({ ok: false, reason: 'no_play_subscription' })
    }

    const purchaseToken =
      (sub as { provider_purchase_token?: string }).provider_purchase_token
      ?? (sub.metadata as { purchase_token?: string })?.purchase_token
      ?? null

    const productId = (sub.metadata as { product_id?: string })?.product_id ?? null

    if (!purchaseToken || !productId) {
      return json({ ok: false, reason: 'no_stored_token' })
    }

    // Re-verify with Google Play Developer API
    const result = await verifyPlayPurchase(PACKAGE_NAME, productId, purchaseToken)
    console.log('[refresh-play-subscription] Google API result:', {
      valid: result.valid, expiresAt: result.expiresAt, orderId: result.orderId,
    })

    const planId = getPlanIdForPlayProduct(productId)
    if (!planId) {
      return json({ error: `Unknown product ID mapping: ${productId}` }, 400)
    }

    if (!result.valid) {
      // Google says the subscription is no longer valid (expired, refunded,
      // canceled, paused). Use the existing subscription_id so the RPC can
      // resolve the row even though Google didn't return a fresh orderId.
      const subscriptionIdForExpiry =
        (sub as { provider_subscription_id?: string | null }).provider_subscription_id
        ?? `play_refresh_expire_${user.id}`

      const { data: rpc, error: rpcError } = await serviceClient.rpc('grant_billing_entitlements', {
        p_provider: 'play_store',
        // Synthetic event_id for the expiry path. `play_refresh_expire_*`
        // namespace cannot collide with Google order IDs (which start with
        // `GPA.`). Includes timestamp to allow re-runs after partial failure.
        p_event_id: `play_refresh_expire_${subscriptionIdForExpiry}_${Date.now()}`,
        p_event_created_at: new Date().toISOString(),
        p_user_id: user.id,
        p_plan_id: planId,
        p_provider_subscription_id: subscriptionIdForExpiry,
        p_provider_purchase_token: purchaseToken,
        p_status: 'expired',
        p_current_period_start: null,
        p_current_period_end: null,
        p_provider_customer_id: null,
        p_cancel_at_period_end: false,
        p_metadata: {
          source: 'refresh_play_subscription_expiry',
          product_id: productId,
          google_error: result.error ?? null,
        },
      })

      if (rpcError) {
        console.error('[refresh-play-subscription] RPC error (expiry path):', rpcError)
        const mapped = mapRpcError(rpcError)
        return json(mapped.body, mapped.status)
      }

      const rpcResult = rpc as { result: string }
      return json({
        ok: true,
        renewed: false,
        status: 'expired',
        idempotenceResult: rpcResult.result,
      })
    }

    if (!result.orderId) {
      return json({ error: 'Google API returned no orderId on valid purchase' }, 502)
    }

    // Subscription still valid — Google may have renewed (new period dates)
    // or not. Either way, the RPC reconciles via the same idempotent path
    // as verify-play-purchase. orderId is monotonic across renewals so the
    // event_id is unique per Google billing event.
    const { data: rpc, error: rpcError } = await serviceClient.rpc('grant_billing_entitlements', {
      p_provider: 'play_store',
      p_event_id: result.orderId,
      p_event_created_at: result.startedAt,
      p_user_id: user.id,
      p_plan_id: planId,
      p_provider_subscription_id: result.orderId,
      p_provider_purchase_token: purchaseToken,
      p_status: 'active',
      p_current_period_start: result.startedAt,
      p_current_period_end: result.expiresAt,
      p_provider_customer_id: null,
      p_cancel_at_period_end: !result.autoRenewing,
      p_metadata: {
        source: 'refresh_play_subscription',
        product_id: productId,
      },
    })

    if (rpcError) {
      console.error('[refresh-play-subscription] RPC error (renewal path):', rpcError)
      const mapped = mapRpcError(rpcError)
      return json(mapped.body, mapped.status)
    }

    const rpcResult = rpc as {
      result: 'granted' | 'already_processed' | 'stale_event_rejected'
    }

    return json({
      ok: true,
      renewed: rpcResult.result === 'granted',
      status: 'active',
      expiresAt: result.expiresAt,
      autoRenewing: result.autoRenewing,
      idempotenceResult: rpcResult.result,
    })
  } catch (error) {
    console.error('[refresh-play-subscription] Error:', String(error))
    await captureEdgeException(error, { function: 'refresh-play-subscription' })
    return json({ error: String(error) }, 500)
  }
})

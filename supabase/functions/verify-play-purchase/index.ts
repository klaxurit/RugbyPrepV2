import { isFoundingCohortFullError } from '../_shared/billingRpcErrors.ts'
import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'
import { verifyPlayPurchase, getPlanIdForPlayProduct } from '../_shared/playBilling.ts'

const PACKAGE_NAME = 'fr.rugbyforge.app'

type RequestBody = {
  productId: string
  purchaseToken: string
}

Deno.serve(async (req: Request) => {
  console.log('[verify-play-purchase] Received request:', req.method, req.url)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) {
    console.error('[verify-play-purchase] No authenticated user')
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = (await req.json()) as RequestBody
    console.log('[verify-play-purchase] Request:', { productId: body.productId, userId: user.id })

    if (!body.productId || !body.purchaseToken) {
      return json({ error: 'Missing productId or purchaseToken' }, 400)
    }

    const planId = getPlanIdForPlayProduct(body.productId)
    if (!planId) {
      return json({ error: `Unknown product ID: ${body.productId}` }, 400)
    }

    // Verify the purchase with Google Play Developer API
    const result = await verifyPlayPurchase(PACKAGE_NAME, body.productId, body.purchaseToken)
    console.log('[verify-play-purchase] Google API result:', {
      valid: result.valid, error: result.error, expiresAt: result.expiresAt, orderId: result.orderId,
    })

    if (!result.valid) {
      return json({ ok: false, error: result.error ?? 'Purchase is not valid or expired' }, 400)
    }

    if (!result.orderId) {
      // Google should always return orderId for a valid purchase. Without it we
      // cannot make the RPC idempotent on event_id.
      return json({ error: 'Google API returned no orderId' }, 502)
    }

    // Single source-of-truth mutation via RPC (Decision #23).
    // - Idempotent on (provider, event_id) where event_id = Google orderId
    // - Stale-event rejection on event_created_at vs same subscription
    // - Token binding: rejects if purchaseToken already bound to another user
    // - Entitlement set derived from plan_id (NOT caller-supplied)
    const { data: rpc, error: rpcError } = await serviceClient.rpc('grant_billing_entitlements', {
      p_provider: 'play_store',
      p_event_id: result.orderId,
      p_event_created_at: result.startedAt,
      p_user_id: user.id,
      p_plan_id: planId,
      p_provider_subscription_id: result.orderId,
      p_provider_purchase_token: body.purchaseToken,
      p_status: 'active',
      p_current_period_start: result.startedAt,
      p_current_period_end: result.expiresAt,
      p_provider_customer_id: null,
      p_cancel_at_period_end: !result.autoRenewing,
      p_metadata: {
        product_id: body.productId,
      },
    })

    if (rpcError) {
      if (isFoundingCohortFullError(rpcError)) {
        console.warn('[verify-play-purchase] Founding cohort full:', { userId: user.id })
        return json({
          ok: false,
          error: 'L’offre Founding est complète (100 places).',
          code: 'founding_cohort_full',
        }, 403)
      }
      // Distinguish auth/binding violations from other errors.
      // Postgres unique_violation = SQLSTATE 23505
      if (rpcError.code === '23505') {
        console.warn('[verify-play-purchase] Token bound to another user:', { userId: user.id })
        return json({
          ok: false,
          error: 'This purchase is already linked to another account.',
          code: 'token_already_bound',
        }, 409)
      }
      // Postgres check_violation = 23514 (e.g., active + null period_end)
      if (rpcError.code === '23514') {
        console.error('[verify-play-purchase] Check violation:', rpcError.message)
        return json({ error: rpcError.message }, 400)
      }
      console.error('[verify-play-purchase] RPC error:', rpcError)
      return json({ error: rpcError.message }, 500)
    }

    const rpcResult = rpc as {
      result: 'granted' | 'already_processed' | 'stale_event_rejected'
      event_id?: string
      plan_id?: string
      status?: string
      expires_at?: string | null
      granted_keys?: string[]
      max_processed_at?: string
    }

    console.log('[verify-play-purchase] RPC result:', rpcResult.result, {
      event_id: rpcResult.event_id, expires_at: rpcResult.expires_at,
    })

    // All three RPC outcomes are 200-success from the client's perspective:
    // granted = first time we see this event, state mutated
    // already_processed = replay, state already in correct shape
    // stale_event_rejected = older event, state already fresher (safe no-op)
    return json({
      ok: true,
      planId,
      status: 'active',
      expiresAt: result.expiresAt,
      autoRenewing: result.autoRenewing,
      idempotenceResult: rpcResult.result,
    })
  } catch (error) {
    console.error('[verify-play-purchase] Uncaught error:', String(error))
    await captureEdgeException(error, { function: 'verify-play-purchase' })
    return json({ error: String(error) }, 500)
  }
})

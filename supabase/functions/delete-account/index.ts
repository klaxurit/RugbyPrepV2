import { corsHeaders, json } from '../_shared/http.ts'
import { requireUser } from '../_shared/supabase.ts'

/**
 * delete-account — RGPD-compliant account erasure.
 *
 * Why this is an Edge Function and not a client-side DELETE:
 *   - user_subscriptions, user_entitlements, profiles, etc. all have RLS
 *     policies that grant SELECT only to the row owner. There is no
 *     DELETE policy → client-side DELETE silently fails (RLS block).
 *   - auth.users can only be deleted via the service-role admin API,
 *     never from the client.
 *
 * Strategy:
 *   1. Verify the caller is authenticated and identifies the user_id from
 *      their JWT (no parameter trust — caller cannot delete someone else).
 *   2. Explicitly DELETE rows in tables whose FK is `on delete set null`
 *      (push_subscriptions, notification_delivery_logs). Without this they
 *      would just have user_id nulled by the auth.users cascade — orphan
 *      FCM endpoints staying alive and an audit log we cannot legally keep.
 *   3. auth.admin.deleteUser() — single service-role call that cascades
 *      to every table whose FK is `on delete cascade` (profiles,
 *      user_subscriptions, user_entitlements, athletic_tests, match_calendar,
 *      cancel_feedback, exercise_set_logs, club_memberships, user_dismissed_hints,
 *      notification_preferences, ai_coach_usage, block_logs, training logs, etc).
 *
 * Out of scope (intentional, V1):
 *   - Stripe customer deletion. Stripe retains payment records for legal /
 *     financial compliance. Industry practice is to detach/anonymize.
 *     A future workstream may call stripe.customers.del() if the customer
 *     has no active subscription.
 *   - Play Store subscription cancellation. Account deletion does NOT
 *     cancel the subscription with Google — the user must do that via the
 *     Play Store. The DeleteAccountPage already surfaces this caveat.
 *
 * Related autoplan eng review finding: Decision #26.
 */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  const userId = user.id
  console.log('[delete-account] Erasure requested:', { userId })

  try {
    // 1. Explicit deletes for tables with `on delete set null` FK
    // (auth.users cascade would otherwise just null user_id and leave
    // orphan FCM endpoints + audit logs we cannot legally keep under RGPD).
    const { error: pushErr } = await serviceClient
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
    if (pushErr) {
      console.error('[delete-account] push_subscriptions delete error:', pushErr)
      return json({ error: pushErr.message, stage: 'push_subscriptions' }, 500)
    }

    const { error: logsErr } = await serviceClient
      .from('notification_delivery_logs')
      .delete()
      .eq('user_id', userId)
    if (logsErr) {
      console.error('[delete-account] notification_delivery_logs delete error:', logsErr)
      return json({ error: logsErr.message, stage: 'notification_delivery_logs' }, 500)
    }

    // 2. Delete auth.users — cascades to every on-delete-cascade FK row.
    const { error: authErr } = await serviceClient.auth.admin.deleteUser(userId)
    if (authErr) {
      console.error('[delete-account] auth.admin.deleteUser error:', authErr)
      return json({ error: authErr.message, stage: 'auth_user' }, 500)
    }

    console.log('[delete-account] Erasure complete:', { userId })

    return json({
      ok: true,
      userId,
      erased: true,
    })
  } catch (error) {
    console.error('[delete-account] Uncaught error:', String(error))
    return json({ error: String(error) }, 500)
  }
})

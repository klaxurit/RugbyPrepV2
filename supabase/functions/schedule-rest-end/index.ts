import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'
import { getWebPushConfig, sendWebPush } from '../_shared/webPush.ts'

interface ScheduleBody {
  endsAtISO: string
  label?: string
  returnUrl?: string
}

const MAX_WAIT_MS = 5 * 60 * 1000
const DEFAULT_RETURN_URL = '/week'

function sanitizeReturnUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_RETURN_URL
  }
  if (!value.startsWith('/session/')) return DEFAULT_RETURN_URL
  return value
}

async function skipPendingRestEnd(
  serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient'],
  userId: string,
): Promise<void> {
  await serviceClient
    .from('notification_delivery_logs')
    .update({ status: 'skipped', skipped_reason: 'replaced_or_cancelled' })
    .eq('user_id', userId)
    .eq('template_key', 'rest_end')
    .in('status', ['queued', 'processing'])
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  try {
    const body = await req.json() as ScheduleBody
    const endsAt = new Date(body.endsAtISO)
    if (Number.isNaN(endsAt.getTime())) return json({ error: 'Invalid endsAtISO' }, 400)

    const delayMs = endsAt.getTime() - Date.now()
    if (delayMs <= 0) return json({ error: 'endsAt must be in the future' }, 400)
    if (delayMs > MAX_WAIT_MS) return json({ error: 'Rest timer too long' }, 400)

    const pushConfig = getWebPushConfig()
    if (!pushConfig) return json({ error: 'Push not configured' }, 500)

    const { data: sub, error: subError } = await serviceClient
      .from('push_subscriptions')
      .select('id, endpoint, p256dh_key, auth_key, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subError) return json({ error: subError.message }, 400)
    if (!sub) {
      return json({ ok: true, scheduled: false, reason: 'no_push_subscription' })
    }

    const { data: prefs } = await serviceClient
      .from('notification_preferences')
      .select('push_enabled')
      .eq('user_id', user.id)
      .maybeSingle()

    if (prefs && prefs.push_enabled === false) {
      return json({ ok: true, scheduled: false, reason: 'push_disabled' })
    }

    await skipPendingRestEnd(serviceClient, user.id)

    const label = body.label ?? 'Repos terminé'
    const returnUrl = sanitizeReturnUrl(body.returnUrl)
    const { data: delivery, error: insertError } = await serviceClient
      .from('notification_delivery_logs')
      .insert({
        user_id: user.id,
        push_subscription_id: sub.id,
        template_key: 'rest_end',
        channel: 'push',
        status: 'processing',
        scheduled_for: endsAt.toISOString(),
        payload: { label, url: returnUrl },
      })
      .select('id')
      .single()

    if (insertError) return json({ error: insertError.message }, 400)

    const deliveryId = delivery.id as string

    const waitTask = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, delayMs))

        const { data: row } = await serviceClient
          .from('notification_delivery_logs')
          .select('id, status')
          .eq('id', deliveryId)
          .maybeSingle()

        if (!row || row.status !== 'processing') return

        const result = await sendWebPush(
          sub.endpoint,
          sub.p256dh_key,
          sub.auth_key,
          {
            title: `${label} 💪`,
            body: 'Prêt pour le prochain set.',
            url: returnUrl,
            tag: 'rugbyforge-rest-end',
          },
          pushConfig,
        )

        if (result.status >= 200 && result.status < 300) {
          await serviceClient.from('notification_delivery_logs').update({
            status: 'sent',
            delivered_at: new Date().toISOString(),
            provider_status_code: result.status,
          }).eq('id', deliveryId)
          return
        }

        await serviceClient.from('notification_delivery_logs').update({
          status: 'failed',
          provider_status_code: result.status,
          error_message: result.body || `Push provider returned ${result.status}`,
        }).eq('id', deliveryId)
      } catch (error) {
        await captureEdgeException(error, { function: 'schedule-rest-end' })
        await serviceClient.from('notification_delivery_logs').update({
          status: 'failed',
          error_message: String(error),
        }).eq('id', deliveryId)
      }
    }

    const runtime = (globalThis as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime
    if (runtime?.waitUntil) {
      runtime.waitUntil(waitTask())
    } else {
      void waitTask()
    }

    return json({ ok: true, scheduled: true, deliveryId })
  } catch (error) {
    await captureEdgeException(error, { function: 'schedule-rest-end' })
    return json({ error: String(error) }, 500)
  }
})

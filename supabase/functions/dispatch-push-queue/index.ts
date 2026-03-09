import { corsHeaders, json } from '../_shared/http.ts'
import { createClients } from '../_shared/supabase.ts'
import { getWebPushConfig, sendWebPush, type WebPushPayload } from '../_shared/webPush.ts'

type DeliveryLogRow = {
  id: string
  user_id: string | null
  push_subscription_id: string | null
  template_key: string
  payload: Record<string, unknown>
  attempt_count: number
}

type PushSubscriptionRow = {
  id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
  is_active: boolean
}

interface DispatchBody {
  limit?: number
}

const DEFAULT_LIMIT = 50

const buildPayload = (templateKey: string, rawPayload: Record<string, unknown>): WebPushPayload | null => {
  const trainingDay = rawPayload.trainingDay
  const reminderHour = rawPayload.reminderHour

  if (templateKey === 'training_reminder_standard') {
    return {
      title: 'RugbyForge',
      body: 'Ta séance du jour est prête. Ouvre l’app pour voir ton programme.',
      url: '/week',
      tag: 'training-reminder-standard',
    }
  }

  if (templateKey === 'training_reminder_advanced') {
    return {
      title: 'RugbyForge Premium',
      body: `Ton rappel premium est prêt${typeof trainingDay === 'number' ? ' pour ton jour de séance' : ''}. Vérifie ton programme avant de commencer${typeof reminderHour === 'number' ? ` (${String(reminderHour).padStart(2, '0')}h)` : ''}.`,
      url: '/week',
      tag: 'training-reminder-advanced',
    }
  }

  return null
}

const updateDeliveryStatus = async (
  serviceClient: ReturnType<typeof createClients>['serviceClient'],
  id: string,
  values: Record<string, unknown>,
) => serviceClient
  .from('notification_delivery_logs')
  .update(values)
  .eq('id', id)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const cronSecret = Deno.env.get('CRON_SHARED_SECRET')
  if (!cronSecret) return json({ error: 'Cron secret not configured' }, 500)
  if (req.headers.get('x-cron-secret') !== cronSecret) return json({ error: 'Invalid cron secret' }, 401)

  const pushConfig = getWebPushConfig()
  if (!pushConfig) return json({ error: 'VAPID keys not configured' }, 500)

  const { serviceClient } = createClients(req)

  try {
    const body = await req.json().catch(() => ({})) as DispatchBody
    const limit = Number.isInteger(body.limit) && (body.limit ?? 0) > 0
      ? Math.min(body.limit as number, 200)
      : DEFAULT_LIMIT

    const nowIso = new Date().toISOString()

    const { data: queuedLogsData, error: queuedLogsError } = await serviceClient
      .from('notification_delivery_logs')
      .select('id, user_id, push_subscription_id, template_key, payload, attempt_count')
      .eq('status', 'queued')
      .lte('scheduled_for', nowIso)
      .order('scheduled_for', { ascending: true })
      .limit(limit)

    if (queuedLogsError) return json({ error: queuedLogsError.message }, 400)

    const queuedLogs = (queuedLogsData ?? []) as DeliveryLogRow[]
    if (queuedLogs.length === 0) {
      return json({
        ok: true,
        processed: 0,
        sent: 0,
        failed: 0,
        expired: 0,
        note: 'No queued notifications ready for dispatch.',
      })
    }

    const subscriptionIds = [...new Set(
      queuedLogs
        .map((row) => row.push_subscription_id)
        .filter((value): value is string => Boolean(value)),
    )]

    const subscriptionsById = new Map<string, PushSubscriptionRow>()
    if (subscriptionIds.length > 0) {
      const { data: subscriptionsData, error: subscriptionsError } = await serviceClient
        .from('push_subscriptions')
        .select('id, endpoint, p256dh_key, auth_key, is_active')
        .in('id', subscriptionIds)

      if (subscriptionsError) return json({ error: subscriptionsError.message }, 400)

      for (const row of ((subscriptionsData ?? []) as PushSubscriptionRow[])) {
        subscriptionsById.set(row.id, row)
      }
    }

    let sent = 0
    let failed = 0
    let expired = 0
    let processed = 0

    for (const row of queuedLogs) {
      const { data: claimedRow, error: claimError } = await serviceClient
        .from('notification_delivery_logs')
        .update({
          status: 'processing',
          attempt_count: (row.attempt_count ?? 0) + 1,
          last_attempt_at: nowIso,
          error_message: null,
          provider_status_code: null,
        })
        .eq('id', row.id)
        .eq('status', 'queued')
        .select('id')
        .maybeSingle()

      if (claimError) return json({ error: claimError.message }, 400)
      if (!claimedRow) continue

      processed += 1

      const subscription = row.push_subscription_id
        ? subscriptionsById.get(row.push_subscription_id)
        : null

      if (!subscription || !subscription.is_active) {
        expired += 1
        await updateDeliveryStatus(serviceClient, row.id, {
          status: 'expired',
          error_message: 'Push subscription inactive or missing',
        })
        continue
      }

      const payload = buildPayload(row.template_key, row.payload ?? {})
      if (!payload) {
        failed += 1
        await updateDeliveryStatus(serviceClient, row.id, {
          status: 'failed',
          error_message: `Unknown template key: ${row.template_key}`,
        })
        continue
      }

      try {
        const result = await sendWebPush(
          subscription.endpoint,
          subscription.p256dh_key,
          subscription.auth_key,
          payload,
          pushConfig,
        )

        if (result.status >= 200 && result.status < 300) {
          sent += 1
          await updateDeliveryStatus(serviceClient, row.id, {
            status: 'sent',
            delivered_at: new Date().toISOString(),
            provider_status_code: result.status,
          })
          continue
        }

        if (result.status === 404 || result.status === 410) {
          expired += 1
          await serviceClient
            .from('push_subscriptions')
            .update({
              is_active: false,
              last_seen_at: new Date().toISOString(),
            })
            .eq('id', subscription.id)

          await updateDeliveryStatus(serviceClient, row.id, {
            status: 'expired',
            provider_status_code: result.status,
            error_message: result.body || 'Push endpoint expired',
          })
          continue
        }

        failed += 1
        await updateDeliveryStatus(serviceClient, row.id, {
          status: 'failed',
          provider_status_code: result.status,
          error_message: result.body || `Push provider returned ${result.status}`,
        })
      } catch (error) {
        failed += 1
        await updateDeliveryStatus(serviceClient, row.id, {
          status: 'failed',
          error_message: String(error),
        })
      }
    }

    return json({
      ok: true,
      processed,
      sent,
      failed,
      expired,
    })
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

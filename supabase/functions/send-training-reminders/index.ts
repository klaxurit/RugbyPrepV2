import { corsHeaders, json } from '../_shared/http.ts'
import { createClients } from '../_shared/supabase.ts'

type PushSubscriptionRow = {
  id: string
  user_id: string
  training_days: number[]
  timezone: string | null
}

type NotificationPreferenceRow = {
  user_id: string
  push_enabled: boolean
  training_reminder_enabled: boolean
  reminder_hour: number
  quiet_hours_start: string
  quiet_hours_end: string
}

type UserEntitlementRow = {
  user_id: string
  entitlement_key: string
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const parseTimeToMinutes = (value: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  return hours * 60 + minutes
}

const isWithinQuietHours = (minutes: number, start: string, end: string): boolean => {
  const startMinutes = parseTimeToMinutes(start)
  const endMinutes = parseTimeToMinutes(end)

  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) {
    return false
  }

  if (startMinutes < endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes
  }

  return minutes >= startMinutes || minutes < endMinutes
}

const getLocalClock = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon'
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')

  return {
    weekdayIndex: WEEKDAY_INDEX[weekday] ?? 1,
    hour,
    minute,
    minutesOfDay: hour * 60 + minute,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const cronSecret = Deno.env.get('CRON_SHARED_SECRET')
  if (!cronSecret) {
    return json({ error: 'Cron secret not configured' }, 500)
  }
  if (req.headers.get('x-cron-secret') !== cronSecret) {
    return json({ error: 'Invalid cron secret' }, 401)
  }

  const { serviceClient } = createClients(req)

  try {
    const now = new Date()
    const { data: subscriptionsData, error: subscriptionsError } = await serviceClient
      .from('push_subscriptions')
      .select('id, user_id, training_days, timezone')
      .eq('is_active', true)
      .not('user_id', 'is', null)

    if (subscriptionsError) return json({ error: subscriptionsError.message }, 400)

    const subscriptions = (subscriptionsData ?? []) as PushSubscriptionRow[]
    if (subscriptions.length === 0) {
      return json({
        ok: true,
        processed: 0,
        queued: 0,
        skipped: 0,
        reason: 'No active subscriptions',
      })
    }

    const userIds = [...new Set(subscriptions.map((row) => row.user_id))]

    const [preferencesResult, entitlementsResult] = await Promise.all([
      serviceClient
        .from('notification_preferences')
        .select('user_id, push_enabled, training_reminder_enabled, reminder_hour, quiet_hours_start, quiet_hours_end')
        .in('user_id', userIds),
      serviceClient
        .from('user_entitlements')
        .select('user_id, entitlement_key')
        .in('user_id', userIds)
        .eq('status', 'active'),
    ])

    if (preferencesResult.error) return json({ error: preferencesResult.error.message }, 400)
    if (entitlementsResult.error) return json({ error: entitlementsResult.error.message }, 400)

    const preferencesByUser = new Map<string, NotificationPreferenceRow>(
      ((preferencesResult.data ?? []) as NotificationPreferenceRow[]).map((row) => [row.user_id, row]),
    )

    const entitlementsByUser = new Map<string, Set<string>>()
    for (const row of ((entitlementsResult.data ?? []) as UserEntitlementRow[])) {
      const current = entitlementsByUser.get(row.user_id) ?? new Set<string>()
      current.add(row.entitlement_key)
      entitlementsByUser.set(row.user_id, current)
    }

    const deliveryRows: Array<Record<string, unknown>> = []
    let queued = 0
    let skipped = 0

    for (const subscription of subscriptions) {
      const preferences = preferencesByUser.get(subscription.user_id)
      const entitlements = entitlementsByUser.get(subscription.user_id) ?? new Set<string>()
      const timeZone = subscription.timezone || 'Europe/Paris'

      const skip = (reason: string) => {
        skipped += 1
        deliveryRows.push({
          user_id: subscription.user_id,
          push_subscription_id: subscription.id,
          template_key: 'training_reminder_skipped',
          channel: 'push',
          status: 'skipped',
          scheduled_for: now.toISOString(),
          skipped_reason: reason,
          payload: {
            timezone: timeZone,
          },
        })
      }

      if (!preferences || !preferences.push_enabled || !preferences.training_reminder_enabled) {
        skip('notifications_disabled')
        continue
      }

      if (!entitlements.has('notifications_basic')) {
        skip('missing_notifications_entitlement')
        continue
      }

      const localClock = getLocalClock(now, timeZone)

      if (!subscription.training_days.includes(localClock.weekdayIndex)) {
        skip('not_training_day')
        continue
      }

      if (localClock.hour !== preferences.reminder_hour) {
        skip('outside_reminder_hour')
        continue
      }

      if (isWithinQuietHours(localClock.minutesOfDay, preferences.quiet_hours_start, preferences.quiet_hours_end)) {
        skip('quiet_hours')
        continue
      }

      const hasAdvancedNotifications = entitlements.has('advanced_notifications')
      const templateKey = hasAdvancedNotifications
        ? 'training_reminder_advanced'
        : 'training_reminder_standard'

      queued += 1
      deliveryRows.push({
        user_id: subscription.user_id,
        push_subscription_id: subscription.id,
        template_key: templateKey,
        channel: 'push',
        status: 'queued',
        scheduled_for: now.toISOString(),
        payload: {
          timezone: timeZone,
          reminderHour: preferences.reminder_hour,
          trainingDay: localClock.weekdayIndex,
          tier: hasAdvancedNotifications ? 'advanced' : 'basic',
        },
      })
    }

    if (deliveryRows.length > 0) {
      const { error: insertError } = await serviceClient
        .from('notification_delivery_logs')
        .insert(deliveryRows)

      if (insertError) return json({ error: insertError.message }, 400)
    }

    return json({
      ok: true,
      processed: subscriptions.length,
      queued,
      skipped,
      logsCreated: deliveryRows.length,
      note: 'This function currently schedules and logs reminders. Wire the push transport after VAPID/server delivery is ready.',
    })
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

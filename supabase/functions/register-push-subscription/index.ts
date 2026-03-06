import { corsHeaders, json } from '../_shared/http.ts'
import { requireUser } from '../_shared/supabase.ts'

interface RegisterPushBody {
  endpoint: string
  p256dhKey: string
  authKey: string
  trainingDays: number[]
  timezone?: string
  userAgent?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  try {
    const body = await req.json() as RegisterPushBody
    const trainingDays = Array.isArray(body.trainingDays)
      ? [...new Set(body.trainingDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
      : []

    if (!body.endpoint || !body.p256dhKey || !body.authKey) {
      return json({ error: 'Missing push subscription payload' }, 400)
    }

    const { data, error } = await serviceClient
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: body.endpoint,
          p256dh_key: body.p256dhKey,
          auth_key: body.authKey,
          training_days: trainingDays,
          timezone: body.timezone ?? 'Europe/Paris',
          user_agent: body.userAgent ?? req.headers.get('user-agent') ?? null,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      )
      .select('id, endpoint, training_days, timezone, is_active')
      .single()

    if (error) return json({ error: error.message }, 400)

    await serviceClient
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          push_enabled: true,
          timezone: body.timezone ?? 'Europe/Paris',
        },
        { onConflict: 'user_id' },
      )

    return json({
      ok: true,
      subscription: data,
    })
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

import { corsHeaders, json } from '../_shared/http.ts'
import { requireUser } from '../_shared/supabase.ts'

interface UnsubscribeBody {
  endpoint: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  try {
    const body = await req.json() as UnsubscribeBody
    if (!body.endpoint) return json({ error: 'Missing endpoint' }, 400)

    const { error } = await serviceClient
      .from('push_subscriptions')
      .update({
        is_active: false,
        last_seen_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('endpoint', body.endpoint)

    if (error) return json({ error: error.message }, 400)

    const { count } = await serviceClient
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if ((count ?? 0) === 0) {
      await serviceClient
        .from('notification_preferences')
        .update({ push_enabled: false })
        .eq('user_id', user.id)
    }

    return json({ ok: true })
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

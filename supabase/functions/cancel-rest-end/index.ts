import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  try {
    const { error } = await serviceClient
      .from('notification_delivery_logs')
      .update({ status: 'skipped', skipped_reason: 'timer_cancelled' })
      .eq('user_id', user.id)
      .eq('template_key', 'rest_end')
      .in('status', ['queued', 'processing'])

    if (error) return json({ error: error.message }, 400)

    return json({ ok: true })
  } catch (error) {
    await captureEdgeException(error, { function: 'cancel-rest-end' })
    return json({ error: String(error) }, 500)
  }
})

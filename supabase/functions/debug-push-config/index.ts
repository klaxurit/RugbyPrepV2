import { corsHeaders, json } from '../_shared/http.ts'
import { requireUser } from '../_shared/supabase.ts'

interface DebugPushBody {
  frontendPublicKey?: string | null
  subscriptionPublicKey?: string | null
  endpoint?: string | null
}

const normalize = (value: string | null | undefined): string =>
  (value ?? '').trim().replace(/^['"]|['"]$/g, '')

const preview = (value: string): string | null => {
  if (!value) return null
  if (value.length <= 24) return value
  return `${value.slice(0, 12)}...${value.slice(-12)}`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  try {
    const body = await req.json().catch(() => ({})) as DebugPushBody
    const backendPublicKey = normalize(Deno.env.get('VAPID_PUBLIC_KEY'))
    const frontendPublicKey = normalize(body.frontendPublicKey)
    const subscriptionPublicKey = normalize(body.subscriptionPublicKey)

    return json({
      ok: true,
      backendPublicKeyPreview: preview(backendPublicKey),
      backendPublicKeyLength: backendPublicKey.length,
      frontendPublicKeyPreview: preview(frontendPublicKey),
      frontendPublicKeyLength: frontendPublicKey.length,
      subscriptionPublicKeyPreview: preview(subscriptionPublicKey),
      subscriptionPublicKeyLength: subscriptionPublicKey.length,
      frontendMatchesBackend: Boolean(frontendPublicKey) && frontendPublicKey === backendPublicKey,
      subscriptionMatchesBackend: Boolean(subscriptionPublicKey) && subscriptionPublicKey === backendPublicKey,
      frontendMatchesSubscription: Boolean(frontendPublicKey) && frontendPublicKey === subscriptionPublicKey,
      endpointPreview: preview(normalize(body.endpoint)),
      origin: req.headers.get('origin'),
      userId: user.id,
    })
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

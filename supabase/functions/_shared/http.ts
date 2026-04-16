const ALLOWED_ORIGINS = new Set([
  'https://rugbyforge.fr',
  'https://www.rugbyforge.fr',
  'https://rugbyforge.pages.dev',
])

export function getCorsOrigin(req?: Request): string {
  const origin = req?.headers.get('origin') ?? ''
  return ALLOWED_ORIGINS.has(origin) ? origin : 'https://rugbyforge.fr'
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://rugbyforge.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

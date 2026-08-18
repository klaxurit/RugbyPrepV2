import { Capacitor, CapacitorHttp } from '@capacitor/core'

export const FFR_GRAPHQL_URL = 'https://api-agregateur.ffr.fr/graphql'

/**
 * POST GraphQL FFR.
 *
 * Sur le web desktop, `fetch` passe (origine https://rugbyforge.fr, CORS FFR OK).
 * Play/TWA : le fetch FFR peut échouer (CSP SW, DNS opérateur) alors que
 * Supabase répond — `requestFfrGraphql` proxy alors via l’Edge Function.
 * WKWebView Capacitor : origine `capacitor://localhost`, CORS bloqué ;
 * CapacitorHttp passe par URLSession.
 *
 * User-Agent Safari : l’Edge Function Deno se prenait un 403 FFR.
 */
const NATIVE_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

export interface FfrGraphqlResponse {
  ok: boolean
  status: number
  json: unknown
}

function parseBody(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as unknown
    } catch {
      return null
    }
  }
  return data
}

export async function postFfrGraphql(
  query: string,
  variables: Record<string, unknown>,
): Promise<FfrGraphqlResponse> {
  const payload = { query, variables }

  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.post({
      url: FFR_GRAPHQL_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': NATIVE_SAFARI_UA,
      },
      data: payload,
    })
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: parseBody(response.data),
    }
  }

  const res = await fetch(FFR_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  return {
    ok: res.ok,
    status: res.status,
    json: await res.json().catch(() => null),
  }
}

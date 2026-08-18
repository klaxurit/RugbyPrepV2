import { supabase } from '../supabase/client'
import { postFfrGraphql, type FfrGraphqlResponse } from './postFfrGraphql'

async function proxyFfrGraphqlViaEdge(
  query: string,
  variables: Record<string, unknown>,
): Promise<FfrGraphqlResponse> {
  await supabase.auth.refreshSession()
  const { data, error } = await supabase.functions.invoke('ffr-sync', {
    body: { action: 'proxy_graphql', query, variables },
  })
  if (error) throw new Error(error.message || String(error))
  if (data?.error === 'unauthorized') throw new Error('unauthorized')
  return {
    ok: Boolean(data?.ok),
    status: typeof data?.status === 'number' ? data.status : 0,
    json: data?.json ?? null,
  }
}

/**
 * GraphQL FFR : fetch navigateur d’abord (PC), puis proxy Edge si le
 * téléphone/TWA ne peut pas joindre api-agregateur.ffr.fr (CSP cache, CORS, DNS).
 */
export async function requestFfrGraphql(
  query: string,
  variables: Record<string, unknown>,
): Promise<FfrGraphqlResponse> {
  try {
    const direct = await postFfrGraphql(query, variables)
    if (direct.ok) return direct
    console.warn('[ffrGraphql] direct HTTP', direct.status, '→ proxy edge')
  } catch (err) {
    console.warn('[ffrGraphql] direct fetch failed → proxy edge', err)
  }
  return proxyFfrGraphqlViaEdge(query, variables)
}

export function isFfrUpstreamSyncError(error: string): boolean {
  const code = error.toLowerCase()
  return (
    code === 'ffr_unavailable' ||
    code === 'missing_matches' ||
    code.startsWith('ffr_http_') ||
    code.startsWith('ffr_graphql')
  )
}

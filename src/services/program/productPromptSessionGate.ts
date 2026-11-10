/**
 * Gate centralisé « prompts produit » (newsletter in-app, nouveautés, …) :
 * SoT = séances gym terminées côté serveur, pas un flag de navigation local.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { hasCompletedGymSessionForProductPrompts } from './inSeasonVarietyNotice'

/** Types exclus du comptage gym (alignés sur countCompletedGymSessionsForProductPrompts). */
export const PRODUCT_PROMPT_EXCLUDED_SESSION_TYPES = [
  'ACTIVE_RECOVERY',
  'RECOVERY',
] as const

export type ProductPromptSessionGateState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; completedGymSessionCount: number }
  /** Échec lecture : on refuse le prompt (fail-closed). */
  | { status: 'error' }

/**
 * Éligible uniquement quand le serveur a répondu et qu’il y a ≥1 séance gym.
 * Pendant loading / idle / error → false (pas de flash sur /profile avant hydratation).
 */
export function isProductPromptSessionGateOpen(
  state: ProductPromptSessionGateState,
): boolean {
  if (state.status !== 'ready') return false
  return hasCompletedGymSessionForProductPrompts({
    completedGymSessionCount: state.completedGymSessionCount,
  })
}

export function productPromptSessionCountFromState(
  state: ProductPromptSessionGateState,
): number {
  return state.status === 'ready' ? state.completedGymSessionCount : 0
}

/**
 * Compte les séances gym terminées pour un user (hors récup).
 * Filtre côté client après fetch pour rester compatible PostgREST.
 */
export async function fetchCompletedGymSessionCountForProductPrompts(
  client: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await client
    .from('session_logs')
    .select('session_type')
    .eq('user_id', userId)

  if (error || !data) {
    throw new Error(error?.message ?? 'session_logs fetch failed')
  }

  const excluded = new Set<string>(PRODUCT_PROMPT_EXCLUDED_SESSION_TYPES)
  return data.filter((row) => {
    const type = typeof row.session_type === 'string' ? row.session_type : ''
    return !excluded.has(type)
  }).length
}

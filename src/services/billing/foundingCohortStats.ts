import { supabase } from '../supabase/client'

export type FoundingCohortStats = {
  cap: number
  issued: number
  accepting_new: boolean
}

/** Returns null when RPC fails — callers should fail-open for display, fail-closed before payment. */
export async function fetchFoundingCohortStats(): Promise<FoundingCohortStats | null> {
  const { data, error } = await supabase.rpc('get_founding_cohort_stats')
  if (error) {
    console.warn('[fetchFoundingCohortStats]', error.message)
    return null
  }
  const row = data as { cap?: unknown; issued?: unknown; accepting_new?: unknown } | null
  if (!row || typeof row.accepting_new !== 'boolean') return null
  return {
    cap: typeof row.cap === 'number' ? row.cap : 100,
    issued: typeof row.issued === 'number' ? row.issued : 0,
    accepting_new: row.accepting_new,
  }
}

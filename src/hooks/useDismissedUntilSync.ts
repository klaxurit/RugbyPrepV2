/**
 * Cross-device sync layer for date-based dismissed-until banners.
 *
 * `useSchedulingTransition` and `useSeasonTransitions` use localStorage with
 * date-based cooldowns ({ type: 'YYYY-MM-DD' }) — fast, offline-safe, well-tested.
 * This helper layers Supabase sync on top: dismiss → write to user_dismissed_hints
 * (best-effort, fire-and-forget) AND fetch on mount to merge remote dismisses
 * into the local store. No regression on read path: localStorage stays the
 * fast source of truth.
 *
 * Hint id format : `<surface>:<type>` (ex: 'season_transition:season_ended').
 */

import { useEffect } from 'react'
import { supabase } from '../services/supabase/client'

const TABLE = 'user_dismissed_hints'

interface DismissedRecord {
  dismissed_at: string
  context_hash: string | null
}

interface MergeOptions {
  userId: string | null
  /** Préfixe des hint_ids à fetch (ex: 'season_transition:'). */
  hintPrefix: string
  /** Lit l'état local courant ({ type: 'YYYY-MM-DD' }). */
  readLocal: () => Record<string, string>
  /** Écrit l'état local fusionné. */
  writeLocal: (data: Record<string, string>) => void
  /** Cooldown en jours appliqué côté local pour les dismiss venus de Supabase. */
  defaultCooldownDays: number
}

/** Fusionne les dismisses Supabase dans le store local au mount. */
export function useMergeRemoteDismisses(opts: MergeOptions) {
  const { userId, hintPrefix, readLocal, writeLocal, defaultCooldownDays } = opts
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select('hint_id, dismissed_at')
          .eq('user_id', userId)
          .like('hint_id', `${hintPrefix}%`)
        if (cancelled || error || !data) return
        const local = readLocal()
        let dirty = false
        for (const row of data as Array<{ hint_id: string; dismissed_at: string }>) {
          const type = row.hint_id.slice(hintPrefix.length)
          if (!type) continue
          const remoteUntil = isoDatePlusDays(row.dismissed_at, defaultCooldownDays)
          const currentUntil = local[type]
          if (!currentUntil || currentUntil < remoteUntil) {
            local[type] = remoteUntil
            dirty = true
          }
        }
        if (dirty) writeLocal(local)
      } catch {
        // best-effort
      }
    })()
    return () => { cancelled = true }
  }, [userId, hintPrefix, readLocal, writeLocal, defaultCooldownDays])
}

/** Best-effort upsert d'un dismiss vers Supabase. Fire-and-forget. */
export function syncDismissToSupabase(
  userId: string | null,
  hintId: string,
  contextHash?: string,
): void {
  if (!userId) return
  void supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        hint_id: hintId,
        dismissed_at: new Date().toISOString(),
        context_hash: contextHash ?? null,
      },
      { onConflict: 'user_id,hint_id' },
    )
    .then(({ error }: { error: unknown }) => {
      if (error) {
        const msg = (error as { message?: string }).message ?? String(error)
        console.warn(`[syncDismissToSupabase] error for ${hintId}:`, msg)
      }
    })
}

/** Fetch tous les dismisses persistés pour ce préfixe — utilisé en lecture immédiate. */
export async function fetchRemoteDismisses(
  userId: string | null,
  hintPrefix: string,
): Promise<Record<string, DismissedRecord>> {
  if (!userId) return {}
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('hint_id, dismissed_at, context_hash')
      .eq('user_id', userId)
      .like('hint_id', `${hintPrefix}%`)
    if (error || !data) return {}
    const out: Record<string, DismissedRecord> = {}
    for (const row of data as Array<{ hint_id: string; dismissed_at: string; context_hash: string | null }>) {
      const type = row.hint_id.slice(hintPrefix.length)
      if (!type) continue
      out[type] = { dismissed_at: row.dismissed_at, context_hash: row.context_hash }
    }
    return out
  } catch {
    return {}
  }
}

function isoDatePlusDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

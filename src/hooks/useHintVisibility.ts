import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { useHistory } from './useHistory'

/**
 * Coaching hint visibility primitive.
 *
 * Centralise la décision « ce hint est-il encore pertinent ? » pour tous les
 * messages que l'app pousse à l'utilisateur (bannières, mascotte, CTA).
 *
 * Sources de masquage :
 *  1. Dismiss explicite — persisté dans Supabase (table user_dismissed_hints)
 *  2. Cooldown (`cooldownDays`) — réapparaît après N jours
 *  3. Expiration usage (`expireAfterSessions`) — masqué une fois N séances loggées
 *  4. Context hash — si le contexte du hint change (ex : nouvelle phase),
 *     le dismiss précédent est invalidé et le hint réapparaît.
 *
 * Optimistic local state pour éviter les flashs au mount.
 */

const TABLE = 'user_dismissed_hints'

export interface UseHintVisibilityOptions {
  /** Nombre de jours après dismiss avant que le hint puisse réapparaître. Défaut : permanent. */
  cooldownDays?: number
  /** Nombre de séances loggées au-delà duquel le hint expire automatiquement. */
  expireAfterSessions?: number
  /** Hash du contenu/contexte. Si change vs valeur stockée → on ré-affiche. */
  contextHash?: string
}

export interface UseHintVisibilityResult {
  visible: boolean
  dismiss: () => void
  loading: boolean
}

interface DismissRecord {
  dismissed_at: string
  context_hash: string | null
  loggedSessionsAtDismiss: number
}

const LOCAL_CACHE_PREFIX = 'rugbyforge.hintvis.'

function readLocalCache(userId: string | null, hintId: string): DismissRecord | null {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(`${LOCAL_CACHE_PREFIX}${userId}.${hintId}`)
    if (!raw) return null
    return JSON.parse(raw) as DismissRecord
  } catch {
    return null
  }
}

function writeLocalCache(userId: string | null, hintId: string, record: DismissRecord) {
  if (!userId) return
  try {
    localStorage.setItem(`${LOCAL_CACHE_PREFIX}${userId}.${hintId}`, JSON.stringify(record))
  } catch { /* ignore */ }
}

function isStillHidden(
  record: DismissRecord,
  now: number,
  opts: UseHintVisibilityOptions,
  loggedSessionsNow: number,
): boolean {
  // Context changed → invalidate dismiss.
  if (opts.contextHash && opts.contextHash !== (record.context_hash ?? '')) {
    return false
  }
  // Cooldown elapsed → re-show.
  if (opts.cooldownDays != null) {
    const elapsedMs = now - new Date(record.dismissed_at).getTime()
    if (elapsedMs > opts.cooldownDays * 24 * 60 * 60 * 1000) {
      return false
    }
  }
  // Hint already explicitly dismissed → keep hidden until cooldown/context change above
  // overrides. Only relevant when no cooldown and no context change.
  // expireAfterSessions is independent (handled in main hook): if user has logged enough
  // sessions, the hint should auto-hide regardless of dismiss state.
  void loggedSessionsNow
  return true
}

export function useHintVisibility(
  hintId: string,
  options: UseHintVisibilityOptions = {},
): UseHintVisibilityResult {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const { logs } = useHistory()
  const loggedSessions = logs.length

  const [record, setRecord] = useState<DismissRecord | null>(() => readLocalCache(userId, hintId))
  const [loading, setLoading] = useState(true)

  // Sync from Supabase on mount / userId change.
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select('dismissed_at, context_hash')
          .eq('user_id', userId)
          .eq('hint_id', hintId)
          .maybeSingle()
        if (cancelled) return
        if (!error && data) {
          const next: DismissRecord = {
            dismissed_at: data.dismissed_at,
            context_hash: data.context_hash,
            loggedSessionsAtDismiss: 0,
          }
          setRecord(next)
          writeLocalCache(userId, hintId, next)
        } else if (!error && !data) {
          setRecord(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [userId, hintId])

  const visible = useMemo(() => {
    // Auto-expire après N séances loggées (indépendant du dismiss explicite).
    if (
      options.expireAfterSessions != null &&
      loggedSessions >= options.expireAfterSessions
    ) {
      return false
    }
    if (!record) return true
    return !isStillHidden(record, Date.now(), options, loggedSessions)
  }, [record, options, loggedSessions])

  const dismiss = useCallback(() => {
    if (!userId) {
      // Anonymous : optimistic only, no persistence.
      const next: DismissRecord = {
        dismissed_at: new Date().toISOString(),
        context_hash: options.contextHash ?? null,
        loggedSessionsAtDismiss: loggedSessions,
      }
      setRecord(next)
      return
    }
    const next: DismissRecord = {
      dismissed_at: new Date().toISOString(),
      context_hash: options.contextHash ?? null,
      loggedSessionsAtDismiss: loggedSessions,
    }
    setRecord(next)
    writeLocalCache(userId, hintId, next)
    // Fire-and-forget upsert.
    void supabase
      .from(TABLE)
      .upsert(
        {
          user_id: userId,
          hint_id: hintId,
          dismissed_at: next.dismissed_at,
          context_hash: next.context_hash,
        },
        { onConflict: 'user_id,hint_id' },
      )
  }, [userId, hintId, options.contextHash, loggedSessions])

  return { visible, dismiss, loading }
}

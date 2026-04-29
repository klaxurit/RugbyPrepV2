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
 *  1. Dismiss explicite — persisté localement (localStorage) + Supabase pour
 *     sync cross-device best-effort.
 *  2. Cooldown (`cooldownDays`) — réapparaît après N jours.
 *  3. Expiration usage (`expireAfterSessions`) — masqué une fois N séances loggées.
 *  4. Context hash — si le contexte du hint change (ex : nouvelle phase),
 *     le dismiss précédent est invalidé et le hint réapparaît.
 *
 * Architecture : localStorage est la SOURCE DE VÉRITÉ. Supabase est un sync
 * best-effort pour propager les dismiss entre appareils. Une erreur réseau ou
 * un échec d'upsert n'empêche jamais le dismiss d'être respecté localement.
 */

const TABLE = 'user_dismissed_hints'

export interface UseHintVisibilityOptions {
  cooldownDays?: number
  expireAfterSessions?: number
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
}

const LOCAL_CACHE_PREFIX = 'rugbyforge.hintvis.'

function cacheKey(userId: string | null, hintId: string): string {
  return `${LOCAL_CACHE_PREFIX}${userId ?? 'anon'}.${hintId}`
}

function readLocalCache(userId: string | null, hintId: string): DismissRecord | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId, hintId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as DismissRecord
    if (!parsed.dismissed_at) return null
    return parsed
  } catch {
    return null
  }
}

function writeLocalCache(userId: string | null, hintId: string, record: DismissRecord) {
  try {
    localStorage.setItem(cacheKey(userId, hintId), JSON.stringify(record))
  } catch { /* ignore */ }
}

function isStillHidden(
  record: DismissRecord,
  now: number,
  opts: UseHintVisibilityOptions,
): boolean {
  if (opts.contextHash && opts.contextHash !== (record.context_hash ?? '')) {
    return false
  }
  if (opts.cooldownDays != null) {
    const elapsedMs = now - new Date(record.dismissed_at).getTime()
    if (elapsedMs > opts.cooldownDays * 24 * 60 * 60 * 1000) {
      return false
    }
  }
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

  // Source de vérité = localStorage. Re-lue quand userId change (sinon un userId
  // null au premier render ne lirait jamais le cache une fois auth hydratée).
  const [record, setRecord] = useState<DismissRecord | null>(() => readLocalCache(userId, hintId))
  const [loading, setLoading] = useState(true)

  // Re-sync depuis localStorage quand userId / hintId change.
  useEffect(() => {
    setRecord(readLocalCache(userId, hintId))
  }, [userId, hintId])

  // Sync best-effort depuis Supabase (cross-device). N'écrase jamais l'état
  // local avec null si la DB renvoie vide — le local reste la vérité.
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
        if (error) {
          console.warn(`[useHintVisibility] fetch error for ${hintId}:`, error.message)
          return
        }
        if (data) {
          const next: DismissRecord = {
            dismissed_at: data.dismissed_at,
            context_hash: data.context_hash,
          }
          // Garde la trace la plus récente (Supabase OU local).
          const local = readLocalCache(userId, hintId)
          const localTs = local ? new Date(local.dismissed_at).getTime() : 0
          const remoteTs = new Date(next.dismissed_at).getTime()
          if (remoteTs >= localTs) {
            setRecord(next)
            writeLocalCache(userId, hintId, next)
          }
        }
        // !data → ne rien faire : le local cache fait foi.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [userId, hintId])

  const visible = useMemo(() => {
    if (
      options.expireAfterSessions != null &&
      loggedSessions >= options.expireAfterSessions
    ) {
      return false
    }
    if (!record) return true
    return !isStillHidden(record, Date.now(), options)
  }, [record, options, loggedSessions])

  const dismiss = useCallback(() => {
    const next: DismissRecord = {
      dismissed_at: new Date().toISOString(),
      context_hash: options.contextHash ?? null,
    }
    // 1. Persiste IMMÉDIATEMENT en local (vérité).
    writeLocalCache(userId, hintId, next)
    setRecord(next)

    // 2. Sync best-effort vers Supabase (cross-device). Logue les erreurs
    // pour qu'on les voie pendant le dev — mais n'affecte jamais le local.
    if (userId) {
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
        .then(({ error }) => {
          if (error) {
            console.warn(`[useHintVisibility] dismiss persist error for ${hintId}:`, error.message)
          }
        })
    }
  }, [userId, hintId, options.contextHash])

  return { visible, dismiss, loading }
}

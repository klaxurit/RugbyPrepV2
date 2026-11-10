import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import {
  fetchCompletedGymSessionCountForProductPrompts,
  type ProductPromptSessionGateState,
} from '../services/program/productPromptSessionGate'
import { HISTORY_CHANGED_EVENT } from '../services/history/historyEvents'

type FetchedGate = {
  userId: string
  state: Exclude<ProductPromptSessionGateState, { status: 'idle' }>
}

/**
 * Gate hydraté depuis `session_logs` (serveur). Refetch au focus / visibility
 * et après mutation d’historique (même onglet ou via event local).
 */
export function useProductPromptSessionGate(
  userId: string | null | undefined,
): ProductPromptSessionGateState {
  const [fetched, setFetched] = useState<FetchedGate | null>(null)

  const refresh = useCallback(async (uid: string) => {
    try {
      const count = await fetchCompletedGymSessionCountForProductPrompts(supabase, uid)
      setFetched({ userId: uid, state: { status: 'ready', completedGymSessionCount: count } })
    } catch {
      setFetched({ userId: uid, state: { status: 'error' } })
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    void fetchCompletedGymSessionCountForProductPrompts(supabase, userId)
      .then((count) => {
        if (!cancelled) {
          setFetched({
            userId,
            state: { status: 'ready', completedGymSessionCount: count },
          })
        }
      })
      .catch(() => {
        if (!cancelled) setFetched({ userId, state: { status: 'error' } })
      })

    const onHistoryChanged = () => {
      void refresh(userId)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh(userId)
    }
    const onFocus = () => {
      void refresh(userId)
    }

    window.addEventListener(HISTORY_CHANGED_EVENT, onHistoryChanged)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.removeEventListener(HISTORY_CHANGED_EVENT, onHistoryChanged)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [userId, refresh])

  if (!userId) return { status: 'idle' }
  if (!fetched || fetched.userId !== userId) return { status: 'loading' }
  return fetched.state
}

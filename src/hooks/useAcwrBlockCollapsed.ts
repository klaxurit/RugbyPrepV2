import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { userScopedKey } from '../services/storage/userScopedStorage'

const STORAGE_BASE = 'rugbyprep.acwrBlockCollapsed'

const readCollapsed = (userId: string | null): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(userScopedKey(STORAGE_BASE, userId)) === 'true'
  } catch {
    return false
  }
}

/**
 * État replié du bloc ACWR (surcharge/décharge).
 * Persisté en localStorage user-scoped pour garder la préférence par utilisateur.
 */
export const useAcwrBlockCollapsed = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsed(userId))

  useEffect(() => {
    setCollapsed(readCollapsed(userId))
  }, [userId])

  useEffect(() => {
    try {
      window.localStorage.setItem(userScopedKey(STORAGE_BASE, userId), String(collapsed))
    } catch { /* ignore */ }
  }, [collapsed, userId])

  const toggle = useCallback(() => {
    setCollapsed((c) => !c)
  }, [])

  return { collapsed, toggle }
}

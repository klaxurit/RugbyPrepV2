import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { userScopedKey } from '../services/storage/userScopedStorage'

const STORAGE_BASE = 'rugbyprep.acwrOverride'

const readOverride = (userId: string | null): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(userScopedKey(STORAGE_BASE, userId)) === 'true'
  } catch {
    return false
  }
}

/**
 * Permet au joueur de choisir de garder le programme complet (Lower + Upper)
 * malgré une surcharge ACWR détectée, s'il ne ressent pas de fatigue.
 */
export const useAcwrOverride = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [ignoreAcwrOverload, setIgnoreAcwrOverload] = useState<boolean>(() => readOverride(userId))

  useEffect(() => {
    setIgnoreAcwrOverload(readOverride(userId))
  }, [userId])

  useEffect(() => {
    try {
      window.localStorage.setItem(userScopedKey(STORAGE_BASE, userId), String(ignoreAcwrOverload))
    } catch { /* ignore */ }
  }, [ignoreAcwrOverload, userId])

  const setOverride = useCallback((value: boolean) => {
    setIgnoreAcwrOverload(value)
  }, [])

  return { ignoreAcwrOverload, setOverride }
}

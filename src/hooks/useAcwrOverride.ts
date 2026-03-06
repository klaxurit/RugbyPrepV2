import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'rugbyprep.acwrOverride.v1'

const readOverride = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Permet au joueur de choisir de garder le programme complet (Lower + Upper)
 * malgré une surcharge ACWR détectée, s'il ne ressent pas de fatigue.
 */
export const useAcwrOverride = () => {
  const [ignoreAcwrOverload, setIgnoreAcwrOverload] = useState(readOverride)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(ignoreAcwrOverload))
  }, [ignoreAcwrOverload])

  const setOverride = useCallback((value: boolean) => {
    setIgnoreAcwrOverload(value)
  }, [])

  return { ignoreAcwrOverload, setOverride }
}

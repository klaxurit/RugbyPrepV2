import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'rugbyprep.acwrBlockCollapsed.v1'

const readCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * État replié du bloc ACWR (surcharge/décharge).
 * Persisté en localStorage pour garder la préférence entre les pages.
 */
export const useAcwrBlockCollapsed = () => {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  const toggle = useCallback(() => {
    setCollapsed((c) => !c)
  }, [])

  return { collapsed, toggle }
}

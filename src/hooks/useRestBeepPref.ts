import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'rf.restBeep.enabled.v1'
const DEFAULT_ENABLED = true

function read(): boolean {
  if (typeof window === 'undefined') return DEFAULT_ENABLED
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw == null) return DEFAULT_ENABLED
    return raw === '1'
  } catch {
    return DEFAULT_ENABLED
  }
}

function write(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // ignore quota errors
  }
}

/**
 * Persistent on/off toggle for the end-of-rest beep.
 * Shared across the app via a small storage event subscription so toggling
 * in the profile updates the live overlay immediately.
 */
export function useRestBeepPref(): { enabled: boolean; setEnabled: (next: boolean) => void } {
  const [enabled, setEnabledState] = useState<boolean>(() => read())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setEnabledState(read())
    }
    const onLocal = () => setEnabledState(read())
    window.addEventListener('storage', onStorage)
    window.addEventListener('rf.restBeep.changed', onLocal)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('rf.restBeep.changed', onLocal)
    }
  }, [])

  const setEnabled = useCallback((next: boolean) => {
    write(next)
    setEnabledState(next)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('rf.restBeep.changed'))
    }
  }, [])

  return { enabled, setEnabled }
}

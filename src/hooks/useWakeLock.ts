import { useEffect, useRef } from 'react'

type WakeLockSentinelLike = {
  release: () => Promise<void>
  addEventListener?: (type: 'release', handler: () => void) => void
}

type WakeLockLike = {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>
}

/**
 * Garde l'écran allumé tant que `active` est vrai. Gère la reprise automatique quand
 * l'utilisateur revient sur l'onglet (le navigateur libère le sentinel dans ce cas).
 * No-op silencieux quand l'API n'est pas disponible (ex. Safari iOS < 16.4, WebView).
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null)

  useEffect(() => {
    if (!active) return
    if (typeof navigator === 'undefined') return
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock
    if (!wakeLock) return

    let cancelled = false

    const request = async () => {
      try {
        const sentinel = await wakeLock.request('screen')
        if (cancelled) {
          sentinel.release().catch(() => {})
          return
        }
        sentinelRef.current = sentinel
      } catch {
        // Permission denied / not supported on this page — fail silent.
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && sentinelRef.current == null && !cancelled) {
        request()
      }
    }

    request()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      if (sentinel) {
        sentinel.release().catch(() => {})
      }
    }
  }, [active])
}

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  applyOverlayClaim,
  applyOverlayRelease,
  type OverlayKind,
} from '../services/ui/overlayGate'
import { OverlayGateContext, type OverlayGateContextValue } from './overlayGateCtx'

export function OverlayGateProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<OverlayKind | null>(null)
  const activeRef = useRef<OverlayKind | null>(null)

  const claim = useCallback((kind: OverlayKind): boolean => {
    const next = applyOverlayClaim(activeRef.current, kind)
    if (next !== activeRef.current) {
      activeRef.current = next
      setActive(next)
    }
    return next === kind
  }, [])

  const release = useCallback((kind: OverlayKind) => {
    const next = applyOverlayRelease(activeRef.current, kind)
    if (next !== activeRef.current) {
      activeRef.current = next
      setActive(next)
    }
  }, [])

  const value = useMemo<OverlayGateContextValue>(
    () => ({
      active,
      hasBlockingOverlay: active != null,
      claim,
      release,
    }),
    [active, claim, release],
  )

  return (
    <OverlayGateContext.Provider value={value}>{children}</OverlayGateContext.Provider>
  )
}

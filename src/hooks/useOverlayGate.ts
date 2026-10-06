import { useContext } from 'react'
import { OverlayGateContext, type OverlayGateContextValue } from '../contexts/overlayGateCtx'

const NOOP: OverlayGateContextValue = {
  active: null,
  hasBlockingOverlay: false,
  claim: () => true,
  release: () => undefined,
}

/** Accès au gate — hors provider : no-op permissif (tests / story). */
export function useOverlayGate(): OverlayGateContextValue {
  return useContext(OverlayGateContext) ?? NOOP
}

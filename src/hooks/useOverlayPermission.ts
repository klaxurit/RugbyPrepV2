import { useContext, useLayoutEffect } from 'react'
import { OverlayGateContext } from '../contexts/overlayGateCtx'
import type { OverlayKind } from '../services/ui/overlayGate'

/**
 * Demande le slot bloquant tant que `requested` est true.
 * Retourne true seulement si ce kind détient le slot (affichage autorisé).
 *
 * Hors `OverlayGateProvider` (tests / story) : pas de gate → `requested` tel quel.
 * Re-tente quand un overlay plus prioritaire libère le slot.
 */
export function useOverlayPermission(kind: OverlayKind, requested: boolean): boolean {
  const ctx = useContext(OverlayGateContext)

  useLayoutEffect(() => {
    if (!ctx) return
    if (!requested) {
      ctx.release(kind)
      return
    }
    ctx.claim(kind)
    return () => {
      ctx.release(kind)
    }
  }, [requested, kind, ctx])

  useLayoutEffect(() => {
    if (!ctx || !requested) return
    if (ctx.active !== kind) ctx.claim(kind)
  }, [ctx, ctx?.active, requested, kind])

  if (!ctx) return requested
  return requested && ctx.active === kind
}

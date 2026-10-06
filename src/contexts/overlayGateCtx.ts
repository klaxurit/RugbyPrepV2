import { createContext } from 'react'
import type { OverlayKind } from '../services/ui/overlayGate'

export type OverlayGateContextValue = {
  /** Kind actuellement autorisé à s’afficher (bloquant). */
  active: OverlayKind | null
  /** True si un bloquant détient le slot. */
  hasBlockingOverlay: boolean
  /**
   * Demande le slot. Succès si libre ou priorité supérieure / même kind.
   * Retourne true si `kind` détient le slot après l’appel.
   */
  claim: (kind: OverlayKind) => boolean
  /** Libère le slot si on le détient. */
  release: (kind: OverlayKind) => void
}

export const OverlayGateContext = createContext<OverlayGateContextValue | null>(null)

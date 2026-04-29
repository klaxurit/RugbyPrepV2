import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/** Un message coaching unitaire — chaque message a son propre cycle de vie de visibilité. */
export interface CoachInfoMessage {
  /** Identifiant stable du hint (ex : 'rule:onboarding_cycle_hint'). */
  id: string
  /** Texte affiché à l'utilisateur. */
  text: string
  /** Hash de contexte pour invalider le dismiss quand le contexte change. */
  contextHash?: string
  /** Callback de dismiss persistant — typiquement câblé à `useHintVisibility().dismiss`. */
  onDismiss?: () => void
}

export interface CoachContextValue {
  /** Label de phase/section affiché en titre du popover */
  phaseLabel?: string
  /** Messages "info programme" (encart bleu) — désormais structurés. */
  infoMessages: CoachInfoMessage[]
  /** Messages "conditionnement compagnon" (encart bordeaux, bullets) */
  companionMessages: string[]
  /** Clé de scope pour le badge "vu" (ex. weekId sur /week, isoDate sur /home) */
  scopeKey: string
  /** Contexte texte passé à /chat quand on clique "Poser une question" */
  chatSeed?: string
}

interface CoachState {
  ctx: CoachContextValue | null
  setCtx: (ctx: CoachContextValue | null) => void
  open: boolean
  openCompanion: () => void
  closeCompanion: () => void
  toggleCompanion: () => void
}

const CoachCtx = createContext<CoachState | undefined>(undefined)

export function CoachProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtxState] = useState<CoachContextValue | null>(null)
  const [open, setOpen] = useState(false)

  const setCtx = useCallback((next: CoachContextValue | null) => {
    setCtxState(next)
  }, [])
  const openCompanion = useCallback(() => setOpen(true), [])
  const closeCompanion = useCallback(() => setOpen(false), [])
  const toggleCompanion = useCallback(() => setOpen((v) => !v), [])

  const value = useMemo(
    () => ({ ctx, setCtx, open, openCompanion, closeCompanion, toggleCompanion }),
    [ctx, setCtx, open, openCompanion, closeCompanion, toggleCompanion],
  )
  return <CoachCtx.Provider value={value}>{children}</CoachCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useCoachContext() {
  const v = useContext(CoachCtx)
  if (!v) throw new Error('useCoachContext must be used within CoachProvider')
  return v
}

/** Ouvre la mascotte. No-op hors d'un CoachProvider — sûr à utiliser dans toute page. */
// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useOpenCompanion(): () => void {
  const v = useContext(CoachCtx)
  return v?.openCompanion ?? (() => {})
}

/**
 * Enregistre le contexte coach pour la page active. Le contexte est
 * automatiquement nettoyé au démontage.
 *
 * Tolérant si aucun CoachProvider n'est monté (no-op) — permet aux tests
 * d'intégration de rendre les pages sans wrapper le Provider.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useRegisterCoachContext(ctx: CoachContextValue | null) {
  const state = useContext(CoachCtx)
  const setCtx = state?.setCtx
  const serialized = ctx ? JSON.stringify(ctx) : null

  useEffect(() => {
    if (!setCtx) return
    setCtx(ctx)
    return () => setCtx(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, setCtx])
}

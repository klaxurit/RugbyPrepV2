import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface CoachContextValue {
  /** Label de phase/section affiché en titre du popover */
  phaseLabel?: string
  /** Messages "info programme" (encart bleu) */
  infoMessages: string[]
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
}

const CoachCtx = createContext<CoachState | undefined>(undefined)

export function CoachProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtxState] = useState<CoachContextValue | null>(null)
  const setCtx = useCallback((next: CoachContextValue | null) => {
    setCtxState(next)
  }, [])
  const value = useMemo(() => ({ ctx, setCtx }), [ctx, setCtx])
  return <CoachCtx.Provider value={value}>{children}</CoachCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useCoachContext() {
  const v = useContext(CoachCtx)
  if (!v) throw new Error('useCoachContext must be used within CoachProvider')
  return v
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
  // Stringify pour détecter un vrai changement de contenu (les pages passent
  // souvent un nouvel objet identity à chaque render).
  const serialized = ctx ? JSON.stringify(ctx) : null

  useEffect(() => {
    if (!setCtx) return
    setCtx(ctx)
    return () => setCtx(null)
    // Re-run uniquement quand le contenu sérialisé change ; ctx est capturé
    // dans la closure du render correspondant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, setCtx])
}

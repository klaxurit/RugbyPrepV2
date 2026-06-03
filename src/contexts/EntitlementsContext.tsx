import { createContext, useContext, type ReactNode } from 'react'
import { useEntitlements } from '../hooks/useEntitlements'

type EntitlementsValue = ReturnType<typeof useEntitlements>

const EntitlementsContext = createContext<EntitlementsValue | null>(null)

/**
 * Source partagée des droits (entitlements) montée une seule fois à la racine.
 * Évite de refaire le fetch d'entitlements à chaque navigation pour les
 * consommateurs « globaux » (ex. TierBadge dans le header partagé).
 *
 * Note : `useFeatureAccess` reste volontairement indépendant (gating
 * monétisation) — on ne le branche pas ici pour ne pas modifier le paywall.
 */
export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const value = useEntitlements()
  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>
}

/**
 * Lit le contexte d'entitlements partagé. Renvoie un état neutre (gratuit,
 * non chargé) si aucun provider n'est monté — le composant reste utilisable
 * hors arbre authentifié sans planter.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useEntitlementsContext(): Pick<EntitlementsValue, 'loading' | 'isPremium' | 'isFounding'> {
  const ctx = useContext(EntitlementsContext)
  if (!ctx) {
    return { loading: false, isPremium: false, isFounding: false }
  }
  return { loading: ctx.loading, isPremium: ctx.isPremium, isFounding: ctx.isFounding }
}

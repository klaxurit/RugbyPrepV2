/**
 * V1.1 P4 — Polish copies erreur paiement.
 *
 * Maps the raw error messages bubbled up by Stripe / Play Billing / Supabase
 * Edge Functions into user-readable French sentences. Goal :
 * - No raw stack-trace strings reaching the user.
 * - Suggest a next step when possible (retry, contact, switch device).
 * - Keep technical detail in console.error for prod debug.
 */

const NETWORK_PATTERNS = [
  /networkerror/i,
  /failed to fetch/i,
  /load failed/i,
  /connexion/i,
  /timeout/i,
  /aborted/i,
]

const CARD_DECLINED_PATTERNS = [
  /card.*declin/i,
  /declined/i,
  /insufficient/i,
  /carte.*refus/i,
]

const ALREADY_SUBSCRIBED_PATTERNS = [
  /already.*subscrib/i,
  /already.*active/i,
  /existing.*subscription/i,
]

const SESSION_EXPIRED_PATTERNS = [
  /expired/i,
  /timeout/i,
  /session.*invalid/i,
]

const USER_CANCELLED_PATTERNS = [
  /user.*cancel/i,
  /aborterror/i,
  /not.*allowed/i,
  /canceled/i,
]

const NOT_CONFIGURED_PATTERNS = [
  /no.*price/i,
  /provider_not_configured/i,
  /provider_not_wired/i,
]

const FOUNDING_COHORT_FULL_PATTERNS = [
  /founding_cohort_full/i,
  /100\s+places/i,
  /offre\s+founding\s+est\s+complète/i,
]

/** Maps a raw error string into a user-readable French sentence. */
export function mapCheckoutError(raw: unknown): string {
  if (!raw) return 'Le paiement a échoué. Réessaie dans quelques instants.'

  const message = raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : String(raw)

  if (USER_CANCELLED_PATTERNS.some((p) => p.test(message))) {
    // Silently mapped — caller may choose to suppress display entirely.
    return ''
  }
  if (NETWORK_PATTERNS.some((p) => p.test(message))) {
    return 'Connexion impossible. Vérifie ton accès internet et réessaie.'
  }
  if (CARD_DECLINED_PATTERNS.some((p) => p.test(message))) {
    return 'Paiement refusé par ta banque. Essaie avec une autre carte ou contacte ton conseiller.'
  }
  if (ALREADY_SUBSCRIBED_PATTERNS.some((p) => p.test(message))) {
    return 'Tu as déjà un abonnement actif. Recharge l\'app pour voir tes accès.'
  }
  if (SESSION_EXPIRED_PATTERNS.some((p) => p.test(message))) {
    return 'Cette session de paiement a expiré. Recharge la page et recommence.'
  }
  if (NOT_CONFIGURED_PATTERNS.some((p) => p.test(message))) {
    return 'Le paiement n\'est pas encore disponible. Reviens d\'ici quelques heures ou écris-nous à bonjour@rugbyforge.fr.'
  }
  if (FOUNDING_COHORT_FULL_PATTERNS.some((p) => p.test(message))) {
    return 'L\'offre Founding est complète (100 places). Tu peux toujours choisir l\'abonnement Premium standard.'
  }

  // Default fallback — generic but invites retry + contact.
  return 'Le paiement a échoué. Réessaie dans quelques instants. Si le problème persiste, écris-nous à bonjour@rugbyforge.fr.'
}

/** True iff the error matches a "user cancelled" pattern (silent reset advised). */
export function isUserCancelledError(raw: unknown): boolean {
  if (!raw) return false
  const message = raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : String(raw)
  return USER_CANCELLED_PATTERNS.some((p) => p.test(message))
}

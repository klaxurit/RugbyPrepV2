import type { UserProfile } from '../types/training'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BetaEligibilityReason =
  | 'BETA_PAUSED'                // kill switch activé — pause opérationnelle

export interface BetaEligibilityResult {
  isEligible: boolean
  primaryReason: BetaEligibilityReason | null // première raison (pour affichage simplifié)
  reasons: BetaEligibilityReason[]            // liste complète (pour affichage multi-raisons)
}

// ── Messages UX ───────────────────────────────────────────────────────────────

export const BETA_ELIGIBILITY_MESSAGES: Record<
  BetaEligibilityReason,
  { reason: string; detail: string }
> = {
  BETA_PAUSED: {
    reason: 'Programme temporairement indisponible',
    detail:
      "L'accès au programme est temporairement suspendu pour maintenance. Ton compte et ton profil sont conservés. Réessaie dans quelques heures.",
  },
}

// ── Fonction centralisée ──────────────────────────────────────────────────────

/**
 * Vérifie si un profil utilisateur peut accéder au programme.
 *
 * Depuis la V2 launch :
 *   - App réservée aux adultes (ageBand/U18 supprimé de l'onboarding)
 *   - Le moteur annuel gère tous les cycles (off_season, pre_season, in_season, playoffs)
 *   - Les zones sensibles adaptent les exercices au lieu de bloquer
 *   - Seul le kill switch BETA_PAUSED peut bloquer l'accès
 *
 * Kill switch (BETA_PAUSED) :
 *   Pour activer, décommenter la ligne KILL_SWITCH ci-dessous.
 *   Portée : bloque l'accès programme (WeekPage, SessionDetailPage, ProgramPage).
 *   Le reste de l'app (profil, historique, calendrier, chat, mobilité) reste accessible.
 */
export function checkBetaEligibility(profile: UserProfile): BetaEligibilityResult {
  // ── KILL_SWITCH ── Décommenter pour pause immédiate ────────────────────────
  // return { isEligible: false, primaryReason: 'BETA_PAUSED', reasons: ['BETA_PAUSED'] }
  // ─────────────────────────────────────────────────────────────────────────

  // Profile kept in signature for kill switch reactivation
  void profile

  return {
    isEligible: true,
    primaryReason: null,
    reasons: [],
  }
}

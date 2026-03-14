import type { UserProfile } from '../types/training'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BetaEligibilityReason =
  | 'BETA_PAUSED'                // kill switch activé — pause opérationnelle
  | 'SHOULDER_PAIN_LIMITED_GYM' // shoulder_pain + pas de barbell (prioritaire)
  | 'REHAB_ACTIVE'               // rehabInjury défini
  | 'MULTI_INJURIES'             // ≥2 blessures hors shoulder_pain
  | 'SHOULDER_PAIN'              // shoulder_pain seul avec barbell
  | 'OFF_SEASON_NOT_SUPPORTED'   // off_season | pre_season | undefined
  | 'U18_NO_CONSENT'             // u18 ou ageBand non renseigné sans consentement

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
  SHOULDER_PAIN_LIMITED_GYM: {
    reason: "Douleur à l'épaule + équipement sans barre olympique",
    detail:
      "C'est la combinaison la plus dégradée actuellement. Les séances sont fortement incomplètes pour ce profil.",
  },
  REHAB_ACTIVE: {
    reason: 'Programme de réhabilitation actif',
    detail:
      'Les protocoles retour blessure ne sont pas encore disponibles en self-serve. Consulte ton kiné ou coach.',
  },
  MULTI_INJURIES: {
    reason: 'Plusieurs zones sensibles déclarées (2 ou plus)',
    detail:
      "Les combinaisons de blessures n'ont pas encore été testées en self-serve. Consulte un coach.",
  },
  SHOULDER_PAIN: {
    reason: "Douleur à l'épaule active",
    detail:
      'Les séances haut du corps sont fortement dégradées pour ce profil. Support prévu dans une version future.',
  },
  OFF_SEASON_NOT_SUPPORTED: {
    reason: 'Mode saison non supporté ou non renseigné',
    detail: "Seul le mode « en saison » est supporté en bêta. Si ton mode saison n'est pas renseigné, mets-le à jour dans ton profil.",
  },
  U18_NO_CONSENT: {
    reason: "Moins de 18 ans ou âge non confirmé",
    detail:
      "Un accord parental est requis pour accéder au programme, ou ton profil ne renseigne pas ta tranche d'âge. Contacte-nous pour le formaliser.",
  },
}

// ── Fonction centralisée ──────────────────────────────────────────────────────

/**
 * Vérifie si un profil utilisateur est dans le périmètre beta self-serve validé.
 *
 * Ordre de priorité des raisons :
 *   0. BETA_PAUSED               — kill switch opérationnel (priorité absolue)
 *   1. SHOULDER_PAIN_LIMITED_GYM — combinaison la plus dégradée
 *   2. REHAB_ACTIVE              — protocoles non disponibles self-serve
 *   3. MULTI_INJURIES            — combinaisons non testées (hors shoulder_pain)
 *   4. SHOULDER_PAIN             — dégradation upper body
 *   5. OFF_SEASON_NOT_SUPPORTED  — seul in_season validé en beta (undefined = hors périmètre)
 *   6. U18_NO_CONSENT            — consentement requis / âge non confirmé
 *
 * Kill switch (BETA_PAUSED) :
 *   Pour activer, décommenter la ligne KILL_SWITCH ci-dessous.
 *   Portée : bloque l'accès programme (WeekPage, SessionDetailPage, ProgramPage).
 *   Le reste de l'app (profil, historique, calendrier, chat, mobilité) reste accessible.
 *
 * Règle conservative ageBand :
 *   ageBand non renseigné (undefined/null) = inéligible par sécurité.
 *   En pratique, DEFAULT_PROFILE = 'adult' et l'onboarding renseigne toujours ce champ.
 */
export function checkBetaEligibility(profile: UserProfile): BetaEligibilityResult {
  // ── KILL_SWITCH ── Décommenter pour pause immédiate beta self-serve ──────
  // return { isEligible: false, primaryReason: 'BETA_PAUSED', reasons: ['BETA_PAUSED'] }
  // ─────────────────────────────────────────────────────────────────────────

  const reasons: BetaEligibilityReason[] = []
  const injuries = profile.injuries ?? []
  const equipment = profile.equipment ?? []
  // isLimitedGym = pas de barbell. Vrai aussi pour BW_ONLY (equipment: []).
  // Un profil BW_ONLY + shoulder_pain déclenche SHOULDER_PAIN_LIMITED_GYM (pas SHOULDER_PAIN).
  const isLimitedGym = !equipment.includes('barbell')

  // 1. shoulder_pain + limited gym (most specific — captures worst-case degradation)
  if (injuries.includes('shoulder_pain') && isLimitedGym) {
    reasons.push('SHOULDER_PAIN_LIMITED_GYM')
  }

  // 2. rehab actif (indépendant)
  if (profile.rehabInjury != null) {
    reasons.push('REHAB_ACTIVE')
  }

  // 3. multi-blessures : exclure shoulder_pain du comptage pour éviter le double messaging
  //    shoulder_pain est déjà capturé comme raison si présent → ne pas l'ajouter en "multi"
  const injuriesWithoutShoulder = injuries.filter((i) => i !== 'shoulder_pain')
  if (injuriesWithoutShoulder.length >= 2) {
    reasons.push('MULTI_INJURIES')
  }

  // 4. shoulder_pain seul avec barbell
  if (injuries.includes('shoulder_pain') && !isLimitedGym) {
    reasons.push('SHOULDER_PAIN')
  }

  // 5. Règle conservative : seul 'in_season' explicite est dans le périmètre beta.
  //    off_season, pre_season, ET seasonMode absent (undefined) = hors périmètre.
  //    Cohérent avec ageBand : champ critique absent = profil incomplet = inéligible.
  if (profile.seasonMode !== 'in_season') {
    reasons.push('OFF_SEASON_NOT_SUPPORTED')
  }

  // 6. U18 sans consentement — règle conservative :
  //    ageBand non renseigné (undefined) = profil incomplet = inéligible
  const ageIsAdult = profile.ageBand === 'adult'
  if (!ageIsAdult && !profile.parentalConsentHealthData) {
    reasons.push('U18_NO_CONSENT')
  }

  return {
    isEligible: reasons.length === 0,
    primaryReason: reasons[0] ?? null,
    reasons,
  }
}

const HARD_EVENT_LABELS: Record<string, string> = {
  'hard:u18-parental-consent-missing': 'U18: consentement parental santé manquant, semaine réduite en mode récupération.',
  'hard:u18-max-match-minutes': 'U18: volume match hebdomadaire dépassé, semaine réduite en mode récupération.',
  'hard:u18-max-high-contact': 'U18: charge contact élevée dépassée, semaine réduite en mode récupération.',
  'hard:u18-max-medium-contact': 'U18: charge contact modérée dépassée, semaine réduite en mode récupération.',
  'hard:u18-max-season-matches': 'U18: plafond de matchs saison dépassé, semaine réduite en mode récupération.',
  'hard:u18-min-recovery-between-matches': 'U18: récupération inter-match insuffisante (<72h), semaine réduite en mode récupération.',
  'hard:critical-fatigue-reduction': 'Fatigue critique: programme réduit à 1 séance.',
  'hard:critical-fatigue-rehab-priority': 'Fatigue critique + réhab: priorité à 1 séance réhab-compatible.',
  'hard:danger-fatigue-mobility': 'Surcharge ACWR: dernière séance remplacée par mobilité.',
}

export const formatHardConstraintEvent = (eventCode: string): string => {
  const known = HARD_EVENT_LABELS[eventCode]
  if (known) return known
  return eventCode.startsWith('hard:')
    ? `Contrainte sécurité appliquée (${eventCode.replace('hard:', '')}).`
    : eventCode
}

export const getProgramSafetyMessages = (
  warnings: string[],
  hardConstraintEvents: string[]
): string[] => {
  return [
    ...warnings,
    ...hardConstraintEvents.map((eventCode) => formatHardConstraintEvent(eventCode)),
  ]
}

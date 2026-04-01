const HARD_EVENT_LABELS: Record<string, string> = {
  // U18 labels kept for staff-planning engine (not surfaced in public app — adult-only)
  'hard:u18-parental-consent-missing': 'Consentement parental manquant, semaine réduite en mode récupération.',
  'hard:u18-max-match-minutes': 'Volume match hebdomadaire dépassé, semaine réduite en mode récupération.',
  'hard:u18-max-high-contact': 'Charge contact élevée dépassée, semaine réduite en mode récupération.',
  'hard:u18-max-medium-contact': 'Charge contact modérée dépassée, semaine réduite en mode récupération.',
  'hard:u18-max-season-matches': 'Plafond de matchs saison dépassé, semaine réduite en mode récupération.',
  'hard:u18-min-recovery-between-matches': 'Récupération inter-match insuffisante (<72h), semaine réduite en mode récupération.',
  'hard:critical-fatigue-reduction': 'Fatigue critique : programme réduit à 1 séance.',
  'hard:critical-fatigue-rehab-priority': 'Fatigue critique : priorité à 1 séance compatible récupération.',
  'hard:danger-fatigue-mobility': 'Surcharge ACWR : dernière séance remplacée par mobilité.',
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

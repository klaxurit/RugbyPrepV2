/**
 * Ancre d’affichage du planning : pas de séances « Manquée » ni de slots
 * projetés avant la fin d’onboarding / création de compte.
 */

export function normalizeYmd(value: string | null | undefined): string | null {
  const ymd = value?.slice(0, 10)
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null
  return ymd
}

/**
 * SoT affichage : onboarding completedAt si connu, sinon création compte.
 * Les deux sont des YYYY-MM-DD (éventuellement tronqués depuis un ISO).
 */
export function resolveProgramVisibleFromISO(input: {
  onboardingCompletedAtYmd?: string | null
  accountCreatedYmd?: string | null
}): string | null {
  return (
    normalizeYmd(input.onboardingCompletedAtYmd) ??
    normalizeYmd(input.accountCreatedYmd)
  )
}

/** Séance / jour antérieur à l’ancre programme → hors horizon joueur. */
export function isBeforeProgramVisibleFrom(
  dateISO: string,
  programVisibleFromISO: string | null | undefined,
): boolean {
  const from = normalizeYmd(programVisibleFromISO)
  if (!from) return false
  const day = normalizeYmd(dateISO)
  if (!day) return false
  return day < from
}

/**
 * « Manquée » uniquement si la date est dans l’horizon programme,
 * déjà passée, et non faite / non skippée.
 */
export function resolvePlannedSessionMissedStatus(input: {
  dateISO: string
  todayISO: string
  programVisibleFromISO?: string | null
  slotStatus?: 'skipped' | 'completed' | null
  hasGymLogOnDate: boolean
}): 'completed' | 'missed' | 'pending' | 'skipped' {
  if (input.slotStatus === 'skipped') return 'skipped'
  if (input.slotStatus === 'completed' || input.hasGymLogOnDate) return 'completed'
  if (isBeforeProgramVisibleFrom(input.dateISO, input.programVisibleFromISO)) {
    return 'pending'
  }
  const day = normalizeYmd(input.dateISO)
  const today = normalizeYmd(input.todayISO)
  if (day && today && day < today) return 'missed'
  return 'pending'
}

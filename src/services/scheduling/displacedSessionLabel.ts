import type { DayOfWeek } from '../../types/training'
import type { Lang } from '../../i18n/appLabels'

const DAY_FR: Record<DayOfWeek, string> = {
  0: 'dimanche',
  1: 'lundi',
  2: 'mardi',
  3: 'mercredi',
  4: 'jeudi',
  5: 'vendredi',
  6: 'samedi',
}

const DAY_EN: Record<DayOfWeek, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

/** Jour juste avant le match (J-1), modulo semaine. */
export function dayBeforeMatch(matchDay: DayOfWeek): DayOfWeek {
  return ((matchDay + 6) % 7) as DayOfWeek
}

/**
 * Libellé court si la séance est placée en J-1 (ex. vendredi → samedi
 * avant match dimanche). Copy only — ne change pas le placement S&C.
 */
export function formatDisplacedSessionLabel(input: {
  sessionDayOfWeek: DayOfWeek
  matchDayOfWeek: DayOfWeek | null | undefined
  /** Jours SC habituels (ex. Lun/Mer/Ven). Si la séance y est, pas de libellé. */
  preferredTrainingDays?: readonly DayOfWeek[]
  lang?: Lang
}): string | null {
  const matchDay = input.matchDayOfWeek
  if (matchDay == null) return null

  const j1 = dayBeforeMatch(matchDay)
  if (input.sessionDayOfWeek !== j1) return null

  const preferred = input.preferredTrainingDays ?? []
  if (preferred.length > 0 && preferred.includes(input.sessionDayOfWeek)) {
    return null
  }

  const lang = input.lang === 'en' ? 'en' : 'fr'
  const matchName = lang === 'en' ? DAY_EN[matchDay] : DAY_FR[matchDay]
  return lang === 'fr' ? `Déplacée : match ${matchName}` : `Moved: ${matchName} match`
}

/**
 * Progression NHE (Nordic) type Severo / UEFA — rewrite prescription runtime.
 * Ne modifie pas le corpus mother sessions : appliqué dans prepareSessionForRender.
 *
 * Severo-Silveira 2021 : charge progressive > dose constante.
 * Table calée sur UEFA (van der Horst) en 4 crans de mésocycle.
 */

import type { MotherSession } from '../../types/motherSession'

const NORDIC_NAME = /nordic|nordique/i

/** Prescriptions par semaine de mésocycle (1–4), puis entretien. */
export const NORDIC_PROGRESSION_BY_MESO_WEEK: Record<1 | 2 | 3 | 4, string> = {
  1: '2x5 @ RER 1-2',
  2: '2x6 @ RER 1-2',
  3: '3x6 @ RER 1-2',
  4: '3x8 @ RER 1-2',
}

const ELIGIBLE_SESSION =
  /^(LOWER_(BW_)?(OFFSEASON|PRESEASON).*)|(LOWER_OFFSEASON_HYPERTROPHY)/i

export function resolveNordicMesoWeek(input: {
  mesocycleWeek?: 1 | 2 | 3 | 4 | null
  weekNumber?: number | null
}): 1 | 2 | 3 | 4 {
  if (input.mesocycleWeek === 1 || input.mesocycleWeek === 2 || input.mesocycleWeek === 3 || input.mesocycleWeek === 4) {
    return input.mesocycleWeek
  }
  const wn = input.weekNumber
  if (wn != null && Number.isFinite(wn) && wn > 0) {
    return ((((wn - 1) % 4) + 1) as 1 | 2 | 3 | 4)
  }
  return 1
}

export function isNordicProgressionEligible(sessionId: string): boolean {
  return ELIGIBLE_SESSION.test(sessionId)
}

/**
 * Réécrit les prescriptions Nordic selon la semaine de mésocycle.
 * Ajoute une note coaching courte (idempotente).
 */
export function applyProgressiveNordic(
  session: MotherSession,
  mesoWeek: 1 | 2 | 3 | 4,
): MotherSession {
  if (!isNordicProgressionEligible(session.metadata.id)) return session

  const prescription = NORDIC_PROGRESSION_BY_MESO_WEEK[mesoWeek]
  const note = `NHE progressif · semaine ${mesoWeek}/4 du bloc (${prescription}) — charge croissante (Severo / UEFA).`
  let touched = false

  const blocks = session.blocks.map((block) => {
    let blockTouched = false
    const exercises = block.exercises.map((exo) => {
      if (!NORDIC_NAME.test(exo.name)) return exo
      blockTouched = true
      touched = true
      return { ...exo, prescription }
    })
    if (!blockTouched) return block
    const coachingNotes = block.coachingNotes ?? []
    const nextNotes = coachingNotes.some((n) => n.includes('NHE progressif'))
      ? coachingNotes.map((n) => (n.includes('NHE progressif') ? note : n))
      : [...coachingNotes, note]
    return { ...block, exercises, coachingNotes: nextNotes }
  })

  return touched ? { ...session, blocks } : session
}

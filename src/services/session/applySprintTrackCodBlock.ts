/**
 * Plan A — si `sprint_track` est déclaré : 1 bloc court accélération/COD
 * injecté silencieusement (off / pré ; Full hors match week). Pas de toggle UI.
 */

import type { Block, MotherSession } from '../../types/motherSession'
import type { Equipment } from '../../types/training'

const SPRINT_OR_COD =
  /sprint|accélér|acceler|cod\b|change of direction|changement de direction|shuttle|navette|10\s*m/i

export function sessionAlreadyHasSprintOrCod(session: MotherSession): boolean {
  return session.blocks.some(
    (block) =>
      SPRINT_OR_COD.test(block.name) ||
      block.exercises.some(
        (exo) =>
          SPRINT_OR_COD.test(exo.name) ||
          (exo.exerciseId?.includes('sprint') ?? false) ||
          (exo.exerciseId?.includes('agility') ?? false),
      ),
  )
}

export function isSprintTrackCodEligible(
  session: MotherSession,
  opts: { equipment?: Equipment[]; isMatchWeek?: boolean },
): boolean {
  if (!opts.equipment?.includes('sprint_track')) return false
  if (sessionAlreadyHasSprintOrCod(session)) return false
  if (/RECOVERY/i.test(session.metadata.id)) return false

  const cycle = session.metadata.cycle
  if (cycle === 'off_season' || cycle === 'pre_season') return true

  // Full hors match week uniquement (in-season).
  if (cycle === 'in_season' && session.metadata.sessionType === 'full' && !opts.isMatchWeek) {
    return true
  }
  return false
}

function buildCodBlock(number: number, lang: 'fr' | 'en'): Block {
  return {
    number,
    name: lang === 'en' ? 'Acceleration / COD (track)' : 'Accélération / COD (piste)',
    format: lang === 'en' ? '2–3 rounds, full walk-back rest' : '2–3 tours, repos marche retour',
    isOptional: true,
    exercises: [
      {
        name: lang === 'en' ? 'Short acceleration' : 'Accélération courte',
        exerciseId: 'sprint__short_acceleration',
        prescription: lang === 'en' ? '2–3 × 10 m' : '2–3 × 10 m',
      },
      {
        name: lang === 'en' ? '5-10-5 Shuttle' : 'Navette 5-10-5',
        exerciseId: 'agility__shuttle_5_10_5',
        prescription: lang === 'en' ? '2 reps' : '2 reps',
      },
    ],
    coachingNotes:
      lang === 'en'
        ? [
            'Short quality dose — only because a sprint track is declared. Drop first if the session is cut short.',
            'Stop if technique or posture drops. Not a conditioning finisher.',
          ]
        : [
            'Dose courte et qualitative — uniquement car une piste est déclarée. Coupé en premier si la séance est raccourcie.',
            'Stop si la technique chute. Pas un finisher cardio.',
          ],
  }
}

export function applySprintTrackCodBlock(
  session: MotherSession,
  opts: {
    equipment?: Equipment[]
    isMatchWeek?: boolean
    lang?: 'fr' | 'en'
  },
): MotherSession {
  if (!isSprintTrackCodEligible(session, opts)) return session
  if (session.blocks.length >= 6) return session

  const lang = opts.lang ?? 'fr'
  const nextNumber = Math.max(0, ...session.blocks.map((b) => b.number)) + 1
  const block = buildCodBlock(nextNumber, lang)
  const reductionOrder = [nextNumber, ...(session.metadata.reductionOrder ?? [])]

  return {
    ...session,
    metadata: {
      ...session.metadata,
      reductionOrder,
    },
    blocks: [...session.blocks, block],
  }
}

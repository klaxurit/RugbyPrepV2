/**
 * Finisher rugby optionnel hors saison — 1 bloc court (portage), pas un circuit.
 * Coupé en premier. Interdit in-season. Ne modifie pas le corpus.
 */

import type { Block, MotherSession } from '../../types/motherSession'
import type { Equipment, TrainingLevel } from '../../types/training'
import { isFoundationsLevel } from '../motherSession/foundationsSessionAdaptations'
import { getExerciseName } from '../../data/exercises'

const CLOSER = /finisher|récompense|recompense|\breward\b|emom/i
const CARRY = /farmer|carry|portage|marche du fermier/i
const BLOCK_TOKEN = 'Finisher rugby — portage'

export function sessionAlreadyHasCloser(session: MotherSession): boolean {
  return session.blocks.some(
    (block) =>
      CLOSER.test(block.name) ||
      block.exercises.some((exo) => CARRY.test(exo.name) || exo.exerciseId?.startsWith('carry__')),
  )
}

export function isOffSeasonFinisherEligible(session: MotherSession): boolean {
  if (session.metadata.cycle !== 'off_season') return false
  if (/RECOVERY/i.test(session.metadata.id)) return false
  const type = session.metadata.sessionType
  return type === 'lower' || type === 'upper' || type === 'full'
}

function carryId(equipment: Equipment[] | undefined): string {
  if (equipment?.includes('dumbbell')) return 'carry__farmer_walk__dumbbell'
  return 'carry__farmer_walk__backpack'
}

function buildFinisherBlock(
  number: number,
  equipment: Equipment[] | undefined,
  lang: 'fr' | 'en',
): Block {
  const id = carryId(equipment)
  return {
    number,
    name: lang === 'en' ? 'Rugby finisher — carry' : BLOCK_TOKEN,
    format: lang === 'en' ? '2 × 20–30 s, easy rest' : '2 × 20–30 s, repos facile',
    isOptional: true,
    exercises: [
      {
        name: getExerciseName(id, lang),
        exerciseId: id,
        prescription: '2×20–30 s',
      },
    ],
    coachingNotes:
      lang === 'en'
        ? [
            'Short rugby closer, not a 100-rep circuit. Quality posture, drop first if short on time.',
          ]
        : [
            'Closer rugby court, pas un circuit. Posture propre. Coupé en premier si la séance est raccourcie.',
          ],
  }
}

export function applyOptionalOffSeasonFinisher(
  session: MotherSession,
  opts: {
    mesoWeek: 1 | 2 | 3 | 4
    trainingLevel?: TrainingLevel
    equipment?: Equipment[]
    lang?: 'fr' | 'en'
  },
): MotherSession {
  if (!isOffSeasonFinisherEligible(session)) return session
  if (opts.mesoWeek === 4) return session
  if (isFoundationsLevel(opts.trainingLevel)) return session
  if (sessionAlreadyHasCloser(session)) return session
  if (session.blocks.length >= 5) return session

  const nextNumber = Math.max(0, ...session.blocks.map((b) => b.number)) + 1
  const block = buildFinisherBlock(nextNumber, opts.equipment, opts.lang ?? 'fr')
  const reductionOrder = [nextNumber, ...(session.metadata.reductionOrder ?? [])]

  return {
    ...session,
    metadata: { ...session.metadata, reductionOrder },
    blocks: [...session.blocks, block],
  }
}

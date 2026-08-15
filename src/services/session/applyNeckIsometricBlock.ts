/**
 * Mini-bloc cou en fin d’Upper (Fownes-Walpole 2025).
 * Mains seulement, 3 directions, optionnel — coupé en premier si truncate.
 * Ne modifie pas le corpus mother sessions.
 */

import type { Block, MotherSession } from '../../types/motherSession'
import type { TrainingLevel } from '../../types/training'
import { isFoundationsLevel } from '../motherSession/foundationsSessionAdaptations'
import { getExerciseName } from '../../data/exercises'

const NECK_NAME = /neck|cou\b|cervical/i
const BLOCK_TOKEN = 'Cou — isométries'

const DIRECTIONS = [
  { id: 'neck__flexion_iso__bodyweight', rx: '2×10–15 s' },
  { id: 'neck__extension_iso__bodyweight', rx: '2×10–15 s' },
  { id: 'neck__lateral_flexion_iso__bodyweight', rx: '2×10–15 s / côté' },
] as const

export function sessionAlreadyHasNeckWork(session: MotherSession): boolean {
  return session.blocks.some(
    (block) =>
      NECK_NAME.test(block.name) ||
      block.exercises.some(
        (exo) => NECK_NAME.test(exo.name) || (exo.exerciseId?.startsWith('neck__') ?? false),
      ),
  )
}

export function isNeckBlockEligible(session: MotherSession): boolean {
  return session.metadata.sessionType === 'upper'
}

function buildNeckBlock(number: number, lang: 'fr' | 'en'): Block {
  return {
    number,
    name: lang === 'en' ? 'Neck isometrics' : BLOCK_TOKEN,
    format: lang === 'en' ? '2 × 10–15 s, 3 directions' : '2 × 10–15 s, 3 directions',
    isOptional: true,
    exercises: DIRECTIONS.map((d) => ({
      name: getExerciseName(d.id, lang),
      exerciseId: d.id,
      prescription: d.rx,
    })),
    coachingNotes:
      lang === 'en'
        ? [
            'Hands only, no harness. Stop if pain, dizziness, or tingling.',
            'Easy push (RPE 6–7). Dropped first if the session is shortened.',
          ]
        : [
            'Mains seulement, pas de harnais. Stop si douleur, vertiges ou fourmillements.',
            'Poussée douce (RPE 6–7). Coupé en premier si la séance est raccourcie.',
          ],
    fallbackOptions:
      lang === 'en'
        ? ['If you have a band: `Banded Neck Isometric`.']
        : ['Si tu as un élastique : `Banded Neck Isometric`.'],
  }
}

export function applyNeckIsometricBlock(
  session: MotherSession,
  opts: {
    mesoWeek: 1 | 2 | 3 | 4
    trainingLevel?: TrainingLevel
    lang?: 'fr' | 'en'
  },
): MotherSession {
  if (!isNeckBlockEligible(session)) return session
  if (opts.mesoWeek === 4) return session
  if (isFoundationsLevel(opts.trainingLevel)) return session
  if (sessionAlreadyHasNeckWork(session)) return session

  const nextNumber = Math.max(0, ...session.blocks.map((b) => b.number)) + 1
  const block = buildNeckBlock(nextNumber, opts.lang ?? 'fr')
  const reductionOrder = [nextNumber, ...(session.metadata.reductionOrder ?? [])]

  return {
    ...session,
    metadata: { ...session.metadata, reductionOrder },
    blocks: [...session.blocks, block],
  }
}

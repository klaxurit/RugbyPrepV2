/**
 * Hypertrophie off-season : +1 série sur les 2 primes (4 → 5).
 * Ne modifie pas le corpus. Plafond semaine 22 inchangé (headroom gym 3×).
 * Décharge (meso 4) et starter : pas de bump.
 */

import type { MotherSession } from '../../types/motherSession'
import type { TrainingLevel } from '../../types/training'
import { isFoundationsLevel } from '../motherSession/foundationsSessionAdaptations'

const ELIGIBLE = /^(LOWER|UPPER)_(BW_)?OFFSEASON_HYPERTROPHY/i
const NORDIC = /nordic|nordique/i
const NOTE_TOKEN = 'Hypertrophie : +1 série'
const NOTE_FR =
  'Hypertrophie : +1 série sur les 2 mouvements principaux — qualité, RER 1–2.'
const NOTE_EN =
  'Hypertrophy: +1 set on the 2 main lifts — quality, RER 1–2.'

export function isHypertrophyPrimeBumpEligible(sessionId: string): boolean {
  return ELIGIBLE.test(sessionId)
}

/** Uniquement les primes déjà à 4 séries → 5. Cap 5, pas de 5→6. */
export function bumpFourSetPrescription(prescription: string): string | null {
  const match = prescription.match(/^(\s*)(4)(\s*[x×].*)$/i)
  if (!match) return null
  return `${match[1]}5${match[3]}`
}

export function applyHypertrophyPrimeBump(
  session: MotherSession,
  opts: {
    mesoWeek: 1 | 2 | 3 | 4
    trainingLevel?: TrainingLevel
    lang?: 'fr' | 'en'
    preMatchNoHeavy?: boolean
  },
): MotherSession {
  if (!isHypertrophyPrimeBumpEligible(session.metadata.id)) return session
  if (opts.preMatchNoHeavy) return session
  if (opts.mesoWeek === 4) return session
  if (isFoundationsLevel(opts.trainingLevel)) return session

  const note = opts.lang === 'en' ? NOTE_EN : NOTE_FR
  let touched = false
  let bumped = 0

  const blocks = session.blocks.map((block) => {
    if (block.number !== 1 && block.number !== 2) return block
    const first = block.exercises[0]
    if (!first || NORDIC.test(first.name)) return block
    const nextRx = bumpFourSetPrescription(first.prescription)
    if (!nextRx) return block

    touched = true
    bumped += 1
    const format =
      block.number === 1 && /4 work sets/i.test(block.format)
        ? block.format.replace(/4 work sets/i, '5 work sets')
        : block.format

    return {
      ...block,
      format,
      exercises: block.exercises.map((exo, i) =>
        i === 0 ? { ...exo, prescription: nextRx } : exo,
      ),
    }
  })

  if (!touched || bumped === 0) return session

  const firstBlock = blocks.find((b) => b.number === 1) ?? blocks[0]
  const notes = firstBlock.coachingNotes ?? []
  const nextNotes = notes.some((n) => n.includes(NOTE_TOKEN))
    ? notes.map((n) => (n.includes(NOTE_TOKEN) ? note : n))
    : [...notes, note]

  return {
    ...session,
    blocks: blocks.map((b) => (b.number === 1 ? { ...b, coachingNotes: nextNotes } : b)),
  }
}

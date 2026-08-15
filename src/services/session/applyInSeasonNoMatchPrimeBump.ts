/**
 * In-season hors match : +1 série sur le bloc force (3 → 4).
 * Ne touche pas au contraste (déjà 4 rounds). Plafond semaine 14 inchangé.
 * Skip match week, décharge, club dur, starter.
 */

import type { MotherSession } from '../../types/motherSession'
import type { ClubContactProxy } from '../../types/annualPlanning'
import type { TrainingLevel } from '../../types/training'
import { isFoundationsLevel } from '../motherSession/foundationsSessionAdaptations'

const ELIGIBLE = /^(LOWER|UPPER)_(BW_)?IN_SEASON/i
const SKIP_BLOCK = /contrast|emom|finisher|reward|récompense/i
const NORDIC = /nordic|nordique/i
const NOTE_TOKEN = 'Semaine sans match'
const NOTE_FR =
  'Semaine sans match : +1 série sur le bloc force — qualité, RER 2–3. Plafond salle inchangé.'
const NOTE_EN =
  'No-match week: +1 set on the strength block — quality, RER 2–3. Gym ceiling unchanged.'

export function isInSeasonNoMatchPrimeBumpEligible(sessionId: string): boolean {
  return ELIGIBLE.test(sessionId)
}

/** Uniquement les 3 séries → 4. Cap 4, pas de 4→5. */
export function bumpThreeSetPrescription(prescription: string): string | null {
  const match = prescription.match(/^(\s*)(3)(\s*[x×].*)$/i)
  if (!match) return null
  return `${match[1]}4${match[3]}`
}

export function applyInSeasonNoMatchPrimeBump(
  session: MotherSession,
  opts: {
    mesoWeek: 1 | 2 | 3 | 4
    trainingLevel?: TrainingLevel
    lang?: 'fr' | 'en'
    isMatchWeek?: boolean
    isDeloadWeek?: boolean
    clubContactProxy?: ClubContactProxy
  },
): MotherSession {
  if (!isInSeasonNoMatchPrimeBumpEligible(session.metadata.id)) return session
  if (session.metadata.cycle !== 'in_season') return session
  if (opts.isMatchWeek !== false) return session
  if (opts.isDeloadWeek) return session
  if (opts.mesoWeek === 4) return session
  if (opts.clubContactProxy === 'hard') return session
  if (isFoundationsLevel(opts.trainingLevel)) return session

  const note = opts.lang === 'en' ? NOTE_EN : NOTE_FR
  let touched = false

  const blocks = session.blocks.map((block) => {
    if (block.number !== 2) return block
    if (SKIP_BLOCK.test(block.name)) return block

    let blockTouched = false
    const exercises = block.exercises.map((exo) => {
      if (NORDIC.test(exo.name)) return exo
      const nextRx = bumpThreeSetPrescription(exo.prescription)
      if (!nextRx) return exo
      blockTouched = true
      return { ...exo, prescription: nextRx }
    })
    if (!blockTouched) return block

    touched = true
    const format = /`?(3 rounds|3 tours)/i.test(block.format)
      ? block.format.replace(/3 rounds/i, '4 rounds').replace(/3 tours/i, '4 tours')
      : block.format

    return { ...block, format, exercises }
  })

  if (!touched) return session

  const strength = blocks.find((b) => b.number === 2) ?? blocks[0]
  const notes = strength.coachingNotes ?? []
  const nextNotes = notes.some((n) => n.includes(NOTE_TOKEN))
    ? notes.map((n) => (n.includes(NOTE_TOKEN) ? note : n))
    : [...notes, note]

  return {
    ...session,
    blocks: blocks.map((b) => (b.number === 2 ? { ...b, coachingNotes: nextNotes } : b)),
  }
}

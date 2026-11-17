/**
 * Option B runtime : thème Contact → 1 slot non redondant dans le Finisher
 * EMOM (8′ → 9′), sans bloc Accent séparé. Mothers inchangées.
 */

import type { Block, MotherSession } from '../../types/motherSession'
import { getExerciseName } from '../../data/exercises'
import { parseBlockFormat } from '../ui/parseBlockFormat'
import {
  filterPositionAccentSlots,
  pickPositionAccentExerciseId,
  positionAccentMovementFamily,
  type PositionAccentBlock,
  type PositionAccentEquipmentMode,
} from '../equipment/positionAccentRegistry'
import { resolveExerciseIdForSessionRun } from '../motherSession/motherSessionExerciseMap'

export function findEmomFinisherBlockIndex(blocks: readonly Block[]): number {
  return blocks.findIndex((block) => {
    if (!/finisher/i.test(block.name)) return false
    const fmt = parseBlockFormat(block.format)
    // Canon mothers : 2 exos / EMOM 8′ → on ajoute la minute 3.
    return fmt.type === 'emom' && block.exercises.length === 2
  })
}

/** `` `EMOM 8'` `` → `` `EMOM 9'` `` (conserve backticks / apostrophe). */
export function bumpEmomFormatByOneMinute(format: string): string | null {
  const fmt = parseBlockFormat(format)
  if (fmt.type !== 'emom') return null
  const nextMinutes = fmt.rounds + 1
  if (nextMinutes > 12) return null
  if (!/EMOM\s*\d+/i.test(format)) return null
  return format.replace(/(EMOM\s*)(\d+)/i, `$1${nextMinutes}`)
}

function collectUsage(session: MotherSession): {
  ids: Set<string>
  families: Set<string>
} {
  const ids = new Set<string>()
  const families = new Set<string>()
  for (const block of session.blocks) {
    for (const exo of block.exercises) {
      const id = resolveExerciseIdForSessionRun(exo.name, exo.exerciseId)
      if (!id) continue
      ids.add(id)
      families.add(positionAccentMovementFamily(id))
    }
  }
  return { ids, families }
}

/**
 * Injecte 1 slot Contact dans le Finisher EMOM. `null` si impossible
 * (pas de Finisher 2-exos, ou aucun exo non redondant).
 */
export function mergeContactAccentIntoFinisher(
  session: MotherSession,
  opts: {
    accent: PositionAccentBlock
    mode: PositionAccentEquipmentMode
    skipNeck: boolean
    lang: 'fr' | 'en'
  },
): MotherSession | null {
  const finisherIdx = findEmomFinisherBlockIndex(session.blocks)
  if (finisherIdx < 0) return null

  const finisher = session.blocks[finisherIdx]
  const bumpedFormat = bumpEmomFormatByOneMinute(finisher.format)
  if (!bumpedFormat) return null

  const usage = collectUsage(session)
  const contactSlots = filterPositionAccentSlots(opts.accent, {
    skipNeck: opts.skipNeck,
    sessionType: session.metadata.sessionType,
    theme: 'contact',
    maxSlots: 3,
  })

  let pickedId: string | null = null
  let pickedSlot = contactSlots[0]
  for (const slot of contactSlots) {
    const id = pickPositionAccentExerciseId(slot, opts.mode, {
      usedExerciseIds: usage.ids,
      usedFamilies: usage.families,
    })
    if (!id) continue
    pickedId = id
    pickedSlot = slot
    break
  }
  if (!pickedId || !pickedSlot) return null

  const slotLabel = opts.lang === 'en' ? pickedSlot.labelEn : pickedSlot.labelFr
  const nextFinisher: Block = {
    ...finisher,
    format: bumpedFormat,
    exercises: [
      ...finisher.exercises,
      {
        name: getExerciseName(pickedId, opts.lang),
        exerciseId: pickedId,
        prescription: pickedSlot.prescription,
        slotLabel: 'minute 3',
      },
    ],
    coachingNotes: [
      ...finisher.coachingNotes,
      opts.lang === 'en'
        ? `Contact accent folded into minute 3 (${slotLabel}) — EMOM extended to 9'.`
        : `Accent Contact intégré en minute 3 (${slotLabel}) — EMOM porté à 9'.`,
    ],
  }

  const blocks = session.blocks.map((b, i) => (i === finisherIdx ? nextFinisher : b))
  return { ...session, blocks }
}

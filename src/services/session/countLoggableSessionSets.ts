/**
 * Comptage séries pour le récap fin de séance.
 * Aligné sur les clés `buildExerciseTourKey` réellement marquées :
 *  - rounds / work sets : exo × tours
 *  - EMOM / Tabata : 1 clé par exo (tour 0) — `finalizeEmomBlock`
 * L’échauffement (`warmUp`) n’entre jamais dans le total.
 */

import type { MotherSession } from '../../types/motherSession'
import { isDirectiveText } from '../motherSession/motherSessionExerciseMap'
import { parseBlockFormat } from '../ui/parseBlockFormat'
import { parseBlockTourCount } from '../ui/blockPresentation'

export function countLoggableSessionSets(session: MotherSession): number {
  let total = 0
  for (const block of session.blocks) {
    const loggable = block.exercises.filter((e) => e && !isDirectiveText(e.name)).length
    if (loggable === 0) continue
    const fmt = parseBlockFormat(block.format)
    if (fmt.type === 'emom' || fmt.type === 'tabata') {
      total += loggable
      continue
    }
    total += loggable * parseBlockTourCount(block)
  }
  return total
}

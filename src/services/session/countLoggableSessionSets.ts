/**
 * Comptage séries pour le récap fin de séance — source unique.
 *
 * Règles (documentées + testées) :
 * 1. L’échauffement (`warmUp`) n’est jamais validé ni compté.
 * 2. Blocs rounds / work sets : 1 unité par exercice loggable × tour.
 * 3. EMOM / Tabata : 1 unité par exercice loggable (clé tour 0), comme
 *    `finalizeEmomBlock` — pas minutes × exos.
 * 4. Un EMOM abandonné avant la fin (chrono non terminé / non validé
 *    manuellement) n’ajoute aucune clé → 0 pour ce bloc.
 */

import { buildExerciseTourKey } from '../../contexts/SessionRunContext'
import type { MotherSession } from '../../types/motherSession'
import { isDirectiveText } from '../motherSession/motherSessionExerciseMap'
import { parseBlockFormat } from '../ui/parseBlockFormat'
import { parseBlockTourCount } from '../ui/blockPresentation'

function loggableExerciseIndexes(block: MotherSession['blocks'][number]): number[] {
  const indexes: number[] = []
  block.exercises.forEach((exercise, index) => {
    if (exercise && !isDirectiveText(exercise.name)) indexes.push(index)
  })
  return indexes
}

/** Clés attendues au récap (alignées sur `buildExerciseTourKey` / finalize EMOM). */
export function listLoggableSessionSetKeys(session: MotherSession): string[] {
  const keys: string[] = []
  for (const block of session.blocks) {
    const indexes = loggableExerciseIndexes(block)
    if (indexes.length === 0) continue
    const fmt = parseBlockFormat(block.format)
    if (fmt.type === 'emom' || fmt.type === 'tabata') {
      for (const exerciseIndex of indexes) {
        keys.push(buildExerciseTourKey(block.number, 0, exerciseIndex))
      }
      continue
    }
    const tours = parseBlockTourCount(block)
    for (let tour = 0; tour < tours; tour++) {
      for (const exerciseIndex of indexes) {
        keys.push(buildExerciseTourKey(block.number, tour, exerciseIndex))
      }
    }
  }
  return keys
}

export function countLoggableSessionSets(session: MotherSession): number {
  return listLoggableSessionSetKeys(session).length
}

/**
 * Sets réellement faits pour le récap : intersection avec les clés loggables.
 * Ignore l’échauffement et tout marquage hors structure (ex. EMOM abandonné).
 */
export function countCompletedLoggableSets(
  session: MotherSession,
  completedExercises: ReadonlySet<string>,
): number {
  let completed = 0
  for (const key of listLoggableSessionSetKeys(session)) {
    if (completedExercises.has(key)) completed += 1
  }
  return completed
}

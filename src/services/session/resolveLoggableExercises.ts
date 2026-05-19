import type { Block, Exercise } from '../../types/motherSession'
import {
  isDirectiveText,
  resolveExerciseIdForSessionRun,
} from '../motherSession/motherSessionExerciseMap'

export interface ResolvedExercise {
  /** Exercice source du block (référence). */
  exo: Exercise
  /** Index original dans `block.exercises[]` — sert à composer la clé sessionRun. */
  index: number
  /**
   * `exerciseId` résolu (depuis l'attribut explicite ou via `resolveExerciseId(name)`).
   * Présent uniquement si l'exo est *loggable* (cf. `isDirective`).
   */
  exerciseId: string | null
  /**
   * `true` si l'exo est une directive (ex: "2 progressive prep sets") et donc
   * non comptabilisé pour le tour-tracker / logging.
   */
  isDirective: boolean
}

/**
 * Résout les exercices d'un bloc pour le moteur de séance.
 * Préserve l'ordre source ; chaque entrée contient son `index` original (utilisé
 * pour composer la clé `${blockNumber}_${tourIndex}_${exerciseIndex}` du sessionRun).
 *
 * Pas d'effet de bord, pas de filtrage. Les directives sont marquées via
 * `isDirective` et conservées dans la liste pour que les nouveaux blocs UI
 * puissent les afficher (en mode lecture) tout en sachant qu'elles ne sont pas
 * loggables.
 */
export function resolveLoggableExercises(block: Block): ResolvedExercise[] {
  return block.exercises.map((exo, index) => {
    const directive = isDirectiveText(exo.name)
    const exerciseId = directive
      ? null
      : resolveExerciseIdForSessionRun(exo.name, exo.exerciseId) ?? null
    return {
      exo,
      index,
      exerciseId,
      isDirective: directive,
    }
  })
}

/**
 * Indices originaux des exos *loggables* d'un bloc — utilisés pour calculer le
 * statut "tous validés ce tour ?" depuis `sessionRun.completedExercises`.
 */
export function getLoggableExerciseIndices(block: Block): number[] {
  return resolveLoggableExercises(block)
    .filter((r) => !r.isDirective && r.exerciseId != null)
    .map((r) => r.index)
}

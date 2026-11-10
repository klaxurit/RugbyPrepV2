/**
 * Snapshot d’affichage des sets validés pour la phase completed / share.
 *
 * Après save, le planning peut refetch et changer la mother de l’écran ;
 * le store live peut aussi être vidé à la sortie. L’UI completed doit lire
 * ce freeze, pas un état intermédiaire vide.
 */

import type { ExerciseTourLoad } from '../../contexts/SessionRunContext'

export type SessionRunDisplaySnapshot = {
  completedExercises: ReadonlySet<string>
  exerciseTourLoads: Readonly<Record<string, ExerciseTourLoad>>
}

export function captureSessionRunDisplaySnapshot(input: {
  completedExercises: ReadonlySet<string>
  exerciseTourLoads: Readonly<Record<string, ExerciseTourLoad>>
}): SessionRunDisplaySnapshot {
  return {
    completedExercises: new Set(input.completedExercises),
    exerciseTourLoads: { ...input.exerciseTourLoads },
  }
}

/**
 * Pure. Phase completed + freeze → freeze ; sinon live.
 */
export function resolveSessionRunDisplayData(input: {
  phase: 'idle' | 'running' | 'completed'
  liveCompletedExercises: ReadonlySet<string>
  liveExerciseTourLoads: Readonly<Record<string, ExerciseTourLoad>>
  freeze: SessionRunDisplaySnapshot | null
}): {
  completedExercises: ReadonlySet<string>
  exerciseTourLoads: Readonly<Record<string, ExerciseTourLoad>>
} {
  if (input.phase === 'completed' && input.freeze) {
    return {
      completedExercises: input.freeze.completedExercises,
      exerciseTourLoads: input.freeze.exerciseTourLoads,
    }
  }
  return {
    completedExercises: input.liveCompletedExercises,
    exerciseTourLoads: input.liveExerciseTourLoads,
  }
}

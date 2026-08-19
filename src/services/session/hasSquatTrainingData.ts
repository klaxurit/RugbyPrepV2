/**
 * Un squat logué (charge > 0) est le seul signal qui autorise une suggestion de kg.
 * Pas de 1RM à l’entrée, pas de baseline poste × poids.
 */

const JUMP_SQUAT_MARKERS = ['jump', 'pogo', 'plyo'] as const

export function isSquatExerciseId(exerciseId: string): boolean {
  const id = exerciseId.toLowerCase()
  if (!id.includes('squat')) return false
  return !JUMP_SQUAT_MARKERS.some((marker) => id.includes(marker))
}

export function hasSquatLoadLog(
  setLogs: readonly { exerciseId: string; loadKg?: number | null }[],
): boolean {
  return setLogs.some(
    (set) => isSquatExerciseId(set.exerciseId) && set.loadKg != null && set.loadKg > 0,
  )
}

import type { BlockLog, ExerciseSetLog } from '../../types/training'

function entryHasLoggableData(entry: {
  loadKg?: number
  reps?: number
  meters?: number
  seconds?: number
}): boolean {
  return (
    entry.loadKg != null ||
    entry.reps != null ||
    entry.meters != null ||
    entry.seconds != null
  )
}

/**
 * Convertit les `block_logs` legacy (1 entrée agrégée / exo / bloc) en pseudo set logs
 * compatibles avec le pipeline PR / PREVIOUS / suggestions.
 */
export function blockLogsToSyntheticSetLogs(blockLogs: readonly BlockLog[]): ExerciseSetLog[] {
  const out: ExerciseSetLog[] = []

  for (const blockLog of blockLogs) {
    blockLog.entries.forEach((entry, entryIndex) => {
      if (!entry.exerciseId || !entryHasLoggableData(entry)) return

      out.push({
        id: `legacy-${blockLog.id}-${entryIndex}`,
        slotSignature: `legacy:block:${blockLog.id}`,
        motherSessionId: blockLog.motherSessionId,
        weekLabel: blockLog.week,
        sessionIndex: 0,
        blockNumber: 0,
        exerciseId: entry.exerciseId,
        tourIndex: entryIndex,
        loadKg: entry.loadKg,
        reps: entry.reps,
        seconds: entry.seconds,
        meters: entry.meters,
        rir: entry.rir,
        completed: true,
        createdAt: blockLog.dateISO,
        updatedAt: blockLog.dateISO,
      })
    })
  }

  return out
}

/**
 * Historique unifié pour la séance : `exercise_set_logs` (prioritaire) + legacy `block_logs`.
 * Les deux sources alimentent PR live, PREVIOUS et suggestions AI.
 */
export function mergeExerciseHistoryLogs(
  setLogs: readonly ExerciseSetLog[],
  blockLogs: readonly BlockLog[],
): ExerciseSetLog[] {
  const legacy = blockLogsToSyntheticSetLogs(blockLogs)
  if (legacy.length === 0) return [...setLogs]
  if (setLogs.length === 0) return legacy

  const merged = [...setLogs, ...legacy]
  merged.sort((a, b) => {
    const da = a.updatedAt ?? a.createdAt ?? ''
    const db = b.updatedAt ?? b.createdAt ?? ''
    return db.localeCompare(da)
  })
  return merged
}

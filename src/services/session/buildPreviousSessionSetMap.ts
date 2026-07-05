import type { ExerciseSetLog } from '../../types/training'

/** Référence read-only d'une série passée (dernière séance, même n° de tour). */
export type PreviousSessionSetRef = {
  loadKg?: number
  reps?: number
  meters?: number
  seconds?: number
}

export type PreviousSessionSetKey = `${string}__${number}`

export function previousSessionSetKey(exerciseId: string, tourIndex: number): PreviousSessionSetKey {
  return `${exerciseId}__${tourIndex}`
}

function setHasLoggableData(set: ExerciseSetLog): boolean {
  return (
    set.loadKg != null ||
    set.reps != null ||
    set.meters != null ||
    set.seconds != null
  )
}

function setTimestamp(set: ExerciseSetLog): string {
  return set.updatedAt ?? set.createdAt ?? ''
}

/**
 * Indexe, pour chaque couple (exerciseId, tourIndex), la série la plus récente
 * enregistrée hors séance courante — modèle « PREVIOUS » à la Hevy.
 */
export function buildPreviousSessionSetMap(params: {
  allSetLogs: readonly ExerciseSetLog[]
  currentSlotSignature: string
  exerciseIds: readonly string[]
  tourCount: number
}): Map<PreviousSessionSetKey, PreviousSessionSetRef> {
  const { allSetLogs, currentSlotSignature, exerciseIds, tourCount } = params
  const out = new Map<PreviousSessionSetKey, PreviousSessionSetRef>()

  const historical = allSetLogs.filter(
    (s) => s.slotSignature !== currentSlotSignature && setHasLoggableData(s),
  )

  for (const exerciseId of exerciseIds) {
    const latestAnyTour = historical
      .filter((s) => s.exerciseId === exerciseId)
      .sort((a, b) => setTimestamp(b).localeCompare(setTimestamp(a)))[0]

    for (let tour = 0; tour < tourCount; tour++) {
      const match =
        historical
          .filter((s) => s.exerciseId === exerciseId && s.tourIndex === tour)
          .sort((a, b) => setTimestamp(b).localeCompare(setTimestamp(a)))[0] ??
        (tour === 0 ? latestAnyTour : undefined)

      if (!match) continue

      out.set(previousSessionSetKey(exerciseId, tour), {
        loadKg: match.loadKg,
        reps: match.reps,
        meters: match.meters,
        seconds: match.seconds,
      })
    }
  }

  return out
}

export function formatPreviousSessionSetLabel(
  ref: PreviousSessionSetRef,
  metric: 'load_reps' | 'reps' | 'meters' | 'seconds',
): string | null {
  if (metric === 'load_reps') {
    if (ref.loadKg == null && ref.reps == null) return null
    const kg = ref.loadKg != null ? `${ref.loadKg} kg` : ''
    const reps = ref.reps != null ? String(ref.reps) : ''
    if (kg && reps) return `${kg} × ${reps}`
    return kg || reps || null
  }
  if (metric === 'reps' && ref.reps != null) return `${ref.reps} reps`
  if (metric === 'meters' && ref.meters != null) return `${ref.meters} m`
  if (metric === 'seconds' && ref.seconds != null) return `${ref.seconds} s`
  return null
}

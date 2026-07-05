import type { ExerciseSetLog } from '../../types/training'
import type { ExerciseMetricType } from '../ui/exerciseMetrics'
import { formatPreviousSessionSetLabel } from './buildPreviousSessionSetMap'

export type JournalSetState = 'history' | 'current_done' | 'current_active' | 'current_pending'

export type JournalSetRow = {
  setNumber: number
  label: string
  state: JournalSetState
}

export type ExerciseSessionJournal = {
  /** Ex. « 12 juin 2026 » */
  lastSessionDate?: string
  lastSessionRows: JournalSetRow[]
  currentRows: JournalSetRow[]
}

function setTimestamp(set: ExerciseSetLog): string {
  return set.updatedAt ?? set.createdAt ?? ''
}

function formatSetRow(
  set: Pick<ExerciseSetLog, 'loadKg' | 'reps' | 'seconds' | 'meters'>,
  metricType: ExerciseMetricType,
): string | null {
  return formatPreviousSessionSetLabel(set, metricType)
}

function formatSessionDate(iso: string, lang: 'fr' | 'en'): string {
  try {
    return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

/**
 * Journal set-by-set à la Hevy : dernière séance (lecture seule) + séries
 * de la séance en cours (validées, active, à venir).
 */
export function buildExerciseSessionJournal(params: {
  allSetLogs: readonly ExerciseSetLog[]
  exerciseId: string
  currentSlotSignature: string
  blockNumber: number
  totalTours: number
  /** Données par tour pour l'exo courant (kg/reps/validated). */
  tourDataByIndex: Readonly<Record<number, { kg?: string; reps?: string; validated?: boolean }>>
  currentTourIdx: number
  metricType: ExerciseMetricType
  lang?: 'fr' | 'en'
}): ExerciseSessionJournal | null {
  const {
    allSetLogs,
    exerciseId,
    currentSlotSignature,
    blockNumber,
    totalTours,
    tourDataByIndex,
    currentTourIdx,
    metricType,
    lang = 'fr',
  } = params

  const historical = allSetLogs.filter(
    (s) =>
      s.exerciseId === exerciseId &&
      s.slotSignature !== currentSlotSignature &&
      (s.loadKg != null || s.reps != null || s.seconds != null || s.meters != null),
  )

  const bySlot = new Map<string, ExerciseSetLog[]>()
  for (const set of historical) {
    const key = set.slotSignature
    const bucket = bySlot.get(key) ?? []
    bucket.push(set)
    bySlot.set(key, bucket)
  }

  let lastSessionRows: JournalSetRow[] = []
  let lastSessionDate: string | undefined

  if (bySlot.size > 0) {
    const latestSlot = [...bySlot.entries()].sort((a, b) => {
      const ta = a[1].map(setTimestamp).sort().reverse()[0] ?? ''
      const tb = b[1].map(setTimestamp).sort().reverse()[0] ?? ''
      return tb.localeCompare(ta)
    })[0]

    const slotSets = latestSlot[1]
      .filter((s) => s.blockNumber === blockNumber || s.blockNumber === 0)
      .sort((a, b) => a.tourIndex - b.tourIndex)

    const setsToShow =
      slotSets.length > 0
        ? slotSets
        : [...latestSlot[1]].sort((a, b) => a.tourIndex - b.tourIndex)

    const latestTs = setsToShow.map(setTimestamp).sort().reverse()[0]
    if (latestTs) lastSessionDate = formatSessionDate(latestTs, lang)

    lastSessionRows = setsToShow
      .map((set, i) => {
        const label = formatSetRow(set, metricType)
        if (!label) return null
        return {
          setNumber: i + 1,
          label,
          state: 'history' as const,
        }
      })
      .filter((r): r is JournalSetRow => r != null)
  }

  const currentRows: JournalSetRow[] = []
  for (let tour = 0; tour < totalTours; tour++) {
    const data = tourDataByIndex[tour] ?? {}
    let state: JournalSetState = 'current_pending'
    if (data.validated) state = 'current_done'
    else if (tour === currentTourIdx) state = 'current_active'

    let label: string | null = null
    if (data.kg || data.reps) {
      const loadKg = data.kg ? Number(data.kg.replace(',', '.')) : undefined
      const reps = data.reps ? Number(data.reps) : undefined
      label = formatSetRow(
        {
          loadKg: Number.isFinite(loadKg) ? loadKg : undefined,
          reps: Number.isFinite(reps) ? reps : undefined,
        },
        metricType,
      )
    }

    if (!label && state === 'current_pending') continue
    if (!label && state === 'current_done') label = '—'

    currentRows.push({
      setNumber: tour + 1,
      label: label ?? '—',
      state,
    })
  }

  if (lastSessionRows.length === 0 && currentRows.length === 0) return null

  return { lastSessionDate, lastSessionRows, currentRows }
}

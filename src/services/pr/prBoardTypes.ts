import type { ExerciseMetricType } from '../../types/training'

/** Entrée normalisée pour l'onglet Records (PRBoard). */
export interface PRBoardEntry {
  exerciseId: string
  metricType: ExerciseMetricType
  /** Pour load_reps : charge max (kg). */
  bestValue: number
  bestLabel: string
  dateISO: string
  isRecent: boolean
}

import type {
  ExerciseSetLog,
  ExerciseLogEntry,
  CycleWeek,
  FatigueLevel,
  TrainingLevel,
} from '../../types/training'
import { getLoadSuggestion, type LoadSuggestion } from '../loadSuggestion'
import { parseExerciseSetSpec } from '../ui/exerciseSetSpec'

interface ExerciseRefShape {
  exerciseId: string
  /** Texte de prescription brut (ex. "5x5", "3x8-10"). */
  prescription: string
}

export interface BuildSessionLoadSuggestionsInputs {
  /** Tous les set logs de l'utilisateur (séances passées + courante). */
  allSetLogs: readonly ExerciseSetLog[]
  /** Liste des exos loggables de la séance courante. */
  exercises: readonly ExerciseRefShape[]
  /** SlotSignature de la séance courante (excluse de l'historique). */
  currentSlotSignature: string | null
  week: CycleWeek
  acwr: number | null
  fatigueLevel: FatigueLevel
  trainingLevel: TrainingLevel
  daysToMatch: number | null
  /** Date "now" — injectable pour les tests. */
  now?: Date
}

/**
 * Orchestrateur qui calcule une LoadSuggestion par exercice de la séance.
 *
 * Pour chaque exo :
 *  1. Parse la prescription → extrait `repsHigh` (G2 double progression).
 *  2. Récupère l'historique de set logs sur cet exo (séances passées
 *     uniquement, slotSignature ≠ courant). Convertit en `ExerciseLogEntry`.
 *  3. Détermine `lastEntry` (le set le plus récent) et `historicalEntries`
 *     (séries triées récentes-d'abord, 1 entrée par séance via max
 *     loadKg×reps).
 *  4. Calcule `daysSinceLastLog` depuis `lastSet.createdAt`.
 *  5. Délègue à `getLoadSuggestion` avec tous les garde-fous.
 *
 * Returns Map<exerciseId, LoadSuggestion>.
 */
export function buildSessionLoadSuggestions({
  allSetLogs,
  exercises,
  currentSlotSignature,
  week,
  acwr,
  fatigueLevel,
  trainingLevel,
  daysToMatch,
  now,
}: BuildSessionLoadSuggestionsInputs): Map<string, LoadSuggestion> {
  const result = new Map<string, LoadSuggestion>()
  const nowDate = now ?? new Date()

  // Pré-filtrer une fois : exclure la séance courante.
  const historical = currentSlotSignature
    ? allSetLogs.filter((s) => s.slotSignature !== currentSlotSignature)
    : allSetLogs

  for (const exo of exercises) {
    const spec = parseExerciseSetSpec(exo.prescription)
    const prescribedRepsHigh = spec.kind === 'reps' ? spec.repsHigh : undefined
    const prescribedRepsLow = spec.kind === 'reps' ? spec.repsLow : undefined

    // Sets historiques pour cet exo, du plus récent au plus ancien.
    const setsForExo = historical
      .filter((s) => s.exerciseId === exo.exerciseId)
      .slice()
      .sort((a, b) => {
        const da = a.updatedAt ?? a.createdAt ?? ''
        const db = b.updatedAt ?? b.createdAt ?? ''
        return db.localeCompare(da)
      })

    if (setsForExo.length === 0) {
      result.set(
        exo.exerciseId,
        getLoadSuggestion({
          exerciseId: exo.exerciseId,
          lastEntry: undefined,
          week,
          acwr,
          fatigueLevel,
          trainingLevel,
          historicalEntries: [],
          prescribedRepsHigh,
          prescribedRepsLow,
          daysToMatch,
        }),
      )
      continue
    }

    // Aggréger par séance (slotSignature) → 1 entrée par séance avec le set
    // le plus lourd retenu (proxy "top set" du jour).
    const bySlot = new Map<string, ExerciseSetLog>()
    for (const s of setsForExo) {
      const existing = bySlot.get(s.slotSignature)
      if (!existing) {
        bySlot.set(s.slotSignature, s)
        continue
      }
      const cur = (s.loadKg ?? 0) * (s.reps ?? 0)
      const prev = (existing.loadKg ?? 0) * (existing.reps ?? 0)
      if (cur > prev) bySlot.set(s.slotSignature, s)
    }

    const perSession = Array.from(bySlot.values()).sort((a, b) => {
      const da = a.updatedAt ?? a.createdAt ?? ''
      const db = b.updatedAt ?? b.createdAt ?? ''
      return db.localeCompare(da)
    })

    const setToEntry = (s: ExerciseSetLog): ExerciseLogEntry => ({
      exerciseId: s.exerciseId,
      loadKg: s.loadKg,
      reps: s.reps,
      rir: s.rir,
      setsCompleted: s.completed === false ? 0 : undefined,
    })

    const lastEntry = setToEntry(perSession[0])
    const historicalEntries = perSession.map(setToEntry)

    const lastStamp =
      perSession[0].updatedAt ?? perSession[0].createdAt ?? null
    let daysSinceLastLog: number | undefined
    if (lastStamp) {
      const diffMs = nowDate.getTime() - new Date(lastStamp).getTime()
      daysSinceLastLog = Math.max(0, Math.floor(diffMs / 86400000))
    }

    result.set(
      exo.exerciseId,
      getLoadSuggestion({
        exerciseId: exo.exerciseId,
        lastEntry,
        week,
        acwr,
        fatigueLevel,
        trainingLevel,
        historicalEntries,
        prescribedRepsHigh,
        prescribedRepsLow,
        daysToMatch,
        daysSinceLastLog,
      }),
    )
  }

  return result
}

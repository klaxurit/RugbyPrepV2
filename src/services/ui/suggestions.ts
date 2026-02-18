import { EXERCISE_METRIC_OVERRIDES } from '../../data/exerciseMetricOverrides.v1'
import { getExerciseMetricType } from './exerciseMetrics'
import type { CycleWeek, FatigueStatus } from '../../types/training'

export type Suggestion = {
  kind: 'load_reps' | 'reps' | 'seconds' | 'meters' | 'none'
  suggestionText: string
  rationale: string
  suggestedLoadKg?: number
  suggestedReps?: number
  suggestedSeconds?: number
  suggestedMeters?: number
  lastText?: string
}

interface SuggestionParams {
  exerciseId: string
  week: CycleWeek
  fatigue: FatigueStatus
  targetRer?: number
  schemeLabel?: string
  lastEntry?: { loadKg?: number; reps?: number; seconds?: number; meters?: number }
}

const LOAD_INCREMENT_KG = 2.5

export const roundToIncrement = (valueKg: number, increment = LOAD_INCREMENT_KG) =>
  Math.max(0, Math.round(valueKg / increment) * increment)

const toInt = (value: number) => Math.max(0, Math.round(value))

const formatLastText = (lastEntry?: SuggestionParams['lastEntry']) => {
  if (!lastEntry) return undefined
  if (lastEntry.loadKg !== undefined || lastEntry.reps !== undefined) {
    if (lastEntry.loadKg === undefined && lastEntry.reps !== undefined) {
      return `Dernière fois: ${lastEntry.reps} reps`
    }
    const load = lastEntry.loadKg !== undefined ? `${lastEntry.loadKg} kg` : '? kg'
    const reps = lastEntry.reps !== undefined ? `${lastEntry.reps}` : '?'
    return `Dernière fois: ${load} × ${reps}`
  }
  if (lastEntry.meters !== undefined) return `Dernière fois: ${lastEntry.meters} m`
  if (lastEntry.seconds !== undefined) return `Dernière fois: ${lastEntry.seconds}s`
  return undefined
}

const getKind = (
  lastEntry: SuggestionParams['lastEntry'],
  metricType: ReturnType<typeof getExerciseMetricType>,
  schemeLabel?: string
): Suggestion['kind'] => {
  if (lastEntry?.loadKg !== undefined || lastEntry?.reps !== undefined) return 'load_reps'
  if (lastEntry?.meters !== undefined) return 'meters'
  if (lastEntry?.seconds !== undefined) return 'seconds'
  if (metricType === 'reps') return 'reps'
  if (metricType === 'meters') return 'meters'
  if (metricType === 'seconds') return 'seconds'
  if (schemeLabel?.includes('EMOM') || schemeLabel?.toLowerCase().includes('temps')) return 'seconds'
  return 'none'
}

export const getExerciseSuggestion = ({
  exerciseId,
  week,
  fatigue,
  targetRer,
  schemeLabel,
  lastEntry
}: SuggestionParams): Suggestion => {
  const metricType = getExerciseMetricType({ exerciseId })
  const override = EXERCISE_METRIC_OVERRIDES[exerciseId]
  const kind = getKind(lastEntry, metricType, schemeLabel)
  const rer = targetRer ?? 3
  const lastText = formatLastText(lastEntry)

  if (!lastEntry) {
    if (week === 'DELOAD') {
      return {
        kind,
        suggestionText: override?.suggestionTemplate ?? 'RPE facile, technique',
        rationale: 'DELOAD: priorité qualité.',
        lastText
      }
    }
    if (metricType === 'reps') {
      return {
        kind,
        suggestionText: override?.suggestionTemplate ?? 'Reps propres, garde la qualité.',
        rationale: "Pas d'historique: démarre conservateur et logge ta perf.",
        lastText
      }
    }
    if (metricType === 'seconds') {
      return {
        kind,
        suggestionText: override?.suggestionTemplate ?? 'Tenue propre, contrôle.',
        rationale: "Pas d'historique: démarre conservateur et logge ta perf.",
        lastText
      }
    }
    if (metricType === 'meters') {
      return {
        kind,
        suggestionText: override?.suggestionTemplate ?? 'Distance propre, posture stable.',
        rationale: "Pas d'historique: démarre conservateur et logge ta perf.",
        lastText
      }
    }
    return {
      kind,
      suggestionText: override?.suggestionTemplate ?? 'Choisis une charge qui respecte le RER cible',
      rationale: "Pas d'historique: démarre conservateur et logge ta perf.",
      lastText
    }
  }

  if (week === 'DELOAD') {
    if (lastEntry.loadKg !== undefined || lastEntry.reps !== undefined) {
      if (lastEntry.loadKg === undefined && lastEntry.reps !== undefined) {
        return {
          kind: 'load_reps',
          suggestionText: override?.suggestionTemplate ?? `Garde ${lastEntry.reps} reps (charge facile)`,
          rationale: 'DELOAD: on réduit la charge pour récupérer.',
          suggestedReps: lastEntry.reps,
          lastText
        }
      }
      const suggestedLoadKg =
        lastEntry.loadKg !== undefined
          ? roundToIncrement(lastEntry.loadKg * 0.85)
          : undefined
      const suggestedReps = lastEntry.reps
      return {
        kind: 'load_reps',
        suggestionText: override?.suggestionTemplate ??
          (suggestedLoadKg !== undefined
            ? `${suggestedLoadKg} kg × ${suggestedReps ?? '?'}`
            : `Garde ${suggestedReps ?? '?'} reps avec charge facile`),
        rationale: 'DELOAD: on réduit la charge (~10-20%) pour récupérer.',
        suggestedLoadKg,
        suggestedReps,
        lastText
      }
    }
    if (lastEntry.meters !== undefined) {
      const suggestedMeters = toInt(lastEntry.meters * 0.75)
      return {
        kind: 'meters',
        suggestionText: override?.suggestionTemplate ?? `${suggestedMeters} m`,
        rationale: 'DELOAD: volume réduit pour récupérer.',
        suggestedMeters,
        lastText
      }
    }
    if (lastEntry.seconds !== undefined) {
      const suggestedSeconds = toInt(lastEntry.seconds * 0.85)
      return {
        kind: 'seconds',
        suggestionText: override?.suggestionTemplate ?? `${suggestedSeconds}s qualité`,
        rationale: 'DELOAD: durée allégée, exécution propre.',
        suggestedSeconds,
        lastText
      }
    }
  }

  if (fatigue === 'FATIGUE') {
    if (lastEntry.loadKg !== undefined || lastEntry.reps !== undefined) {
      if (lastEntry.loadKg === undefined && lastEntry.reps !== undefined) {
        return {
          kind: 'load_reps',
          suggestionText: override?.suggestionTemplate ?? `${lastEntry.reps} reps`,
          rationale: 'Fatigue: on stabilise pour garder la qualité.',
          suggestedReps: lastEntry.reps,
          lastText
        }
      }
      return {
        kind: 'load_reps',
        suggestionText: override?.suggestionTemplate ?? `${lastEntry.loadKg ?? '?'} kg × ${lastEntry.reps ?? '?'}`,
        rationale: 'Fatigue: on stabilise pour garder la qualité.',
        suggestedLoadKg: lastEntry.loadKg,
        suggestedReps: lastEntry.reps,
        lastText
      }
    }
    if (lastEntry.meters !== undefined) {
      return {
        kind: 'meters',
        suggestionText: override?.suggestionTemplate ?? `${lastEntry.meters} m`,
        rationale: 'Fatigue: on stabilise le volume.',
        suggestedMeters: lastEntry.meters,
        lastText
      }
    }
    if (lastEntry.seconds !== undefined) {
      return {
        kind: 'seconds',
        suggestionText: override?.suggestionTemplate ?? `${lastEntry.seconds}s`,
        rationale: 'Fatigue: garde le même effort, propre et contrôlé.',
        suggestedSeconds: lastEntry.seconds,
        lastText
      }
    }
  }

  if (lastEntry.loadKg !== undefined || lastEntry.reps !== undefined) {
    if (lastEntry.loadKg === undefined && lastEntry.reps !== undefined) {
      return {
        kind: 'load_reps',
        suggestionText: override?.suggestionTemplate ?? `${lastEntry.reps} reps`,
        rationale: 'RER cible: garde la qualité et logge ta perf.',
        suggestedReps: lastEntry.reps,
        lastText
      }
    }
    const baseLoad = lastEntry.loadKg ?? 0
    let targetLoad = baseLoad
    if (rer >= 3) {
      targetLoad = Math.max(baseLoad * 1.025, baseLoad + LOAD_INCREMENT_KG)
    } else if (rer === 2) {
      targetLoad = baseLoad * 1.0125
    }

    if (rer <= 1) {
      targetLoad = baseLoad
    }

    const suggestedLoadKg = roundToIncrement(targetLoad)
    const suggestedReps = lastEntry.reps
    const rationale =
      rer >= 3
        ? 'RER 3+: tu gardes de la marge, monte léger.'
        : rer === 2
          ? 'RER 2: progression prudente et contrôlée.'
          : 'RER bas: garde la charge, priorité exécution.'

    return {
      kind: 'load_reps',
      suggestionText: override?.suggestionTemplate ?? `${suggestedLoadKg} kg × ${suggestedReps ?? '?'}`,
      rationale,
      suggestedLoadKg,
      suggestedReps,
      lastText
    }
  }

  if (lastEntry.meters !== undefined) {
    const multiplier = rer >= 3 ? 1.1 : rer <= 1 ? 1 : 1.05
    const suggestedMeters = toInt(lastEntry.meters * multiplier)
    return {
      kind: 'meters',
      suggestionText: override?.suggestionTemplate ?? `${suggestedMeters} m`,
      rationale: rer >= 3 ? 'RER 3+: petite hausse de volume.' : 'RER bas: volume stable ou légère hausse.',
      suggestedMeters,
      lastText
    }
  }

  if (lastEntry.seconds !== undefined) {
    const suggestedSeconds = rer >= 3 ? toInt(lastEntry.seconds * 1.1) : lastEntry.seconds
    return {
      kind: 'seconds',
      suggestionText: override?.suggestionTemplate ?? `${suggestedSeconds}s`,
      rationale:
        rer >= 3
          ? 'RER 3+: légère hausse de durée si la qualité reste bonne.'
          : 'RER bas: garde la même durée, focus qualité.',
      suggestedSeconds,
      lastText
    }
  }

  return {
    kind: 'none',
    suggestionText: override?.suggestionTemplate ?? 'Travaille propre et logge ta perf.',
    rationale: "Pas assez d'historique pour proposer mieux.",
    lastText
  }
}

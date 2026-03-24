/**
 * Premium load suggestion service.
 * Uses RPE-based logic (converted from RIR) with overrides for deload/ACWR/rehab/fatigue.
 * Spec: tech-spec-free-premium-differentiation-roadmap-v1.md T1.3
 */

import type { ExerciseLogEntry, CycleWeek } from '../types/training'
import { EXERCISE_METRIC_OVERRIDES } from '../data/exerciseMetricOverrides.v1'
import { getExerciseMetricType } from './ui/exerciseMetrics'

// ─── Types ──────────────────────────────────────────────────

export type LoadDecision = 'increase' | 'maintain' | 'decrease' | 'no_data' | 'bodyweight' | 'no_suggestion'

export interface LoadSuggestion {
  decision: LoadDecision
  suggestedWeight: number | null
  suggestedReps: number | null
  justification: string
  nextTarget: string | null
  confidence: 'high' | 'medium' | 'low'
}

export interface LoadSuggestionContext {
  exerciseId: string
  lastEntry: ExerciseLogEntry | undefined
  week: CycleWeek
  acwr: number | null
  isRehabActive: boolean
  fatigueLevel: 'normal' | 'high' | 'critical'
  daysSinceLastLog?: number
}

// ─── Increment table by exercise family ─────────────────────

type ExerciseFamily = 'lower_compound' | 'upper_compound' | 'lower_isolation' | 'upper_isolation' | 'bodyweight' | 'conditioning'

const INCREMENT_TABLE: Record<ExerciseFamily, { up: number; down: number }> = {
  lower_compound:  { up: 5,   down: -5 },
  upper_compound:  { up: 2.5, down: -2.5 },
  lower_isolation: { up: 2.5, down: -2.5 },
  upper_isolation: { up: 1,   down: -1 },
  bodyweight:      { up: 0,   down: 0 },
  conditioning:    { up: 0,   down: 0 },
}

function getExerciseFamily(exerciseId: string): ExerciseFamily {
  const override = EXERCISE_METRIC_OVERRIDES[exerciseId]
  const metricType = getExerciseMetricType({ exerciseId })

  // Conditioning exercises
  if (metricType === 'seconds' || metricType === 'meters') return 'conditioning'

  // Bodyweight exercises (reps only, no load)
  if (metricType === 'reps') return 'bodyweight'

  // Family from override
  const family = override?.progressionFamily
  if (family === 'lower_compound') return 'lower_compound'
  if (family === 'upper_compound') return 'upper_compound'
  if (family === 'ballistic_iso') return 'bodyweight'

  // Default: use exercise ID hints
  const id = exerciseId.toLowerCase()
  if (id.includes('squat') || id.includes('deadlift') || id.includes('hip_thrust') || id.includes('lunge') || id.includes('rdl')) {
    return 'lower_compound'
  }
  if (id.includes('bench') || id.includes('overhead') || id.includes('press') || id.includes('row') || id.includes('pull_up') || id.includes('chin_up')) {
    return 'upper_compound'
  }
  if (id.includes('curl') || id.includes('lateral') || id.includes('tricep') || id.includes('fly') || id.includes('raise')) {
    return 'upper_isolation'
  }
  if (id.includes('leg_curl') || id.includes('leg_ext') || id.includes('calf')) {
    return 'lower_isolation'
  }

  return 'upper_isolation' // safe default
}

// ─── RIR → RPE conversion ───────────────────────────────────

function rirToRpe(rir: number | undefined): number | undefined {
  if (rir === undefined) return undefined
  return Math.min(10, Math.max(1, 10 - rir))
}

// ─── Deload check ───────────────────────────────────────────

function isDeloadWeek(week: CycleWeek): boolean {
  return week === 'DELOAD' || week === 'H4' || week === 'W4' || week === 'W8'
}

// ─── Main suggestion function ───────────────────────────────

export function getLoadSuggestion(ctx: LoadSuggestionContext): LoadSuggestion {
  const { exerciseId, lastEntry, week, acwr, isRehabActive, fatigueLevel, daysSinceLastLog } = ctx
  const family = getExerciseFamily(exerciseId)

  // ── Conditioning: no suggestion ──
  if (family === 'conditioning') {
    return {
      decision: 'no_suggestion',
      suggestedWeight: null,
      suggestedReps: null,
      justification: '',
      nextTarget: null,
      confidence: 'high',
    }
  }

  // ── No previous log ──
  if (!lastEntry) {
    return {
      decision: 'no_data',
      suggestedWeight: null,
      suggestedReps: null,
      justification: 'Premiere fois — choisis ta charge, on ajustera ensuite.',
      nextTarget: null,
      confidence: 'low',
    }
  }

  // ── Bodyweight ──
  if (family === 'bodyweight') {
    const rpe = rirToRpe(lastEntry.rir)
    const lastReps = lastEntry.reps ?? 0
    let suggestedReps = lastReps
    let justification = ''

    if (isDeloadWeek(week)) {
      suggestedReps = Math.max(1, lastReps - 2)
      justification = 'Semaine de deload — volume reduit.'
    } else if (acwr !== null && acwr > 1.3) {
      justification = 'Charge elevee — maintien des reps.'
    } else if (isRehabActive) {
      justification = 'Protocole rehab actif — reps stables.'
    } else if (fatigueLevel === 'high' || fatigueLevel === 'critical') {
      justification = 'Fatigue elevee — reps stables.'
    } else if (rpe !== undefined) {
      if (rpe <= 7) {
        suggestedReps = lastReps + 1
        justification = 'Bien maitrise — +1 rep.'
      } else if (rpe === 8) {
        justification = 'Bonne intensite, on consolide.'
      } else if (rpe >= 9 && lastEntry.setsCompleted !== undefined && lastEntry.reps !== undefined && lastEntry.setsCompleted < 1) {
        suggestedReps = Math.max(1, lastReps - 1)
        justification = 'RPE max + reps incompletes — on baisse.'
      } else {
        justification = 'RPE eleve mais reps OK — on consolide.'
      }
    } else {
      justification = 'Continue sur cette base.'
    }

    return {
      decision: 'bodyweight',
      suggestedWeight: null,
      suggestedReps,
      justification,
      nextTarget: suggestedReps > lastReps ? `Prochain objectif : ${suggestedReps + 1} reps` : null,
      confidence: rpe !== undefined ? 'high' : 'medium',
    }
  }

  // ── Weighted exercises ──
  const lastWeight = lastEntry.loadKg ?? 0
  const rpe = rirToRpe(lastEntry.rir)
  const increment = INCREMENT_TABLE[family]

  // ── OVERRIDES (priority order) ──

  // 1. Deload week
  if (isDeloadWeek(week)) {
    const deloadWeight = Math.max(0, Math.round((lastWeight * 0.82) / 2.5) * 2.5) // ~18% reduction, rounded to 2.5
    return {
      decision: 'decrease',
      suggestedWeight: deloadWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Semaine de deload — charge allegee.',
      nextTarget: null,
      confidence: 'high',
    }
  }

  // 2. ACWR > 1.3
  if (acwr !== null && acwr > 1.3) {
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Charge elevee cette semaine — on ne monte pas.',
      nextTarget: null,
      confidence: 'high',
    }
  }

  // 3. Rehab active
  if (isRehabActive) {
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Protocole rehab actif — charge stable.',
      nextTarget: null,
      confidence: 'high',
    }
  }

  // 4. High fatigue
  if (fatigueLevel === 'high' || fatigueLevel === 'critical') {
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Fatigue elevee — on ne monte pas.',
      nextTarget: null,
      confidence: 'high',
    }
  }

  // ── Stale log (>14 days) ──
  if (daysSinceLastLog !== undefined && daysSinceLastLog > 14) {
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Pas de donnees recentes — reprise prudente.',
      nextTarget: null,
      confidence: 'low',
    }
  }

  // ── RPE-based decisions ──
  if (rpe === undefined) {
    // No RPE data — maintain with low confidence
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Continue sur cette base et logge ton RPE.',
      nextTarget: null,
      confidence: 'low',
    }
  }

  // RPE ≤ 7 + all reps completed → INCREASE
  if (rpe <= 7) {
    const newWeight = Math.round((lastWeight + increment.up) / 2.5) * 2.5
    const nextAfter = Math.round((newWeight + increment.up) / 2.5) * 2.5
    return {
      decision: 'increase',
      suggestedWeight: newWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Charge bien maitrisee — on monte.',
      nextTarget: `Si reussi → semaine prochaine ${nextAfter} kg`,
      confidence: 'high',
    }
  }

  // RPE 8 → MAINTAIN
  if (rpe === 8) {
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Bonne intensite, on consolide.',
      nextTarget: `Si RPE redescend → +${increment.up} kg`,
      confidence: 'high',
    }
  }

  // RPE ≥ 9
  // Check if reps were incomplete (setsCompleted < expected is a proxy)
  // Since we don't have explicit "reps incomplete" flag, RPE 9+ with low setsCompleted = incomplete
  const repsLikelyIncomplete = lastEntry.setsCompleted !== undefined && lastEntry.setsCompleted === 0

  if (rpe >= 9 && repsLikelyIncomplete) {
    // RPE ≥ 9 + reps incomplete → DECREASE
    const newWeight = Math.max(0, Math.round((lastWeight + increment.down) / 2.5) * 2.5)
    return {
      decision: 'decrease',
      suggestedWeight: newWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Reps incompletes a RPE max — on baisse.',
      nextTarget: null,
      confidence: 'high',
    }
  }

  if (rpe >= 9) {
    // RPE ≥ 9 + reps completed → MAINTAIN
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'RPE eleve mais reps OK — on consolide avant de monter.',
      nextTarget: null,
      confidence: 'high',
    }
  }

  // Fallback
  return {
    decision: 'maintain',
    suggestedWeight: lastWeight,
    suggestedReps: lastEntry.reps ?? null,
    justification: 'Continue sur cette base.',
    nextTarget: null,
    confidence: 'medium',
  }
}

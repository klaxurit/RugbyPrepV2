/**
 * Premium load suggestion service.
 * Uses RPE-based logic (converted from RIR) with overrides for deload/ACWR/rehab/fatigue.
 *
 * Garde-fous (KB strength-methods.md, double progression Schoenfeld 2021) :
 *  - G1 : min 2 logs historiques avant de proposer une INCREASE.
 *  - G2 : double progression — INCREASE seulement si le haut de fourchette
 *         de reps prescrites est atteint, à l'intérieur de la zone d'effort.
 *  - G4 : match J-2 ou moins → MAINTAIN (sécurité jour de match).
 *  - G5 : trainingLevel === 'starter' → pas de suggestion (BW only).
 *  - G9 : 2 séances consécutives RPE ≥ 9 + reps incomplètes → DECREASE -10%.
 */

import type { AnnualCycle } from '../types/annualPlanning'
import type { ExerciseLogEntry, CycleWeek, FatigueLevel, TrainingLevel } from '../types/training'
import { EXERCISE_METRIC_OVERRIDES } from '../data/exerciseMetricOverrides.v1'
import { estimateBodyweightEntryLoadKg, exerciseSupportsBodyweightEntryLoad } from './bodyweight/estimateBodyweightEntryLoadKg'
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
  fatigueLevel: FatigueLevel
  daysSinceLastLog?: number
  /** Niveau d'entraînement (G5). Starter → jamais de suggestion. */
  trainingLevel?: TrainingLevel
  /** Historique sur cet exo (G1, G9). Du plus récent au plus ancien. */
  historicalEntries?: readonly ExerciseLogEntry[]
  /** Haut de fourchette de reps prescrit (G2). Ex: 5×5 → 5. */
  prescribedRepsHigh?: number
  /** Bas de fourchette — info seulement (utilisé dans la justification). */
  prescribedRepsLow?: number
  /** Jours avant le prochain match (G4). null si pas de match prévu. */
  daysToMatch?: number | null
  /** Poids corps (profil) — charge d'entrée approximative programme BW. */
  weightKg?: number | null
  /** Programme poids de corps / home minimal. */
  isBodyweightProgram?: boolean
  /**
   * Cycle annuel — pilote la zone d'effort visée. Absent → hypothèse in-season,
   * la plus conservatrice.
   */
  cycle?: AnnualCycle
}

// ─── Zone d'effort cible ────────────────────────────────────

/**
 * RPE maximal auquel une série reste « productive » et autorise une
 * progression, par cycle.
 *
 * Hors saison / pré-saison : RER 1–2 (RPE 8–9). Robinson et al. 2024
 * (Sports Med) : l’hypertrophie monte près de l’échec ; la force dépend surtout
 * de la charge — l’échec systématique n’est pas requis.
 *
 * En saison : RER 2–3 (RPE 7–8) pour absorber club + matchs.
 * Les messages utilisateur parlent toujours de RER (ancre produit).
 */
export function progressionEffortCeiling(cycle: AnnualCycle | undefined): number {
  switch (cycle) {
    case 'off_season':
    case 'pre_season':
      return 9
    default:
      return 8
  }
}

/** Libellé RER cible affiché dans les justifications de suggestion. */
export function effortZoneRerLabel(cycle: AnnualCycle | undefined): string {
  switch (cycle) {
    case 'off_season':
    case 'pre_season':
      return 'RER 1–2'
    default:
      return 'RER 2–3'
  }
}

/**
 * Écart au plafond à partir duquel la série est jugée nettement trop facile.
 * On double alors le pas de charge : sans ça, un athlète parti trop léger met
 * des mois à rejoindre sa zone de travail à +1 rep par séance.
 */
const UNDERSHOOT_RPE_GAP = 2

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
  const {
    exerciseId,
    lastEntry,
    week,
    acwr,
    fatigueLevel,
    daysSinceLastLog,
    trainingLevel,
    historicalEntries,
    prescribedRepsHigh,
    prescribedRepsLow,
    daysToMatch,
    weightKg,
    isBodyweightProgram,
    cycle,
  } = ctx
  const family = getExerciseFamily(exerciseId)

  // ── G5 : Starter → jamais de suggestion (BW/bandes uniquement) ──
  if (trainingLevel === 'starter') {
    return {
      decision: 'no_suggestion',
      suggestedWeight: null,
      suggestedReps: null,
      justification: '',
      nextTarget: null,
      confidence: 'high',
    }
  }

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
    if (isBodyweightProgram) {
      const entryLoad = estimateBodyweightEntryLoadKg(exerciseId, weightKg)
      if (entryLoad != null) {
        const entryReps = prescribedRepsLow ?? prescribedRepsHigh ?? null
        return {
          decision: 'no_data',
          suggestedWeight: entryLoad,
          suggestedReps: entryReps,
          justification: `Charge d'entrée estimée (~${entryLoad} kg) à partir de ton poids corps.`,
          nextTarget: null,
          confidence: 'high',
        }
      }
      if (
        exerciseSupportsBodyweightEntryLoad(exerciseId) &&
        (weightKg == null || weightKg <= 0)
      ) {
        return {
          decision: 'no_data',
          suggestedWeight: null,
          suggestedReps: prescribedRepsLow ?? prescribedRepsHigh ?? null,
          justification:
            'Renseigne ton poids dans Profil → Morphologie pour obtenir une charge d\'entrée estimée.',
          nextTarget: null,
          confidence: 'low',
        }
      }
    }
    return {
      decision: 'no_data',
      suggestedWeight: null,
      suggestedReps: prescribedRepsLow ?? prescribedRepsHigh ?? null,
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
    } else if (fatigueLevel === 'high' || fatigueLevel === 'very_high') {
      justification = 'Fatigue elevee — reps stables.'
    } else if (rpe !== undefined) {
      const effortCeiling = progressionEffortCeiling(cycle)
      const rerZone = effortZoneRerLabel(cycle)
      if (rpe <= effortCeiling) {
        // Dans la zone de travail : on progresse. Nettement en dessous, on
        // rattrape plus vite.
        const step = effortCeiling - rpe >= UNDERSHOOT_RPE_GAP ? 2 : 1
        suggestedReps = lastReps + step
        justification =
          step === 2
            ? `Trop facile vs ${rerZone} — on accélère.`
            : `Dans la zone ${rerZone} — on progresse.`
      } else if (rpe >= 9 && lastEntry.setsCompleted !== undefined && lastEntry.reps !== undefined && lastEntry.setsCompleted < 1) {
        suggestedReps = Math.max(1, lastReps - 1)
        justification = 'Échec trop proche + reps incomplètes — on baisse.'
      } else {
        justification = `Trop proche de l'échec pour ce cycle (vise ${rerZone}) — on consolide.`
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

  // 1bis. G4 — Match J-2 ou moins → MAINTAIN
  if (daysToMatch !== undefined && daysToMatch !== null && daysToMatch <= 2 && daysToMatch >= 0) {
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Match dans 48h — pas de progression aujourd\'hui.',
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

  // 3. High fatigue
  if (fatigueLevel === 'high' || fatigueLevel === 'very_high') {
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: 'Fatigue elevee — on ne monte pas.',
      nextTarget: null,
      confidence: 'high',
    }
  }

  // ── G9 : 2 séances consécutives RPE ≥ 9 + reps incomplètes → DECREASE -10% ──
  // (Inspecte uniquement les 2 dernières entrées historiques.)
  if (historicalEntries && historicalEntries.length >= 2) {
    const isFailedHard = (e: ExerciseLogEntry): boolean => {
      const rpe = rirToRpe(e.rir)
      const incomplete = e.setsCompleted !== undefined && e.setsCompleted === 0
      return rpe !== undefined && rpe >= 9 && incomplete
    }
    const last2 = historicalEntries.slice(0, 2)
    if (last2.every(isFailedHard)) {
      const newWeight = Math.max(0, Math.round((lastWeight * 0.9) / 2.5) * 2.5)
      return {
        decision: 'decrease',
        suggestedWeight: newWeight,
        suggestedReps: lastEntry.reps ?? null,
        justification: '2 séances échec consécutives — on baisse de 10%.',
        nextTarget: 'Envisage un deload si ça persiste.',
        confidence: 'high',
      }
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

  // ── Série dans la zone de travail → double progression ──
  //
  // Plafond cycle : RPE 9 hors saison (RER 1–2), RPE 8 en saison (RER 2–3).
  // Une série à RPE 8 hors saison n'est pas « trop dure » : c'est la cible.
  const effortCeiling = progressionEffortCeiling(cycle)
  const rerZone = effortZoneRerLabel(cycle)
  if (rpe <= effortCeiling) {
    // G1 : min 2 logs historiques sur cet exo avant de proposer une INCREASE.
    // Sans baseline suffisante on ne peut pas extrapoler en sécurité.
    const historicalCount = historicalEntries?.length ?? 0
    if (historicalCount < 2) {
      return {
        decision: 'maintain',
        suggestedWeight: lastWeight,
        suggestedReps: lastEntry.reps ?? null,
        justification: 'Pas assez de séances loguées — on reprend la même charge.',
        nextTarget: null,
        confidence: 'low',
      }
    }

    // G2 : double progression — on ne monte la charge que quand le HAUT
    // de fourchette de reps est atteint (KB Schoenfeld 2021). Si non atteint,
    // on reste sur la charge et on vise +1 rep.
    const lastReps = lastEntry.reps ?? 0
    if (prescribedRepsHigh !== undefined && lastReps < prescribedRepsHigh) {
      return {
        decision: 'maintain',
        suggestedWeight: lastWeight,
        suggestedReps: Math.min(prescribedRepsHigh, lastReps + 1),
        justification: `Dans la zone ${rerZone} — vise ${prescribedRepsHigh} reps avant de monter la charge.`,
        nextTarget: `Quand tu atteins ${prescribedRepsHigh} reps → +${increment.up} kg`,
        confidence: 'high',
      }
    }

    // Tous les feux verts → INCREASE
    // Builder : increment divisé par 2 (rampe plus douce).
    // Série nettement sous la zone cible : pas double, pour rattraper le retard
    // de charge au lieu de le traîner sur des mois.
    const baseStep = trainingLevel === 'builder' ? increment.up / 2 : increment.up
    const isUndershooting = effortCeiling - rpe >= UNDERSHOOT_RPE_GAP
    const upStep = isUndershooting ? baseStep * 2 : baseStep
    const newWeight = Math.round((lastWeight + upStep) / 2.5) * 2.5
    const nextAfter = Math.round((newWeight + upStep) / 2.5) * 2.5
    return {
      decision: 'increase',
      suggestedWeight: newWeight,
      suggestedReps: prescribedRepsHigh !== undefined
        ? Math.max(1, prescribedRepsHigh - 2)
        : lastEntry.reps ?? null,
      justification: isUndershooting
        ? `Trop facile vs ${rerZone} — on rattrape la charge.`
        : `Dans la zone ${rerZone} — on monte.`,
      nextTarget: `Si réussi → semaine prochaine ${nextAfter} kg`,
      confidence: 'high',
    }
  }

  // ── Au-dessus de la zone de travail ──
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
      justification: `Échec trop proche + reps incomplètes — on baisse (cible ${rerZone}).`,
      nextTarget: null,
      confidence: 'high',
    }
  }

  if (rpe >= 9) {
    // RPE ≥ 9 + reps completed → MAINTAIN (souvent hors zone en saison)
    return {
      decision: 'maintain',
      suggestedWeight: lastWeight,
      suggestedReps: lastEntry.reps ?? null,
      justification: `Trop proche de l'échec pour ce cycle (vise ${rerZone}) — on consolide.`,
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

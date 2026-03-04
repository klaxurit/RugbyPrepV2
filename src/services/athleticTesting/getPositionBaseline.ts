/**
 * Baselines athlétiques par poste et niveau — Rugby Union
 * Sources : Duthie et al. 2003/2006, Cahill et al. 2013, Read et al. 2018,
 *           Tee et al. 2011, Smart et al. 2014, Quarrie et al. 2013, Pyne et al. 2014
 */
import type { RugbyPositionGroup, TrainingLevel } from '../../types/training'
import type { PhysicalTestType, PositionBaseline } from '../../types/athleticTesting'

// ─── CMJ baselines (cm) — higher is better ───────────────────────────────────
// Pro = Top 14/Premiership, Amateur = Fed3/Regional, Beginner = −25–30% vs pro
const CMJ_BASELINES: Record<RugbyPositionGroup, { pro: number; amateur: number; beginner: number }> = {
  FRONT_ROW:   { pro: 35, amateur: 29, beginner: 25 },
  SECOND_ROW:  { pro: 41, amateur: 34, beginner: 29 },
  BACK_ROW:    { pro: 43, amateur: 36, beginner: 31 },
  HALF_BACKS:  { pro: 44, amateur: 37, beginner: 32 },
  CENTERS:     { pro: 45, amateur: 38, beginner: 33 },
  BACK_THREE:  { pro: 47, amateur: 40, beginner: 34 },
}

// ─── Sprint 10m baselines (secondes) — lower is better ───────────────────────
// Amateur = +0.10–0.15s vs pro, Beginner = +0.20–0.30s vs pro
const SPRINT_10M_BASELINES: Record<RugbyPositionGroup, { pro: number; amateur: number; beginner: number }> = {
  FRONT_ROW:   { pro: 1.88, amateur: 1.98, beginner: 2.10 },
  SECOND_ROW:  { pro: 1.78, amateur: 1.88, beginner: 2.00 },
  BACK_ROW:    { pro: 1.74, amateur: 1.84, beginner: 1.96 },
  HALF_BACKS:  { pro: 1.70, amateur: 1.80, beginner: 1.92 },
  CENTERS:     { pro: 1.68, amateur: 1.78, beginner: 1.90 },
  BACK_THREE:  { pro: 1.62, amateur: 1.72, beginner: 1.84 },
}

// ─── YYIR1 baselines (mètres) — higher is better ─────────────────────────────
// Midpoint of pro range; Amateur = −25%, Beginner = −35%
const YYIR1_BASELINES: Record<RugbyPositionGroup, { pro: number; amateur: number; beginner: number }> = {
  FRONT_ROW:   { pro: 1080, amateur: 810,  beginner: 700 },
  SECOND_ROW:  { pro: 1240, amateur: 930,  beginner: 810 },
  BACK_ROW:    { pro: 1440, amateur: 1080, beginner: 940 },
  HALF_BACKS:  { pro: 1640, amateur: 1230, beginner: 1070 },
  CENTERS:     { pro: 1680, amateur: 1260, beginner: 1090 },
  BACK_THREE:  { pro: 1900, amateur: 1425, beginner: 1235 },
}

// ─── Mapping training level → colonne baseline ───────────────────────────────
const LEVEL_COL: Record<TrainingLevel, 'pro' | 'amateur' | 'beginner'> = {
  starter:     'beginner',
  builder:     'amateur',
  performance: 'pro',
}

// ─── 1RM squat ratios × BW (kg) ──────────────────────────────────────────────
// Starter = débutant (1.0/0.9), Builder = intermédiaire (1.5/1.4), Performance = avancé (2.0/1.8)
function getOneRMSquatBaseline(
  position: RugbyPositionGroup,
  _trainingLevel: TrainingLevel,
  weightKg: number
): { pro: number; amateur: number; beginner: number } {
  const isForward = ['FRONT_ROW', 'SECOND_ROW', 'BACK_ROW'].includes(position)
  // ratios : [beginner, amateur/intermediate, pro/advanced]
  const ratios = isForward
    ? { beginner: 1.0, amateur: 1.5, pro: 2.0 }
    : { beginner: 0.9, amateur: 1.4, pro: 1.8 }
  return {
    pro:      Math.round(ratios.pro * weightKg),
    amateur:  Math.round(ratios.amateur * weightKg),
    beginner: Math.round(ratios.beginner * weightKg),
  }
}

function getOneRMBenchBaseline(
  position: RugbyPositionGroup,
  _trainingLevel: TrainingLevel,
  weightKg: number
): { pro: number; amateur: number; beginner: number } {
  const isForward = ['FRONT_ROW', 'SECOND_ROW', 'BACK_ROW'].includes(position)
  const isBack = ['BACK_THREE'].includes(position)
  const ratios = isForward
    ? { beginner: 0.8, amateur: 1.1, pro: 1.4 }
    : isBack
    ? { beginner: 0.7, amateur: 0.9, pro: 1.2 }
    : { beginner: 0.7, amateur: 1.0, pro: 1.25 }
  return {
    pro:      Math.round(ratios.pro * weightKg),
    amateur:  Math.round(ratios.amateur * weightKg),
    beginner: Math.round(ratios.beginner * weightKg),
  }
}

function getOneRMDeadliftBaseline(
  position: RugbyPositionGroup,
  _trainingLevel: TrainingLevel,
  weightKg: number
): { pro: number; amateur: number; beginner: number } {
  const isForward = ['FRONT_ROW', 'SECOND_ROW', 'BACK_ROW'].includes(position)
  const ratios = isForward
    ? { beginner: 1.3, amateur: 1.7, pro: 2.1 }
    : { beginner: 1.2, amateur: 1.6, pro: 1.9 }
  return {
    pro:      Math.round(ratios.pro * weightKg),
    amateur:  Math.round(ratios.amateur * weightKg),
    beginner: Math.round(ratios.beginner * weightKg),
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getPositionBaseline(
  position: RugbyPositionGroup | undefined,
  trainingLevel: TrainingLevel | undefined,
  testType: PhysicalTestType,
  weightKg?: number
): PositionBaseline | null {
  if (!position) return null

  const pos = position

  switch (testType) {
    case 'cmj': {
      const b = CMJ_BASELINES[pos]
      return { ...b, unit: 'cm', higherIsBetter: true }
    }
    case 'sprint_10m': {
      const b = SPRINT_10M_BASELINES[pos]
      return { ...b, unit: 's', higherIsBetter: false }
    }
    case 'yyir1': {
      const b = YYIR1_BASELINES[pos]
      return { ...b, unit: 'm', higherIsBetter: true }
    }
    case 'one_rm_squat': {
      if (!weightKg) return null
      const b = getOneRMSquatBaseline(pos, trainingLevel ?? 'builder', weightKg)
      return { ...b, unit: 'kg', higherIsBetter: true }
    }
    case 'one_rm_bench': {
      if (!weightKg) return null
      const b = getOneRMBenchBaseline(pos, trainingLevel ?? 'builder', weightKg)
      return { ...b, unit: 'kg', higherIsBetter: true }
    }
    case 'one_rm_deadlift': {
      if (!weightKg) return null
      const b = getOneRMDeadliftBaseline(pos, trainingLevel ?? 'builder', weightKg)
      return { ...b, unit: 'kg', higherIsBetter: true }
    }
    case 'hooper': {
      // Score Hooper (4 items × 1–7) — lower is better
      // Pro: ≤10 (excellent), Amateur: ≤14 (normal), Beginner: ≤18 (fatigue accumulée)
      return { pro: 10, amateur: 14, beginner: 18, unit: 'pts', higherIsBetter: false }
    }
    default:
      return null
  }
}

/**
 * Retourne le label du niveau pour l'affichage dans les cartes.
 * Mapping : starter→Débutant, builder→Avancé, performance→Pro
 */
export function getBaselineLevelLabel(level: TrainingLevel | undefined): string {
  switch (level) {
    case 'starter':     return 'débutant'
    case 'builder':     return 'avancé'
    case 'performance': return 'pro'
    default:            return 'avancé'
  }
}

/**
 * Retourne la valeur baseline correspondant au niveau du joueur.
 */
export function getBaselineForLevel(
  baseline: PositionBaseline,
  level: TrainingLevel | undefined
): number {
  const col = LEVEL_COL[level ?? 'builder']
  return baseline[col]
}

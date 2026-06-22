import type { AnnualCycle } from '../types/annualPlanning'

/** Presets admin pour poser l'ancre du cycle annuel (planning_anchors). */
export type AdminPlanningAnchorPreset = {
  id: string
  label: string
  seasonMode?: AnnualCycle
  anchors: Record<string, unknown>
}

const OFF_WEEKS: Array<{ week: number; phase: string }> = [
  { week: 1, phase: 'Récupération' },
  { week: 2, phase: 'Récupération' },
  { week: 3, phase: 'Transition' },
  { week: 4, phase: 'Transition' },
  { week: 5, phase: 'Hypertrophie' },
  { week: 6, phase: 'Hypertrophie' },
  { week: 7, phase: 'Hypertrophie' },
  { week: 8, phase: 'Hypertrophie' },
  { week: 9, phase: 'Force-Pont' },
  { week: 10, phase: 'Force-Pont' },
]

const PRE_WEEKS: Array<{ week: number; phase: string }> = [
  { week: 1, phase: 'Force' },
  { week: 2, phase: 'Force' },
  { week: 3, phase: 'Force' },
  { week: 4, phase: 'Force' },
  { week: 5, phase: 'Puissance' },
  { week: 6, phase: 'Puissance' },
  { week: 7, phase: 'Puissance' },
  { week: 8, phase: 'Puissance-Vitesse' },
  { week: 9, phase: 'Puissance-Vitesse' },
  { week: 10, phase: 'Puissance-Vitesse' },
  { week: 11, phase: 'Puissance-Vitesse' },
  { week: 12, phase: 'Puissance-Vitesse' },
]

function offSeasonPresets(): AdminPlanningAnchorPreset[] {
  return OFF_WEEKS.map(({ week, phase }) => ({
    id: `off_s${week}`,
    label: `Inter-saison · ${phase} (S${week})`,
    seasonMode: 'off_season',
    anchors: {
      manualCycleOverride: 'off_season',
      manualOffSeasonWeekOverride: week,
      onboardingCycleHint: 'off_season',
    },
  }))
}

function preSeasonPresets(): AdminPlanningAnchorPreset[] {
  return PRE_WEEKS.map(({ week, phase }) => ({
    id: `pre_s${week}`,
    label: `Pré-saison · ${phase} (S${week})`,
    seasonMode: 'pre_season',
    anchors: {
      manualCycleOverride: 'pre_season',
      manualPreSeasonWeekOverride: week,
      onboardingCycleHint: 'pre_season',
    },
  }))
}

export const ADMIN_PLANNING_ANCHOR_PRESETS: AdminPlanningAnchorPreset[] = [
  {
    id: 'auto',
    label: 'Auto (sans override manuel)',
    anchors: {
      manualCycleOverride: null,
      manualOffSeasonWeekOverride: null,
      manualPreSeasonWeekOverride: null,
    },
  },
  {
    id: 'in_season',
    label: 'En saison',
    seasonMode: 'in_season',
    anchors: {
      manualCycleOverride: 'in_season',
      manualOffSeasonWeekOverride: null,
      manualPreSeasonWeekOverride: null,
      onboardingCycleHint: 'in_season',
      manualPlayoffs: null,
    },
  },
  {
    id: 'playoffs',
    label: 'Playoffs',
    seasonMode: 'in_season',
    anchors: {
      manualCycleOverride: 'playoffs',
      manualPlayoffs: true,
      onboardingCycleHint: 'playoffs',
    },
  },
  ...offSeasonPresets(),
  ...preSeasonPresets(),
]

export function findAdminPlanningPreset(id: string): AdminPlanningAnchorPreset | undefined {
  return ADMIN_PLANNING_ANCHOR_PRESETS.find((p) => p.id === id)
}

/** Fusionne un preset dans les ancres existantes (null = efface la clé). */
export function mergeAdminPlanningPreset(
  existing: Record<string, unknown> | null | undefined,
  preset: AdminPlanningAnchorPreset
): Record<string, unknown> {
  const base = { ...(existing ?? {}) }
  for (const [key, value] of Object.entries(preset.anchors)) {
    if (value === null || value === undefined) {
      delete base[key]
    } else {
      base[key] = value
    }
  }
  return base
}

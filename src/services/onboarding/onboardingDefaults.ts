import type { AnnualCycle } from '../../types/annualPlanning'
import type { SCSchedule, TrainingBaseline } from '../../types/training'
import { TRAINING_DAYS_DEFAULT } from '../program/scheduleOptimizer'
import { resolveDefaultFfrSeasonClock } from '../season/defaultFfrSeasonClock'

export const ONBOARDING_DEFAULT_TRAINING_BASELINE: TrainingBaseline = 'active'

export type OnboardingSeasonPhase = Exclude<AnnualCycle, 'playoffs'>

/** Phase de saison déduite de l’horloge FFR amateur — pas de question, pas de match inventé. */
export function resolveOnboardingSeasonPhase(today: Date = new Date()): OnboardingSeasonPhase {
  return resolveDefaultFfrSeasonClock(today).cycle
}

/** Jours salle par défaut (mar/jeu ou lun/mer/ven). `auto` : le scheduler pourra réécrire si un club est ajouté plus tard. */
export function buildDefaultScSchedule(weeklySessions: 2 | 3): SCSchedule {
  return {
    sessions: TRAINING_DAYS_DEFAULT[weeklySessions].map((day, i) => ({
      sessionIndex: i as 0 | 1 | 2,
      day,
    })),
    source: 'auto',
  }
}

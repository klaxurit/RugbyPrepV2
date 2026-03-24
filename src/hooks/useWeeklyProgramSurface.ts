/**
 * Hook de composition — appelle resolveWeeklyProgramSurface avec les données
 * déjà lues par le composant parent. Aucun hook stateful interne.
 */
import { useMemo } from 'react'
import type { CalendarEvent, CycleWeek, SessionLog, UserProfile } from '../types/training'
import type { ProgramFeatureFlags } from '../services/program/policies/featureFlags'
import type { AcwrZoneInput } from '../services/annualPlanning/buildAthletePlanningInputs'
import {
  resolveWeeklyProgramSurface,
  type WeeklyProgramSurfaceResult,
} from '../services/program/resolveWeeklyProgramSurface'

export interface UseWeeklyProgramSurfaceParams {
  profile: UserProfile
  events: CalendarEvent[]
  logs: SessionLog[]
  today: string
  fatigue: 'OK' | 'FATIGUE'
  acwrZone: AcwrZoneInput
  week: CycleWeek
  lastNonDeloadWeek: CycleWeek
  ignoreAcwrOverload: boolean
  hasSufficientACWRData: boolean
  featureFlags: Partial<ProgramFeatureFlags>
}

export interface UseWeeklyProgramSurfaceResult {
  isReady: boolean
  surface: WeeklyProgramSurfaceResult | null
}

export function useWeeklyProgramSurface(
  params: UseWeeklyProgramSurfaceParams | null,
): UseWeeklyProgramSurfaceResult {
  return useMemo(() => {
    if (!params) return { isReady: false, surface: null }

    const surface = resolveWeeklyProgramSurface(params)
    return { isReady: true, surface }
  }, [params])
}

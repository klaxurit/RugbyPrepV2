/**
 * Hook de composition — appelle resolveWeeklyProgramSurface avec les données
 * déjà lues par le composant parent, then layers on the S4 presentation data.
 *
 * Block progression is previewed synchronously for a coherent first render,
 * then persisted/normalized in useEffect.
 */
import { useEffect, useMemo } from 'react'
import type { CalendarEvent, CycleWeek, SessionLog, UserProfile } from '../types/training'
import type { ProgramFeatureFlags } from '../services/program/policies/featureFlags'
import type { AcwrZoneInput } from '../services/annualPlanning/buildAthletePlanningInputs'
import type { BlockProgressionState, WeekPresentation } from '../types/scheduling'
import {
  resolveWeeklyProgramSurface,
  type WeeklyProgramSurfaceResult,
} from '../services/program/resolveWeeklyProgramSurface'
import { resolveWeekPresentation } from '../services/scheduling/resolveWeekPresentation'
import {
  getBlockProgression,
  previewBlockProgression,
} from '../services/scheduling/resolveBlockProgression'

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
  readinessScore?: number
  jumpTrend?: 'up' | 'flat' | 'down'
  /** Required for block progression (localStorage scoping). */
  userId?: string | null
}

export interface UseWeeklyProgramSurfaceResult {
  isReady: boolean
  surface: WeeklyProgramSurfaceResult | null
  /** Shorthand for surface.schedulingMode — `null` when surface is not ready. */
  schedulingMode: WeeklyProgramSurfaceResult['schedulingMode'] | null
  /** S4 presentation layer — null when surface is not ready. */
  weekPresentation: WeekPresentation | null
  /** S4 block progression — undefined when not in sequential mode or not ready. */
  blockProgression: BlockProgressionState | undefined
}

export function useWeeklyProgramSurface(
  params: UseWeeklyProgramSurfaceParams | null,
): UseWeeklyProgramSurfaceResult {
  // 1. Pure surface resolution (no side effects)
  const surface = useMemo(() => {
    if (!params) return null
    return resolveWeeklyProgramSurface(params)
  }, [params])

  // 2. Synchronous preview for a coherent first render.
  const blockProgression = useMemo(() => {
    if (!surface || !params?.userId || surface.schedulingMode !== 'sequential') return undefined
    return previewBlockProgression(params.userId, params.today, surface.planningContext)
  }, [surface, params])

  // 3. Persist/init/advance after paint using the same deterministic source.
  useEffect(() => {
    if (!surface || !params?.userId || surface.schedulingMode !== 'sequential') return
    getBlockProgression(params.userId, params.today, surface.planningContext)
  }, [surface, params])

  // 4. Week presentation (pure, synchronous)
  const weekPresentation = useMemo(() => {
    if (!surface || !params || !surface.motherSession) return null

    return resolveWeekPresentation({
      motherSessions: surface.motherSession.sessions,
      schedulingMode: surface.schedulingMode,
      events: params.events,
      today: params.today,
      clubSchedule: params.profile.clubSchedule,
      scSchedule: params.profile.scSchedule,
      corrections: [],
      blockProgression,
    })
  }, [surface, params, blockProgression])

  return {
    isReady: surface !== null,
    surface,
    schedulingMode: surface?.schedulingMode ?? null,
    weekPresentation,
    blockProgression,
  }
}

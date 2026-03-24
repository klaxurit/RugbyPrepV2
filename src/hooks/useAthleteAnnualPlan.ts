import { useMemo } from 'react'
import { buildAthletePlanningInputs } from '../services/annualPlanning/buildAthletePlanningInputs'
import { resolveMotherSessionsForWeek } from '../services/motherSession/resolveMotherSessionsForWeek'
import { useACWR } from './useACWR'
import { useAuth } from './useAuth'
import { useCalendar } from './useCalendar'
import { useFatigue } from './useFatigue'
import { useHistory } from './useHistory'
import { useProfile } from './useProfile'

function localDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface UseAthleteAnnualPlanResult {
  isReady: boolean
  planningInputsWarnings: string[]
  resolution: ReturnType<typeof resolveMotherSessionsForWeek> | null
  derived: {
    resolvedPositionGroup: 'front_row' | 'back_three'
    fatigueLevel: 'normal' | 'high' | 'very_high'
  } | null
}

/**
 * Compose profil, calendrier, historique, fatigue, ACWR → resolver mother sessions / plan annuel.
 */
export function useAthleteAnnualPlan(): UseAthleteAnnualPlanResult {
  const { authState, isInitializing } = useAuth()
  const { profile } = useProfile()
  const { events } = useCalendar()
  const { logs } = useHistory()
  const { fatigue } = useFatigue()
  const acwrResult = useACWR(logs, events)

  const isReady = !isInitializing
  const userId = authState.status === 'authenticated' ? authState.user?.id : undefined

  return useMemo(() => {
    if (!isReady) {
      return {
        isReady: false,
        planningInputsWarnings: [],
        resolution: null,
        derived: null,
      }
    }

    const today = localDateISO(new Date())

    const athleteIdentity =
      userId || profile.clubCode
        ? {
            ...(userId ? { athleteId: userId } : {}),
            ...(profile.clubCode ? { clubId: profile.clubCode } : {}),
            source: 'self' as const,
          }
        : undefined

    const { inputs, warnings: planningInputsWarnings, derived } = buildAthletePlanningInputs({
      profile,
      events,
      logs,
      today,
      fatigue,
      acwrZone: acwrResult.hasSufficientData ? acwrResult.zone : null,
      athleteIdentity,
    })

    const resolution = resolveMotherSessionsForWeek(inputs)

    return {
      isReady: true,
      planningInputsWarnings,
      resolution,
      derived,
    }
  }, [
    isReady,
    profile,
    events,
    logs,
    fatigue,
    acwrResult.hasSufficientData,
    acwrResult.zone,
    userId,
  ])
}

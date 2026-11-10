import { useMemo } from 'react'
import type { UseWeeklyProgramSurfaceParams } from './useWeeklyProgramSurface'
import type { Lang } from '../i18n/appLabels'
import { resolveMonthProgramGrid, type MonthProgramGrid } from '../services/scheduling/resolveMonthProgramGrid'

export function useMonthProgramGrid(
  surfaceParams: UseWeeklyProgramSurfaceParams,
  opts: {
    year: number
    month: number
    lang: Lang
    enabled?: boolean
    /** Fin d’onboarding / création compte — cutoff « Manquée ». */
    programVisibleFromISO?: string | null
  },
): MonthProgramGrid | null {
  const { year, month, lang, enabled = true, programVisibleFromISO = null } = opts
  const {
    profile,
    events,
    logs,
    today,
    fatigue,
    week,
    lastNonDeloadWeek,
    acwrZone,
    readinessScore,
    jumpTrend,
    ignoreAcwrOverload,
    hasSufficientACWRData,
    featureFlags,
  } = surfaceParams

  return useMemo(() => {
    if (!enabled) return null
    return resolveMonthProgramGrid({
      profile,
      events,
      logs,
      today,
      fatigue,
      week,
      lastNonDeloadWeek,
      acwrZone,
      readinessScore,
      jumpTrend,
      ignoreAcwrOverload,
      hasSufficientACWRData,
      featureFlags,
      year,
      month,
      lang,
      programVisibleFromISO,
    })
  }, [
    enabled,
    year,
    month,
    lang,
    programVisibleFromISO,
    profile,
    events,
    logs,
    today,
    fatigue,
    week,
    lastNonDeloadWeek,
    acwrZone,
    readinessScore,
    jumpTrend,
    ignoreAcwrOverload,
    hasSufficientACWRData,
    featureFlags,
  ])
}

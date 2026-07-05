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
  },
): MonthProgramGrid | null {
  const { year, month, lang, enabled = true } = opts
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
    })
  }, [
    enabled,
    year,
    month,
    lang,
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

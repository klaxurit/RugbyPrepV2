import { useMemo } from 'react'
import type { ACWRZone } from './useACWR'
import type { SessionLog } from '../types/training'
import { computeReadinessScore, type ReadinessResult } from '../services/readiness/computeReadinessScore'

export interface UseReadinessScoreParams {
  acwrZone: ACWRZone | null
  fatigue: 'OK' | 'FATIGUE'
  logs: SessionLog[]
  nextMatchDate: string | null
  today: string
}

export function useReadinessScore(params: UseReadinessScoreParams): ReadinessResult {
  const { acwrZone, fatigue, logs, nextMatchDate, today } = params
  const lastSessionDateISO = logs.length > 0 ? logs[0].dateISO : null

  return useMemo(
    () =>
      computeReadinessScore({
        acwrZone,
        fatigue,
        lastSessionDateISO,
        nextMatchDateISO: nextMatchDate,
        todayISO: today,
      }),
    [acwrZone, fatigue, lastSessionDateISO, nextMatchDate, today],
  )
}

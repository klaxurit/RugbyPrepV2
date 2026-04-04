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
  // Active recovery is not training — exclude from "last session" determination
  const trainingLogs = logs.filter((l) => l.sessionType !== 'ACTIVE_RECOVERY')
  const lastSessionDateISO = trainingLogs.length > 0 ? trainingLogs[0].dateISO : null

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

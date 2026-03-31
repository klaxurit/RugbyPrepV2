import { useMemo } from 'react'
import type { BlockLog, SessionLog } from '../types/training'
import { computeWeeklySummary, type WeeklySummaryResult } from '../services/analytics/computeWeeklySummary'

export interface UseWeeklySummaryParams {
  logs: SessionLog[]
  blockLogs: BlockLog[]
  plannedSessionCount: number
  today: string
}

export function useWeeklySummary(params: UseWeeklySummaryParams): WeeklySummaryResult {
  const { logs, blockLogs, plannedSessionCount, today } = params

  return useMemo(
    () => computeWeeklySummary({ logs, blockLogs, plannedSessionCount, todayISO: today }),
    [logs, blockLogs, plannedSessionCount, today],
  )
}

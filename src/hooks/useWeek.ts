import { useCallback, useEffect, useState } from 'react'
import type { CycleWeek } from '../types/training'

const STORAGE_KEY = 'rugbyprep.week.v1'
const LAST_NON_DELOAD_KEY = 'rugbyprep.week.lastnon.v1'
const DEFAULT_WEEK: CycleWeek = 'W1'
const WEEK_VALUES: CycleWeek[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'DELOAD']

const isCycleWeek = (value: unknown): value is CycleWeek =>
  typeof value === 'string' && WEEK_VALUES.includes(value as CycleWeek)

const readWeek = (): CycleWeek => {
  if (typeof window === 'undefined') return DEFAULT_WEEK
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return isCycleWeek(raw) ? raw : DEFAULT_WEEK
  } catch {
    return DEFAULT_WEEK
  }
}

const readLastNonDeloadWeek = (): CycleWeek => {
  if (typeof window === 'undefined') return DEFAULT_WEEK
  try {
    const raw = window.localStorage.getItem(LAST_NON_DELOAD_KEY)
    return isCycleWeek(raw) && raw !== 'DELOAD' ? raw : DEFAULT_WEEK
  } catch {
    return DEFAULT_WEEK
  }
}

export const useWeek = () => {
  const [week, setWeekState] = useState<CycleWeek>(readWeek)
  const [lastNonDeloadWeek, setLastNonDeloadWeek] = useState<CycleWeek>(
    readLastNonDeloadWeek
  )

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, week)
  }, [week])

  const setWeek = useCallback((next: CycleWeek) => {
    setWeekState(next)
    if (next !== 'DELOAD') {
      setLastNonDeloadWeek(next)
      window.localStorage.setItem(LAST_NON_DELOAD_KEY, next)
    }
  }, [])

  return { week, setWeek, lastNonDeloadWeek }
}

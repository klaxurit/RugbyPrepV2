import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CycleWeek } from '../types/training'

const STORAGE_KEY = 'rugbyprep.week.v1'
const LAST_NON_DELOAD_KEY = 'rugbyprep.week.lastnon.v1'
const DEFAULT_WEEK: CycleWeek = 'W1'
const WEEK_VALUES: CycleWeek[] = ['H1', 'H2', 'H3', 'H4', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'DELOAD']

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

export interface WeekContextValue {
  week: CycleWeek
  setWeek: (next: CycleWeek) => void
  lastNonDeloadWeek: CycleWeek
}

export const WeekContext = createContext<WeekContextValue | null>(null)

interface WeekProviderProps {
  children: ReactNode
}

export function WeekProvider({ children }: WeekProviderProps) {
  const [week, setWeekState] = useState<CycleWeek>(readWeek)
  const [lastNonDeloadWeek, setLastNonDeloadWeek] = useState<CycleWeek>(readLastNonDeloadWeek)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, week)
  }, [week])

  // Sync from other tabs (storage event)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && isCycleWeek(e.newValue)) {
        setWeekState(e.newValue)
      }
      if (e.key === LAST_NON_DELOAD_KEY && e.newValue && isCycleWeek(e.newValue) && e.newValue !== 'DELOAD') {
        setLastNonDeloadWeek(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setWeek = useCallback((next: CycleWeek) => {
    setWeekState(next)
    if (next !== 'DELOAD') {
      setLastNonDeloadWeek(next)
      window.localStorage.setItem(LAST_NON_DELOAD_KEY, next)
    }
  }, [])

  const value: WeekContextValue = { week, setWeek, lastNonDeloadWeek }

  return <WeekContext.Provider value={value}>{children}</WeekContext.Provider>
}

export function useWeekContext(): WeekContextValue {
  const ctx = useContext(WeekContext)
  if (!ctx) {
    throw new Error('useWeekContext must be used within WeekProvider')
  }
  return ctx
}

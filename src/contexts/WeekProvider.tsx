import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CycleWeek } from '../types/training'
import { WeekContext } from './weekContext'
import {
  STORAGE_KEY,
  LAST_NON_DELOAD_KEY,
  readWeek,
  readLastNonDeloadWeek,
  isCycleWeek,
} from './weekStorage'

interface WeekProviderProps {
  children: ReactNode
}

export function WeekProvider({ children }: WeekProviderProps) {
  const [week, setWeekState] = useState<CycleWeek>(readWeek)
  const [lastNonDeloadWeek, setLastNonDeloadWeek] = useState<CycleWeek>(readLastNonDeloadWeek)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, week)
  }, [week])

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

  const value = { week, setWeek, lastNonDeloadWeek }

  return <WeekContext.Provider value={value}>{children}</WeekContext.Provider>
}

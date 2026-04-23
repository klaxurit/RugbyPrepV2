import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CycleWeek } from '../types/training'
import { WeekContext } from './weekContext'
import {
  weekStorageKey,
  lastNonDeloadStorageKey,
  readWeek,
  readLastNonDeloadWeek,
  isCycleWeek,
} from './weekStorage'
import { useAuth } from '../hooks/useAuth'

interface WeekProviderProps {
  children: ReactNode
}

export function WeekProvider({ children }: WeekProviderProps) {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [week, setWeekState] = useState<CycleWeek>(() => readWeek(userId))
  const [lastNonDeloadWeek, setLastNonDeloadWeek] = useState<CycleWeek>(() => readLastNonDeloadWeek(userId))

  // Re-seed when userId changes : each user has its own week state.
  useEffect(() => {
    setWeekState(readWeek(userId))
    setLastNonDeloadWeek(readLastNonDeloadWeek(userId))
  }, [userId])

  useEffect(() => {
    try {
      window.localStorage.setItem(weekStorageKey(userId), week)
    } catch { /* ignore */ }
  }, [week, userId])

  useEffect(() => {
    const currentWeekKey = weekStorageKey(userId)
    const currentLastNonKey = lastNonDeloadStorageKey(userId)
    const onStorage = (e: StorageEvent) => {
      if (e.key === currentWeekKey && e.newValue && isCycleWeek(e.newValue)) {
        setWeekState(e.newValue)
      }
      if (e.key === currentLastNonKey && e.newValue && isCycleWeek(e.newValue) && e.newValue !== 'DELOAD') {
        setLastNonDeloadWeek(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [userId])

  const setWeek = useCallback((next: CycleWeek) => {
    setWeekState(next)
    if (next !== 'DELOAD') {
      setLastNonDeloadWeek(next)
      try {
        window.localStorage.setItem(lastNonDeloadStorageKey(userId), next)
      } catch { /* ignore */ }
    }
  }, [userId])

  const value = { week, setWeek, lastNonDeloadWeek }

  return <WeekContext.Provider value={value}>{children}</WeekContext.Provider>
}

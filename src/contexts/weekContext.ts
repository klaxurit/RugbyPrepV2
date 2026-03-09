import { createContext } from 'react'
import type { CycleWeek } from '../types/training'

export interface WeekContextValue {
  week: CycleWeek
  setWeek: (next: CycleWeek) => void
  lastNonDeloadWeek: CycleWeek
}

export const WeekContext = createContext<WeekContextValue | null>(null)

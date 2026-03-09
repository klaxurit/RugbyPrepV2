import type { CycleWeek } from '../types/training'

export const STORAGE_KEY = 'rugbyprep.week.v1'
export const LAST_NON_DELOAD_KEY = 'rugbyprep.week.lastnon.v1'
export const DEFAULT_WEEK: CycleWeek = 'W1'
export const WEEK_VALUES: CycleWeek[] = ['H1', 'H2', 'H3', 'H4', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'DELOAD']

export const isCycleWeek = (value: unknown): value is CycleWeek =>
  typeof value === 'string' && WEEK_VALUES.includes(value as CycleWeek)

export const readWeek = (): CycleWeek => {
  if (typeof window === 'undefined') return DEFAULT_WEEK
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return isCycleWeek(raw) ? raw : DEFAULT_WEEK
  } catch {
    return DEFAULT_WEEK
  }
}

export const readLastNonDeloadWeek = (): CycleWeek => {
  if (typeof window === 'undefined') return DEFAULT_WEEK
  try {
    const raw = window.localStorage.getItem(LAST_NON_DELOAD_KEY)
    return isCycleWeek(raw) && raw !== 'DELOAD' ? raw : DEFAULT_WEEK
  } catch {
    return DEFAULT_WEEK
  }
}

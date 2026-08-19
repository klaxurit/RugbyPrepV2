import type { CycleWeek } from '../types/training'
import { userScopedKey } from '../services/storage/userScopedStorage'

export const STORAGE_BASE = 'rugbyprep.week'
export const LAST_NON_DELOAD_BASE = 'rugbyprep.week.lastnon'
/** Fallback CycleWeek uniquement — le programme réel vient de l'horloge annuelle. */
export const DEFAULT_WEEK: CycleWeek = 'W1'
export const WEEK_VALUES: CycleWeek[] = ['H1', 'H2', 'H3', 'H4', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'DELOAD']

export const isCycleWeek = (value: unknown): value is CycleWeek =>
  typeof value === 'string' && WEEK_VALUES.includes(value as CycleWeek)

export const weekStorageKey = (userId: string | null): string =>
  userScopedKey(STORAGE_BASE, userId)

export const lastNonDeloadStorageKey = (userId: string | null): string =>
  userScopedKey(LAST_NON_DELOAD_BASE, userId)

export const readWeek = (userId: string | null): CycleWeek => {
  if (typeof window === 'undefined') return DEFAULT_WEEK
  try {
    const raw = window.localStorage.getItem(weekStorageKey(userId))
    return isCycleWeek(raw) ? raw : DEFAULT_WEEK
  } catch {
    return DEFAULT_WEEK
  }
}

export const readLastNonDeloadWeek = (userId: string | null): CycleWeek => {
  if (typeof window === 'undefined') return DEFAULT_WEEK
  try {
    const raw = window.localStorage.getItem(lastNonDeloadStorageKey(userId))
    return isCycleWeek(raw) && raw !== 'DELOAD' ? raw : DEFAULT_WEEK
  } catch {
    return DEFAULT_WEEK
  }
}

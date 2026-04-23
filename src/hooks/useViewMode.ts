import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { userScopedKey } from '../services/storage/userScopedStorage'

export type ViewMode = 'compact' | 'detail'

const STORAGE_BASE = 'rugbyprep.viewmode'
const DEFAULT_MODE: ViewMode = 'compact'

const isViewMode = (value: unknown): value is ViewMode =>
  value === 'compact' || value === 'detail'

const readMode = (userId: string | null): ViewMode => {
  if (typeof window === 'undefined') return DEFAULT_MODE
  try {
    const raw = window.localStorage.getItem(userScopedKey(STORAGE_BASE, userId))
    return isViewMode(raw) ? raw : DEFAULT_MODE
  } catch {
    return DEFAULT_MODE
  }
}

export const useViewMode = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [viewMode, setViewModeState] = useState<ViewMode>(() => readMode(userId))

  useEffect(() => {
    setViewModeState(readMode(userId))
  }, [userId])

  useEffect(() => {
    try {
      window.localStorage.setItem(userScopedKey(STORAGE_BASE, userId), viewMode)
    } catch { /* ignore */ }
  }, [viewMode, userId])

  const setViewMode = useCallback((next: ViewMode) => {
    setViewModeState(next)
  }, [])

  return { viewMode, setViewMode }
}

import { useCallback, useEffect, useState } from 'react'

export type ViewMode = 'compact' | 'detail'

const STORAGE_KEY = 'rugbyprep.viewmode.v1'
const DEFAULT_MODE: ViewMode = 'compact'

const isViewMode = (value: unknown): value is ViewMode =>
  value === 'compact' || value === 'detail'

const readMode = (): ViewMode => {
  if (typeof window === 'undefined') return DEFAULT_MODE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return isViewMode(raw) ? raw : DEFAULT_MODE
  } catch {
    return DEFAULT_MODE
  }
}

export const useViewMode = () => {
  const [viewMode, setViewModeState] = useState<ViewMode>(readMode)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, viewMode)
  }, [viewMode])

  const setViewMode = useCallback((next: ViewMode) => {
    setViewModeState(next)
  }, [])

  return { viewMode, setViewMode }
}

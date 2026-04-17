import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * Session run state machine — tracks the "En cours" mode of a workout session.
 * Persistence: localStorage (single-device, reasonable for MVP).
 * Auto-expires after 24h to avoid resuming stale runs.
 */

export type SessionRunStatus = 'idle' | 'running'

export interface SessionRunValue {
  status: SessionRunStatus
  /** Unique key for the running session — typically `${motherSessionId}_${dateISO}`. */
  sessionKey: string | null
  /** ms timestamp of start. */
  startedAt: number | null
  /** Set of exercise keys marked as done (format: `${blockIndex}_${exerciseIndex}`). */
  completedExercises: Set<string>
  start: (sessionKey: string) => void
  stop: () => void
  /** Check if user has a running session matching the given sessionKey. */
  isRunningFor: (sessionKey: string) => boolean
  markExerciseDone: (exerciseKey: string) => void
  unmarkExerciseDone: (exerciseKey: string) => void
  resetCompleted: () => void
}

const SessionRunContext = createContext<SessionRunValue | null>(null)

const STORAGE_KEY = 'rf.sessionRun.v1'
const EXPIRY_MS = 24 * 60 * 60 * 1000

interface PersistedState {
  sessionKey: string
  startedAt: number
  completedExercises: string[]
}

function readPersisted(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (!parsed || typeof parsed.sessionKey !== 'string' || typeof parsed.startedAt !== 'number') return null
    if (Date.now() - parsed.startedAt > EXPIRY_MS) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writePersisted(state: PersistedState | null) {
  if (typeof window === 'undefined') return
  try {
    if (state == null) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  } catch {
    // ignore quota errors
  }
}

export function SessionRunProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionRunStatus>('idle')
  const [sessionKey, setSessionKey] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  useEffect(() => {
    const persisted = readPersisted()
    if (persisted) {
      setStatus('running')
      setSessionKey(persisted.sessionKey)
      setStartedAt(persisted.startedAt)
      setCompletedExercises(new Set(persisted.completedExercises))
    }
  }, [])

  const persist = useCallback(
    (next: { sessionKey: string; startedAt: number; completedExercises: Set<string> } | null) => {
      if (next == null) {
        writePersisted(null)
      } else {
        writePersisted({
          sessionKey: next.sessionKey,
          startedAt: next.startedAt,
          completedExercises: Array.from(next.completedExercises),
        })
      }
    },
    [],
  )

  const start = useCallback(
    (key: string) => {
      const now = Date.now()
      setStatus('running')
      setSessionKey(key)
      setStartedAt(now)
      setCompletedExercises(new Set())
      persist({ sessionKey: key, startedAt: now, completedExercises: new Set() })
    },
    [persist],
  )

  const stop = useCallback(() => {
    setStatus('idle')
    setSessionKey(null)
    setStartedAt(null)
    setCompletedExercises(new Set())
    persist(null)
  }, [persist])

  const isRunningFor = useCallback(
    (key: string) => status === 'running' && sessionKey === key,
    [status, sessionKey],
  )

  const markExerciseDone = useCallback(
    (exerciseKey: string) => {
      setCompletedExercises((prev) => {
        if (prev.has(exerciseKey)) return prev
        const next = new Set(prev)
        next.add(exerciseKey)
        if (sessionKey && startedAt != null) {
          persist({ sessionKey, startedAt, completedExercises: next })
        }
        return next
      })
    },
    [persist, sessionKey, startedAt],
  )

  const unmarkExerciseDone = useCallback(
    (exerciseKey: string) => {
      setCompletedExercises((prev) => {
        if (!prev.has(exerciseKey)) return prev
        const next = new Set(prev)
        next.delete(exerciseKey)
        if (sessionKey && startedAt != null) {
          persist({ sessionKey, startedAt, completedExercises: next })
        }
        return next
      })
    },
    [persist, sessionKey, startedAt],
  )

  const resetCompleted = useCallback(() => {
    setCompletedExercises(new Set())
    if (sessionKey && startedAt != null) {
      persist({ sessionKey, startedAt, completedExercises: new Set() })
    }
  }, [persist, sessionKey, startedAt])

  const value = useMemo<SessionRunValue>(
    () => ({
      status,
      sessionKey,
      startedAt,
      completedExercises,
      start,
      stop,
      isRunningFor,
      markExerciseDone,
      unmarkExerciseDone,
      resetCompleted,
    }),
    [status, sessionKey, startedAt, completedExercises, start, stop, isRunningFor, markExerciseDone, unmarkExerciseDone, resetCompleted],
  )

  return <SessionRunContext.Provider value={value}>{children}</SessionRunContext.Provider>
}

// Fallback no-op used when a consumer renders outside <SessionRunProvider>
// (e.g. unit tests that don't need run-mode). Keeps components that just read
// the status safe to render in isolation.
const NOOP_VALUE: SessionRunValue = {
  status: 'idle',
  sessionKey: null,
  startedAt: null,
  completedExercises: new Set(),
  start: () => {},
  stop: () => {},
  isRunningFor: () => false,
  markExerciseDone: () => {},
  unmarkExerciseDone: () => {},
  resetCompleted: () => {},
}

export function useSessionRun(): SessionRunValue {
  const ctx = useContext(SessionRunContext)
  return ctx ?? NOOP_VALUE
}

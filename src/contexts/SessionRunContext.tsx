import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * Session run state machine — tracks the "En cours" mode of a workout session.
 * Persistence: localStorage (single-device, reasonable for MVP).
 * Auto-expires after 24h to avoid resuming stale runs.
 */

export type SessionRunStatus = 'idle' | 'running'

export interface SetEntry {
  loadKg?: number
  reps?: number
  /** True when user has marked this set as validated. */
  done: boolean
}

export interface RestTimerState {
  /** Seconds the timer was started with. */
  totalSeconds: number
  /** Wall-clock end time (ms since epoch). */
  endsAt: number
  /** Optional label (ex. exercise name) shown in the overlay. */
  label?: string
}

export interface SessionRunValue {
  status: SessionRunStatus
  /** Unique key for the running session — typically `${motherSessionId}_${dateISO}`. */
  sessionKey: string | null
  /** ms timestamp of start. */
  startedAt: number | null
  /** Set of exercise keys marked as done (format: `${blockIndex}_${exerciseIndex}`). */
  completedExercises: Set<string>
  /** Per-exercise set-by-set logging. Key = same exerciseKey as completedExercises. */
  perExerciseSets: Record<string, SetEntry[]>
  start: (sessionKey: string) => void
  stop: () => void
  /** Check if user has a running session matching the given sessionKey. */
  isRunningFor: (sessionKey: string) => boolean
  markExerciseDone: (exerciseKey: string) => void
  unmarkExerciseDone: (exerciseKey: string) => void
  resetCompleted: () => void
  /** Replace sets for a given exercise. */
  setExerciseSets: (exerciseKey: string, sets: SetEntry[]) => void
  /** Update a single set for a given exercise (preserves others). */
  updateExerciseSet: (exerciseKey: string, setIndex: number, patch: Partial<SetEntry>) => void
  /** Rest timer state (runs between sets). null = idle. */
  restTimer: RestTimerState | null
  startRestTimer: (seconds: number, label?: string) => void
  adjustRestTimer: (deltaSeconds: number) => void
  skipRestTimer: () => void
}

const SessionRunContext = createContext<SessionRunValue | null>(null)

const STORAGE_KEY = 'rf.sessionRun.v1'
const EXPIRY_MS = 24 * 60 * 60 * 1000

interface PersistedState {
  sessionKey: string
  startedAt: number
  completedExercises: string[]
  perExerciseSets?: Record<string, SetEntry[]>
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
  const [perExerciseSets, setPerExerciseSets] = useState<Record<string, SetEntry[]>>({})
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null)

  useEffect(() => {
    const persisted = readPersisted()
    if (persisted) {
      setStatus('running')
      setSessionKey(persisted.sessionKey)
      setStartedAt(persisted.startedAt)
      setCompletedExercises(new Set(persisted.completedExercises))
      setPerExerciseSets(persisted.perExerciseSets ?? {})
    }
  }, [])

  const persist = useCallback(
    (next: {
      sessionKey: string
      startedAt: number
      completedExercises: Set<string>
      perExerciseSets: Record<string, SetEntry[]>
    } | null) => {
      if (next == null) {
        writePersisted(null)
      } else {
        writePersisted({
          sessionKey: next.sessionKey,
          startedAt: next.startedAt,
          completedExercises: Array.from(next.completedExercises),
          perExerciseSets: next.perExerciseSets,
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
      setPerExerciseSets({})
      persist({ sessionKey: key, startedAt: now, completedExercises: new Set(), perExerciseSets: {} })
    },
    [persist],
  )

  const stop = useCallback(() => {
    setStatus('idle')
    setSessionKey(null)
    setStartedAt(null)
    setCompletedExercises(new Set())
    setPerExerciseSets({})
    setRestTimer(null)
    persist(null)
  }, [persist])

  const startRestTimer = useCallback((seconds: number, label?: string) => {
    setRestTimer({ totalSeconds: seconds, endsAt: Date.now() + seconds * 1000, label })
  }, [])

  const adjustRestTimer = useCallback((delta: number) => {
    setRestTimer((prev) => {
      if (!prev) return prev
      const newEndsAt = prev.endsAt + delta * 1000
      if (newEndsAt <= Date.now()) return null
      return { ...prev, endsAt: newEndsAt, totalSeconds: Math.max(prev.totalSeconds + delta, 0) }
    })
  }, [])

  const skipRestTimer = useCallback(() => {
    setRestTimer(null)
  }, [])

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
          persist({ sessionKey, startedAt, completedExercises: next, perExerciseSets })
        }
        return next
      })
    },
    [persist, sessionKey, startedAt, perExerciseSets],
  )

  const unmarkExerciseDone = useCallback(
    (exerciseKey: string) => {
      setCompletedExercises((prev) => {
        if (!prev.has(exerciseKey)) return prev
        const next = new Set(prev)
        next.delete(exerciseKey)
        if (sessionKey && startedAt != null) {
          persist({ sessionKey, startedAt, completedExercises: next, perExerciseSets })
        }
        return next
      })
    },
    [persist, sessionKey, startedAt, perExerciseSets],
  )

  const resetCompleted = useCallback(() => {
    setCompletedExercises(new Set())
    if (sessionKey && startedAt != null) {
      persist({ sessionKey, startedAt, completedExercises: new Set(), perExerciseSets })
    }
  }, [persist, sessionKey, startedAt, perExerciseSets])

  const setExerciseSets = useCallback(
    (exerciseKey: string, sets: SetEntry[]) => {
      setPerExerciseSets((prev) => {
        const next = { ...prev, [exerciseKey]: sets }
        if (sessionKey && startedAt != null) {
          persist({ sessionKey, startedAt, completedExercises, perExerciseSets: next })
        }
        return next
      })
    },
    [persist, sessionKey, startedAt, completedExercises],
  )

  const updateExerciseSet = useCallback(
    (exerciseKey: string, setIndex: number, patch: Partial<SetEntry>) => {
      setPerExerciseSets((prev) => {
        const existing = prev[exerciseKey] ?? []
        const updated = existing.map((s, i) => (i === setIndex ? { ...s, ...patch } : s))
        const next = { ...prev, [exerciseKey]: updated }
        if (sessionKey && startedAt != null) {
          persist({ sessionKey, startedAt, completedExercises, perExerciseSets: next })
        }
        return next
      })
    },
    [persist, sessionKey, startedAt, completedExercises],
  )

  const value = useMemo<SessionRunValue>(
    () => ({
      status,
      sessionKey,
      startedAt,
      completedExercises,
      perExerciseSets,
      start,
      stop,
      isRunningFor,
      markExerciseDone,
      unmarkExerciseDone,
      resetCompleted,
      setExerciseSets,
      updateExerciseSet,
      restTimer,
      startRestTimer,
      adjustRestTimer,
      skipRestTimer,
    }),
    [status, sessionKey, startedAt, completedExercises, perExerciseSets, start, stop, isRunningFor, markExerciseDone, unmarkExerciseDone, resetCompleted, setExerciseSets, updateExerciseSet, restTimer, startRestTimer, adjustRestTimer, skipRestTimer],
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
  perExerciseSets: {},
  start: () => {},
  stop: () => {},
  isRunningFor: () => false,
  markExerciseDone: () => {},
  unmarkExerciseDone: () => {},
  resetCompleted: () => {},
  setExerciseSets: () => {},
  updateExerciseSet: () => {},
  restTimer: null,
  startRestTimer: () => {},
  adjustRestTimer: () => {},
  skipRestTimer: () => {},
}

export function useSessionRun(): SessionRunValue {
  const ctx = useContext(SessionRunContext)
  return ctx ?? NOOP_VALUE
}

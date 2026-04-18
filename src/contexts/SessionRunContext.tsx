import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * Session run state machine — tracks the "En cours" mode of a workout session.
 * Persistence: localStorage (single-device, reasonable for MVP).
 * Auto-expires after 24h to avoid resuming stale runs.
 *
 * Modélisation : l'unité est le TOUR, pas la série. Un bloc d'entraînement
 * comporte N tours ; chaque tour enchaîne tous les exos du bloc (sans repos
 * interne). Le repos se déclenche uniquement à la fin d'un tour.
 *
 * Clé d'une étape validée : `${blockNumber}_${tourIndex}_${exerciseIndex}`
 *   - blockNumber : numéro du bloc (stable, cf. Block.number)
 *   - tourIndex   : 0-based
 *   - exerciseIndex : 0-based, position dans block.exercises
 */

export type SessionRunStatus = 'idle' | 'running'

export interface ExerciseTourLoad {
  loadKg?: number
  reps?: number
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
  /** Étapes validées (format `${blockNumber}_${tourIndex}_${exerciseIndex}`). */
  completedExercises: Set<string>
  /** Premium only : charges/reps saisies par étape. */
  exerciseTourLoads: Record<string, ExerciseTourLoad>
  start: (sessionKey: string) => void
  stop: () => void
  /** Check if user has a running session matching the given sessionKey. */
  isRunningFor: (sessionKey: string) => boolean
  markExerciseDone: (key: string) => void
  unmarkExerciseDone: (key: string) => void
  resetCompleted: () => void
  /** Met à jour kg/reps pour une étape (premium). */
  setExerciseTourLoad: (key: string, patch: ExerciseTourLoad) => void
  /** Rest timer state. null = idle. */
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
  exerciseTourLoads?: Record<string, ExerciseTourLoad>
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
  const [exerciseTourLoads, setExerciseTourLoads] = useState<Record<string, ExerciseTourLoad>>({})
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null)

  useEffect(() => {
    const persisted = readPersisted()
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hydrate state from localStorage on mount
      setStatus('running')
      setSessionKey(persisted.sessionKey)
      setStartedAt(persisted.startedAt)
      setCompletedExercises(new Set(persisted.completedExercises))
      setExerciseTourLoads(persisted.exerciseTourLoads ?? {})
    }
  }, [])

  const persist = useCallback(
    (next: {
      sessionKey: string
      startedAt: number
      completedExercises: Set<string>
      exerciseTourLoads: Record<string, ExerciseTourLoad>
    } | null) => {
      if (next == null) {
        writePersisted(null)
      } else {
        writePersisted({
          sessionKey: next.sessionKey,
          startedAt: next.startedAt,
          completedExercises: Array.from(next.completedExercises),
          exerciseTourLoads: next.exerciseTourLoads,
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
      setExerciseTourLoads({})
      persist({ sessionKey: key, startedAt: now, completedExercises: new Set(), exerciseTourLoads: {} })
    },
    [persist],
  )

  const stop = useCallback(() => {
    setStatus('idle')
    setSessionKey(null)
    setStartedAt(null)
    setCompletedExercises(new Set())
    setExerciseTourLoads({})
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
    (key: string) => {
      setCompletedExercises((prev) => {
        if (prev.has(key)) return prev
        const next = new Set(prev)
        next.add(key)
        if (sessionKey && startedAt != null) {
          persist({ sessionKey, startedAt, completedExercises: next, exerciseTourLoads })
        }
        return next
      })
    },
    [persist, sessionKey, startedAt, exerciseTourLoads],
  )

  const unmarkExerciseDone = useCallback(
    (key: string) => {
      setCompletedExercises((prev) => {
        if (!prev.has(key)) return prev
        const next = new Set(prev)
        next.delete(key)
        if (sessionKey && startedAt != null) {
          persist({ sessionKey, startedAt, completedExercises: next, exerciseTourLoads })
        }
        return next
      })
    },
    [persist, sessionKey, startedAt, exerciseTourLoads],
  )

  const resetCompleted = useCallback(() => {
    setCompletedExercises(new Set())
    if (sessionKey && startedAt != null) {
      persist({ sessionKey, startedAt, completedExercises: new Set(), exerciseTourLoads })
    }
  }, [persist, sessionKey, startedAt, exerciseTourLoads])

  const setExerciseTourLoad = useCallback(
    (key: string, patch: ExerciseTourLoad) => {
      setExerciseTourLoads((prev) => {
        const existing = prev[key] ?? {}
        const next = { ...prev, [key]: { ...existing, ...patch } }
        if (sessionKey && startedAt != null) {
          persist({ sessionKey, startedAt, completedExercises, exerciseTourLoads: next })
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
      exerciseTourLoads,
      start,
      stop,
      isRunningFor,
      markExerciseDone,
      unmarkExerciseDone,
      resetCompleted,
      setExerciseTourLoad,
      restTimer,
      startRestTimer,
      adjustRestTimer,
      skipRestTimer,
    }),
    [status, sessionKey, startedAt, completedExercises, exerciseTourLoads, start, stop, isRunningFor, markExerciseDone, unmarkExerciseDone, resetCompleted, setExerciseTourLoad, restTimer, startRestTimer, adjustRestTimer, skipRestTimer],
  )

  return <SessionRunContext.Provider value={value}>{children}</SessionRunContext.Provider>
}

// Fallback no-op used when a consumer renders outside <SessionRunProvider>.
const NOOP_VALUE: SessionRunValue = {
  status: 'idle',
  sessionKey: null,
  startedAt: null,
  completedExercises: new Set(),
  exerciseTourLoads: {},
  start: () => {},
  stop: () => {},
  isRunningFor: () => false,
  markExerciseDone: () => {},
  unmarkExerciseDone: () => {},
  resetCompleted: () => {},
  setExerciseTourLoad: () => {},
  restTimer: null,
  startRestTimer: () => {},
  adjustRestTimer: () => {},
  skipRestTimer: () => {},
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useSessionRun(): SessionRunValue {
  const ctx = useContext(SessionRunContext)
  return ctx ?? NOOP_VALUE
}

// ─── Helpers pour clés "blockNumber_tourIndex_exerciseIndex" ────────────────

// eslint-disable-next-line react-refresh/only-export-components -- helper colocated with provider
export function buildExerciseTourKey(blockNumber: number, tourIndex: number, exerciseIndex: number): string {
  return `${blockNumber}_${tourIndex}_${exerciseIndex}`
}

// eslint-disable-next-line react-refresh/only-export-components -- helper colocated with provider
export function parseExerciseTourKey(key: string): { blockNumber: number; tourIndex: number; exerciseIndex: number } | null {
  const parts = key.split('_')
  if (parts.length !== 3) return null
  const [b, t, e] = parts.map(Number)
  if (!Number.isFinite(b) || !Number.isFinite(t) || !Number.isFinite(e)) return null
  return { blockNumber: b, tourIndex: t, exerciseIndex: e }
}

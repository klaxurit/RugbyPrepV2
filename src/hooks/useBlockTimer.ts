import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TimedBlockFormat } from '../services/ui/parseBlockFormat'

/**
 * Chronomètre générique pour les blocs à format temporel (EMOM, Tabata, AMRAP, For Time).
 *
 * État interne minimal — l'UI lit `snapshot` qui est recalculé à chaque tick.
 * Les transitions (ex. passage d'un work-rest à l'autre en Tabata, d'une minute
 * à l'autre en EMOM) sont détectées via des callbacks côté hôte.
 *
 * `persistKey` : survit aux remounts (switch d'app / re-render parent) en
 * restaurant startedAt + pauses depuis un store module-level.
 */

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface TimerSnapshot {
  status: TimerStatus
  /** Temps écoulé total depuis le start (hors pauses), en secondes. */
  elapsedSec: number
  /** Temps total prévu du bloc (null pour For Time). */
  totalSec: number | null
  /** Pour EMOM : index 0-based de la minute en cours. */
  currentMinute?: number
  /** Pour EMOM : total des minutes prévues. */
  totalMinutes?: number
  /** Pour EMOM/Tabata : secondes restantes dans l'intervalle courant. */
  remainingInIntervalSec?: number
  /** Pour Tabata : phase de l'intervalle courant. */
  tabataPhase?: 'work' | 'rest'
  /** Pour Tabata : index 0-based du round courant. */
  currentRound?: number
  /** Pour AMRAP : nombre de tours comptés par l'athlète. */
  amrapRounds?: number
}

export interface UseBlockTimerOptions {
  format: TimedBlockFormat
  /**
   * Si fourni, l'état running/paused survit au remount du composant
   * (ex. retour d'arrière-plan qui recrée l'overlay).
   */
  persistKey?: string | null
  /** Déclenché à chaque changement d'intervalle (minute EMOM, work→rest Tabata…). */
  onIntervalBoundary?: (nextSnapshot: TimerSnapshot) => void
  /** Déclenché quand le timer atteint sa fin prévue. */
  onComplete?: () => void
}

type PersistedTimer = {
  startedAt: number
  pausedMs: number
  pauseStartedAt: number | null
  status: 'running' | 'paused'
  amrapRounds: number
}

const persistStore = new Map<string, PersistedTimer>()

/** Test-only / debug. */
export function __clearBlockTimerPersistStore() {
  persistStore.clear()
}

function readPersisted(key: string | null | undefined): PersistedTimer | null {
  if (!key) return null
  return persistStore.get(key) ?? null
}

function writePersisted(key: string | null | undefined, value: PersistedTimer | null) {
  if (!key) return
  if (value == null) persistStore.delete(key)
  else persistStore.set(key, value)
}

function computeElapsedSec(
  startedAt: number,
  pausedMs: number,
  pauseStartedAt: number | null,
  now = Date.now(),
): number {
  const activePause = pauseStartedAt != null ? now - pauseStartedAt : 0
  return Math.max(0, Math.floor((now - startedAt - pausedMs - activePause) / 1000))
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined') return
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }
  try {
    nav.vibrate?.(pattern)
  } catch {
    // ignore
  }
}

export function useBlockTimer({
  format,
  persistKey = null,
  onIntervalBoundary,
  onComplete,
}: UseBlockTimerOptions) {
  const restored = readPersisted(persistKey)

  const [status, setStatus] = useState<TimerStatus>(() => restored?.status ?? 'idle')
  const [elapsedSec, setElapsedSec] = useState(() => {
    if (!restored) return 0
    return computeElapsedSec(
      restored.startedAt,
      restored.pausedMs,
      restored.status === 'paused' ? restored.pauseStartedAt : null,
    )
  })
  const [amrapRounds, setAmrapRounds] = useState(() => restored?.amrapRounds ?? 0)

  const startedAtRef = useRef<number | null>(restored?.startedAt ?? null)
  const pausedMsRef = useRef(restored?.pausedMs ?? 0)
  const pauseStartedAtRef = useRef<number | null>(
    restored?.status === 'paused' ? restored.pauseStartedAt : null,
  )
  const lastBoundaryRef = useRef(-1)
  const persistKeyRef = useRef(persistKey)

  useEffect(() => {
    persistKeyRef.current = persistKey
  }, [persistKey])

  const totalSec = useMemo<number | null>(() => {
    if (format.type === 'for_time') return null
    if (format.type === 'rounds') return null
    return format.totalSeconds
  }, [format])

  const syncPersist = useCallback((nextStatus: TimerStatus) => {
    const key = persistKeyRef.current
    if (!key) return
    if (nextStatus !== 'running' && nextStatus !== 'paused') {
      writePersisted(key, null)
      return
    }
    const startedAt = startedAtRef.current
    if (startedAt == null) {
      writePersisted(key, null)
      return
    }
    writePersisted(key, {
      startedAt,
      pausedMs: pausedMsRef.current,
      pauseStartedAt: pauseStartedAtRef.current,
      status: nextStatus,
      amrapRounds,
    })
  }, [amrapRounds])

  const refreshElapsedFromClock = useCallback(() => {
    const startedAt = startedAtRef.current
    if (startedAt == null) return
    setElapsedSec(
      computeElapsedSec(
        startedAt,
        pausedMsRef.current,
        pauseStartedAtRef.current,
      ),
    )
  }, [])

  // ── Tick loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => {
      refreshElapsedFromClock()
    }, 250)
    return () => window.clearInterval(id)
  }, [status, refreshElapsedFromClock])

  // ── Reprise après arrière-plan : iOS throttle les setInterval ────────────
  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (status !== 'running' && status !== 'paused') return
      refreshElapsedFromClock()
      syncPersist(status)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [status, refreshElapsedFromClock, syncPersist])

  // ── Persistance continue tant que running/paused ────────────────────────
  useEffect(() => {
    if (status === 'running' || status === 'paused') {
      syncPersist(status)
    }
  }, [status, elapsedSec, amrapRounds, syncPersist])

  // ── Dérivations format-spécifiques ─────────────────────────────────────
  const snapshot = useMemo<TimerSnapshot>(() => {
    switch (format.type) {
      case 'emom': {
        const totalMinutes = format.rounds
        const interval = format.intervalSeconds
        const currentMinute = Math.min(totalMinutes - 1, Math.floor(elapsedSec / interval))
        const remainingInIntervalSec = interval - (elapsedSec % interval)
        return {
          status,
          elapsedSec,
          totalSec,
          currentMinute,
          totalMinutes,
          remainingInIntervalSec,
        }
      }
      case 'tabata': {
        const cycle = format.workSeconds + format.restSeconds
        const currentRound = Math.min(format.rounds - 1, Math.floor(elapsedSec / cycle))
        const intoCycle = elapsedSec % cycle
        const isWork = intoCycle < format.workSeconds
        const remainingInIntervalSec = isWork
          ? format.workSeconds - intoCycle
          : cycle - intoCycle
        return {
          status,
          elapsedSec,
          totalSec,
          currentRound,
          tabataPhase: isWork ? 'work' : 'rest',
          remainingInIntervalSec,
        }
      }
      case 'amrap':
        return {
          status,
          elapsedSec,
          totalSec,
          amrapRounds,
        }
      case 'for_time':
        return {
          status,
          elapsedSec,
          totalSec: null,
        }
      default:
        return { status, elapsedSec, totalSec }
    }
  }, [format, status, elapsedSec, totalSec, amrapRounds])

  // ── Détection des frontières d'intervalles → vibration + callback ──────
  useEffect(() => {
    if (status !== 'running') return
    let boundaryKey = -1
    if (format.type === 'emom') {
      boundaryKey = snapshot.currentMinute ?? -1
    } else if (format.type === 'tabata') {
      const round = snapshot.currentRound ?? 0
      const phase = snapshot.tabataPhase === 'work' ? 0 : 1
      boundaryKey = round * 2 + phase
    }
    if (boundaryKey !== -1 && boundaryKey !== lastBoundaryRef.current) {
      if (lastBoundaryRef.current !== -1) {
        vibrate(120)
        onIntervalBoundary?.(snapshot)
      }
      lastBoundaryRef.current = boundaryKey
    }
  }, [status, format, snapshot, onIntervalBoundary])

  // ── Complétion auto ────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'running') return
    if (totalSec == null) return
    if (elapsedSec >= totalSec) {
      vibrate([180, 80, 180])
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: transition to completed when timer reaches total
      setStatus('completed')
      writePersisted(persistKeyRef.current, null)
      onComplete?.()
    }
  }, [status, elapsedSec, totalSec, onComplete])

  // ── Controls ───────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (status === 'running') return
    if (status === 'paused') {
      if (pauseStartedAtRef.current != null) {
        pausedMsRef.current += Date.now() - pauseStartedAtRef.current
        pauseStartedAtRef.current = null
      }
      setStatus('running')
      return
    }
    // idle | completed → nouveau départ
    startedAtRef.current = Date.now()
    pausedMsRef.current = 0
    pauseStartedAtRef.current = null
    lastBoundaryRef.current = -1
    setElapsedSec(0)
    setAmrapRounds(0)
    setStatus('running')
  }, [status])

  const pause = useCallback(() => {
    if (status !== 'running') return
    pauseStartedAtRef.current = Date.now()
    setStatus('paused')
  }, [status])

  const stop = useCallback(() => {
    startedAtRef.current = null
    pausedMsRef.current = 0
    pauseStartedAtRef.current = null
    lastBoundaryRef.current = -1
    setElapsedSec(0)
    setAmrapRounds(0)
    setStatus('idle')
    writePersisted(persistKeyRef.current, null)
  }, [])

  const skipInterval = useCallback(() => {
    if (format.type === 'emom' && startedAtRef.current != null) {
      const now = Date.now()
      const elapsedMs = now - startedAtRef.current - pausedMsRef.current
      const currentMinuteIndex = Math.floor(elapsedMs / (format.intervalSeconds * 1000))
      const targetMs = (currentMinuteIndex + 1) * format.intervalSeconds * 1000
      startedAtRef.current = now - targetMs - pausedMsRef.current
      setElapsedSec(Math.floor(targetMs / 1000))
      return
    }
    if (format.type === 'tabata' && startedAtRef.current != null) {
      const cycle = format.workSeconds + format.restSeconds
      const now = Date.now()
      const elapsedMs = now - startedAtRef.current - pausedMsRef.current
      const currentSec = Math.floor(elapsedMs / 1000)
      const intoCycle = currentSec % cycle
      const isWork = intoCycle < format.workSeconds
      const nextBoundarySec = isWork
        ? currentSec + (format.workSeconds - intoCycle)
        : currentSec + (cycle - intoCycle)
      startedAtRef.current = now - nextBoundarySec * 1000 - pausedMsRef.current
      setElapsedSec(nextBoundarySec)
      return
    }
  }, [format])

  const incrementAmrapRound = useCallback(() => {
    setAmrapRounds((r) => r + 1)
  }, [])

  return {
    snapshot,
    start,
    pause,
    stop,
    skipInterval,
    incrementAmrapRound,
  }
}

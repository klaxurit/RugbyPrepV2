import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TimedBlockFormat } from '../services/ui/parseBlockFormat'

/**
 * Chronomètre générique pour les blocs à format temporel (EMOM, Tabata, AMRAP, For Time).
 *
 * État interne minimal — l'UI lit `snapshot` qui est recalculé à chaque tick.
 * Les transitions (ex. passage d'un work-rest à l'autre en Tabata, d'une minute
 * à l'autre en EMOM) sont détectées via des callbacks côté hôte.
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
  /** Déclenché à chaque changement d'intervalle (minute EMOM, work→rest Tabata…). */
  onIntervalBoundary?: (nextSnapshot: TimerSnapshot) => void
  /** Déclenché quand le timer atteint sa fin prévue. */
  onComplete?: () => void
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

export function useBlockTimer({ format, onIntervalBoundary, onComplete }: UseBlockTimerOptions) {
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [amrapRounds, setAmrapRounds] = useState(0)

  const startedAtRef = useRef<number | null>(null)
  /** Cumul du temps passé en pause (pour ne pas le compter). */
  const pausedMsRef = useRef(0)
  /** Timestamp où la pause courante a commencé (null quand pas en pause). */
  const pauseStartedAtRef = useRef<number | null>(null)
  /** Dernière frontière de minute déclenchée (pour EMOM) / round (Tabata). */
  const lastBoundaryRef = useRef(-1)

  const totalSec = useMemo<number | null>(() => {
    if (format.type === 'for_time') return null
    if (format.type === 'rounds') return null
    return format.totalSeconds
  }, [format])

  // ── Tick loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => {
      const startedAt = startedAtRef.current
      if (startedAt == null) return
      const now = Date.now()
      const rawMs = now - startedAt - pausedMsRef.current
      const sec = Math.max(0, Math.floor(rawMs / 1000))
      setElapsedSec(sec)
    }, 250)
    return () => window.clearInterval(id)
  }, [status])

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
      // Un change de round OU un switch work↔rest est une frontière.
      const round = snapshot.currentRound ?? 0
      const phase = snapshot.tabataPhase === 'work' ? 0 : 1
      boundaryKey = round * 2 + phase
    }
    if (boundaryKey !== -1 && boundaryKey !== lastBoundaryRef.current) {
      // Skip la toute première frontière au start (pas un "changement").
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
      setStatus('completed')
      onComplete?.()
    }
  }, [status, elapsedSec, totalSec, onComplete])

  // ── Controls ───────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (status === 'running') return
    if (status === 'paused' && pauseStartedAtRef.current != null) {
      // Resume : comptabilise la durée de pause et repart.
      pausedMsRef.current += Date.now() - pauseStartedAtRef.current
      pauseStartedAtRef.current = null
      setStatus('running')
      return
    }
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
  }, [])

  const skipInterval = useCallback(() => {
    // EMOM : avance au début de la prochaine minute.
    if (format.type === 'emom' && startedAtRef.current != null) {
      const now = Date.now()
      const elapsedMs = now - startedAtRef.current - pausedMsRef.current
      const currentMinuteIndex = Math.floor(elapsedMs / (format.intervalSeconds * 1000))
      const targetMs = (currentMinuteIndex + 1) * format.intervalSeconds * 1000
      startedAtRef.current = now - targetMs - pausedMsRef.current
      setElapsedSec(Math.floor(targetMs / 1000))
      return
    }
    // Tabata : avance au début du prochain work ou rest.
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

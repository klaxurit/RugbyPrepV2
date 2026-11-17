import { useEffect, useRef } from 'react'
import type { RestTimerState } from '../contexts/SessionRunContext'
import { useRestBeepPref } from './useRestBeepPref'
import { playCountdownBeep, playRestEndWhistle } from '../utils/audioBeep'
import { vibrate } from '../utils/vibrate'
import { REST_END_VIBRATE_PATTERN } from '../services/notifications/restEndHaptic'

const COUNTDOWN_OFFSETS_MS = [3000, 2000, 1000] as const

/**
 * Countdown bip ×3 + sifflet + auto-dismiss du timer repos uniquement au premier plan.
 * En arrière-plan, les notifs SW / push prennent le relais (pas d’audio Web).
 */
export function useRestTimerEndEffects(
  restTimer: RestTimerState | null,
  skipRestTimer: () => void,
): void {
  const { enabled: beepEnabled } = useRestBeepPref()
  const skipRef = useRef(skipRestTimer)
  const beepRef = useRef(beepEnabled)

  useEffect(() => {
    skipRef.current = skipRestTimer
  }, [skipRestTimer])

  useEffect(() => {
    beepRef.current = beepEnabled
  }, [beepEnabled])

  useEffect(() => {
    if (!restTimer) return

    const timerIds: ReturnType<typeof setTimeout>[] = []

    const clearTimers = () => {
      for (const id of timerIds) window.clearTimeout(id)
      timerIds.length = 0
    }

    const schedule = (delayMs: number, fn: () => void) => {
      timerIds.push(window.setTimeout(fn, Math.max(0, delayMs)))
    }

    const fireCountdown = () => {
      if (document.visibilityState !== 'visible') return
      if (beepRef.current) playCountdownBeep()
    }

    const fireEnd = () => {
      if (document.visibilityState !== 'visible') return
      vibrate([...REST_END_VIBRATE_PATTERN])
      if (beepRef.current) playRestEndWhistle()
      schedule(800, () => {
        skipRef.current()
      })
    }

    const arm = () => {
      clearTimers()
      const remaining = restTimer.endsAt - Date.now()
      if (remaining <= 0) {
        if (document.visibilityState === 'visible') {
          fireEnd()
        } else {
          skipRef.current()
        }
        return
      }

      for (const offset of COUNTDOWN_OFFSETS_MS) {
        const delay = remaining - offset
        if (delay >= 0) {
          schedule(delay, fireCountdown)
        }
      }
      schedule(remaining, fireEnd)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && restTimer.endsAt <= Date.now()) {
        clearTimers()
        skipRef.current()
      } else if (document.visibilityState === 'visible') {
        arm()
      }
    }

    arm()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimers()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [restTimer])
}

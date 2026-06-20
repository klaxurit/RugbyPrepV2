import { useEffect, useRef } from 'react'
import type { RestTimerState } from '../contexts/SessionRunContext'
import { useRestBeepPref } from './useRestBeepPref'
import { playRestEndBeep } from '../utils/audioBeep'
import { vibrate } from '../utils/vibrate'

/**
 * Bip + auto-dismiss du timer repos uniquement au premier plan.
 * En arrière-plan, les notifs SW / push prennent le relais.
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

    let beepId: ReturnType<typeof setTimeout> | undefined
    let dismissId: ReturnType<typeof setTimeout> | undefined

    const clearTimers = () => {
      if (beepId != null) window.clearTimeout(beepId)
      if (dismissId != null) window.clearTimeout(dismissId)
      beepId = undefined
      dismissId = undefined
    }

    const fireEnd = () => {
      if (document.visibilityState !== 'visible') return
      vibrate([120, 80, 120])
      if (beepRef.current) playRestEndBeep()
      dismissId = window.setTimeout(() => {
        skipRef.current()
      }, 800)
    }

    const schedule = () => {
      clearTimers()
      if (restTimer.endsAt <= Date.now()) {
        if (document.visibilityState === 'visible') {
          fireEnd()
        } else {
          skipRef.current()
        }
        return
      }
      beepId = window.setTimeout(fireEnd, restTimer.endsAt - Date.now())
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && restTimer.endsAt <= Date.now()) {
        clearTimers()
        skipRef.current()
      } else if (document.visibilityState === 'visible') {
        schedule()
      }
    }

    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimers()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [restTimer])
}

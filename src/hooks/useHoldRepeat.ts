import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'

export interface UseHoldRepeatOptions {
  /** Appelé à chaque pas (tap + hold). */
  onStep: () => void
  /** Délai avant le premier repeat (ms). */
  delayMs?: number
  /** Intervalle initial du repeat (ms). */
  intervalMs?: number
  /** Intervalle accéléré après `accelerateAfterMs`. */
  fastIntervalMs?: number
  /** Après combien de ms de hold on accélère. */
  accelerateAfterMs?: number
  disabled?: boolean
}

/**
 * Press-and-hold : 1 pas immédiat, puis repeat accéléré tant que le doigt reste.
 */
export function useHoldRepeat({
  onStep,
  delayMs = 320,
  intervalMs = 90,
  fastIntervalMs = 40,
  accelerateAfterMs = 900,
  disabled = false,
}: UseHoldRepeatOptions) {
  const onStepRef = useRef(onStep)
  useEffect(() => {
    onStepRef.current = onStep
  }, [onStep])
  const timersRef = useRef<{
    delay?: number
    interval?: number
    accelerate?: number
  }>({})

  const clear = useCallback(() => {
    const t = timersRef.current
    if (t.delay != null) window.clearTimeout(t.delay)
    if (t.accelerate != null) window.clearTimeout(t.accelerate)
    if (t.interval != null) window.clearInterval(t.interval)
    timersRef.current = {}
  }, [])

  useEffect(() => () => clear(), [clear])

  useEffect(() => {
    if (disabled) clear()
  }, [disabled, clear])

  const start = useCallback(() => {
    if (disabled) return
    clear()
    onStepRef.current()

    timersRef.current.delay = window.setTimeout(() => {
      timersRef.current.interval = window.setInterval(() => {
        onStepRef.current()
      }, intervalMs)

      timersRef.current.accelerate = window.setTimeout(() => {
        if (timersRef.current.interval != null) {
          window.clearInterval(timersRef.current.interval)
        }
        timersRef.current.interval = window.setInterval(() => {
          onStepRef.current()
        }, fastIntervalMs)
      }, accelerateAfterMs)
    }, delayMs)
  }, [accelerateAfterMs, clear, delayMs, disabled, fastIntervalMs, intervalMs])

  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return
      e.preventDefault()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      start()
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onLostPointerCapture: clear,
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault()
    },
  }
}

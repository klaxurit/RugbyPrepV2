/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __clearBlockTimerPersistStore,
  useBlockTimer,
} from '../useBlockTimer'

const emomFormat = {
  type: 'emom' as const,
  rounds: 8,
  intervalSeconds: 60,
  totalSeconds: 480,
}

describe('useBlockTimer persistKey', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    __clearBlockTimerPersistStore()
  })

  afterEach(() => {
    vi.useRealTimers()
    __clearBlockTimerPersistStore()
  })

  it('reprend le temps écoulé après un remount (simule retour app)', () => {
    const key = 'emom-block-3'
    const first = renderHook(() =>
      useBlockTimer({ format: emomFormat, persistKey: key }),
    )

    act(() => {
      first.result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(95_000) // ~1 min 35
    })

    expect(first.result.current.snapshot.elapsedSec).toBeGreaterThanOrEqual(90)
    expect(first.result.current.snapshot.currentMinute).toBe(1)

    first.unmount()

    const second = renderHook(() =>
      useBlockTimer({ format: emomFormat, persistKey: key }),
    )

    expect(second.result.current.snapshot.status).toBe('running')
    expect(second.result.current.snapshot.elapsedSec).toBeGreaterThanOrEqual(90)
    expect(second.result.current.snapshot.currentMinute).toBe(1)

    act(() => {
      second.result.current.start() // no-op si déjà running
    })
    expect(second.result.current.snapshot.elapsedSec).toBeGreaterThanOrEqual(90)

    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(second.result.current.snapshot.elapsedSec).toBeGreaterThanOrEqual(120)

    second.unmount()
  })

  it('stop() efface la persistance', () => {
    const key = 'emom-block-9'
    const first = renderHook(() =>
      useBlockTimer({ format: emomFormat, persistKey: key }),
    )
    act(() => {
      first.result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    act(() => {
      first.result.current.stop()
    })
    first.unmount()

    const second = renderHook(() =>
      useBlockTimer({ format: emomFormat, persistKey: key }),
    )
    expect(second.result.current.snapshot.status).toBe('idle')
    expect(second.result.current.snapshot.elapsedSec).toBe(0)
    second.unmount()
  })

  it('EMOM à 8/8 → remaining 0 + emomFinished (pas 1:00)', () => {
    const { result } = renderHook(() =>
      useBlockTimer({ format: emomFormat, persistKey: 'emom-end' }),
    )
    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(480_000)
    })
    expect(result.current.snapshot.emomFinished).toBe(true)
    expect(result.current.snapshot.remainingInIntervalSec).toBe(0)
    expect(result.current.snapshot.currentMinute).toBe(7)
    expect(result.current.snapshot.elapsedSec).toBe(480)
  })

  it('skip minute par minute jusqu’à la fin → finished', () => {
    const { result } = renderHook(() =>
      useBlockTimer({ format: emomFormat, persistKey: 'emom-skip-end' }),
    )
    act(() => {
      result.current.start()
    })
    for (let i = 0; i < 8; i++) {
      act(() => {
        result.current.skipInterval()
      })
    }
    expect(result.current.snapshot.emomFinished).toBe(true)
    expect(result.current.snapshot.elapsedSec).toBe(480)
    expect(result.current.snapshot.remainingInIntervalSec).toBe(0)
  })

  it('rechargement après fin naturelle → toujours finished (pas idle Minute 1)', () => {
    const key = 'emom-reload-finished'
    const first = renderHook(() => useBlockTimer({ format: emomFormat, persistKey: key }))
    act(() => {
      first.result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(480_000)
    })
    expect(first.result.current.snapshot.emomFinished).toBe(true)
    first.unmount()

    const second = renderHook(() => useBlockTimer({ format: emomFormat, persistKey: key }))
    expect(second.result.current.snapshot.status).toBe('completed')
    expect(second.result.current.snapshot.emomFinished).toBe(true)
    expect(second.result.current.snapshot.remainingInIntervalSec).toBe(0)
    expect(second.result.current.snapshot.currentMinute).toBe(7)
    second.unmount()
  })

  it('reprise après visibilitychange recalcule sur horodatage', () => {
    const key = 'emom-bg'
    const { result } = renderHook(() =>
      useBlockTimer({ format: emomFormat, persistKey: key }),
    )
    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    const beforeBg = result.current.snapshot.elapsedSec
    expect(beforeBg).toBeGreaterThanOrEqual(30)

    act(() => {
      // Wall clock + visibility : recalcul horodatage (pas un compteur de ticks).
      vi.advanceTimersByTime(90_000)
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    const afterBg = result.current.snapshot.elapsedSec
    expect(afterBg).toBeGreaterThanOrEqual(beforeBg + 85)
    expect(result.current.snapshot.currentMinute).toBe(Math.floor(afterBg / 60))
  })
})

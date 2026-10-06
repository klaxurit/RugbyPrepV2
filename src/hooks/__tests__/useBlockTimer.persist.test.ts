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
})

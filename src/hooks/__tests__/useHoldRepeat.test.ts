/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { PointerEvent } from 'react'
import { useHoldRepeat } from '../useHoldRepeat'

describe('useHoldRepeat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('appelle onStep immédiatement puis en repeat, stoppe au pointerUp', () => {
    const onStep = vi.fn()
    const { result } = renderHook(() =>
      useHoldRepeat({
        onStep,
        delayMs: 300,
        intervalMs: 100,
        fastIntervalMs: 40,
        accelerateAfterMs: 500,
      }),
    )

    const btn = document.createElement('button')
    const event = {
      preventDefault: vi.fn(),
      pointerId: 1,
      currentTarget: Object.assign(btn, {
        setPointerCapture: vi.fn(),
      }),
    } as unknown as PointerEvent<HTMLButtonElement>

    act(() => {
      result.current.onPointerDown(event)
    })
    expect(onStep).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(300)
      vi.advanceTimersByTime(250)
    })
    expect(onStep.mock.calls.length).toBeGreaterThan(2)

    const mid = onStep.mock.calls.length
    act(() => {
      vi.advanceTimersByTime(500)
      vi.advanceTimersByTime(200)
    })
    expect(onStep.mock.calls.length).toBeGreaterThan(mid)

    act(() => {
      result.current.onPointerUp()
    })
    const afterStop = onStep.mock.calls.length
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(onStep).toHaveBeenCalledTimes(afterStop)
  })
})

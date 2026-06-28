// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRestTimerEndEffects } from '../useRestTimerEndEffects'

vi.mock('../useRestBeepPref', () => ({
  useRestBeepPref: () => ({ enabled: true }),
}))

vi.mock('../../utils/audioBeep', () => ({
  playRestEndBeep: vi.fn(),
}))

vi.mock('../../utils/vibrate', () => ({
  vibrate: vi.fn(),
}))

describe('useRestTimerEndEffects', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('bip et skip au premier plan quand le timer expire', async () => {
    const skip = vi.fn()
    const endsAt = Date.now() + 1000

    renderHook(() =>
      useRestTimerEndEffects(
        { totalSeconds: 1, endsAt, label: 'Test' },
        skip,
      ),
    )

    await act(async () => {
      vi.advanceTimersByTime(1800)
    })

    expect(skip).toHaveBeenCalled()
  })

  it('au retour après expiration en arrière-plan, skip sans bip tardif', async () => {
    const skip = vi.fn()
    const endsAt = Date.now() + 500

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })

    renderHook(() =>
      useRestTimerEndEffects(
        { totalSeconds: 1, endsAt, label: 'Test' },
        skip,
      ),
    )

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(skip).not.toHaveBeenCalled()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(skip).toHaveBeenCalled()
  })
})

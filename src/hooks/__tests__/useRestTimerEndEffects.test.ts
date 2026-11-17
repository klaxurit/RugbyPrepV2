// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRestTimerEndEffects } from '../useRestTimerEndEffects'
import { playCountdownBeep, playRestEndWhistle } from '../../utils/audioBeep'

vi.mock('../useRestBeepPref', () => ({
  useRestBeepPref: () => ({ enabled: true }),
}))

vi.mock('../../utils/audioBeep', () => ({
  playCountdownBeep: vi.fn(),
  playRestEndWhistle: vi.fn(),
  playRestEndBeep: vi.fn(),
}))

vi.mock('../../utils/vibrate', () => ({
  vibrate: vi.fn(),
}))

describe('useRestTimerEndEffects', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
    vi.mocked(playCountdownBeep).mockClear()
    vi.mocked(playRestEndWhistle).mockClear()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('3 bips countdown puis sifflet + skip au premier plan', async () => {
    const skip = vi.fn()
    const endsAt = Date.now() + 5000

    renderHook(() =>
      useRestTimerEndEffects(
        { totalSeconds: 5, endsAt, label: 'Test' },
        skip,
      ),
    )

    await act(async () => {
      vi.advanceTimersByTime(1999)
    })
    expect(playCountdownBeep).toHaveBeenCalledTimes(0)

    await act(async () => {
      vi.advanceTimersByTime(1) // T−3
    })
    expect(playCountdownBeep).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(1000) // T−2
    })
    expect(playCountdownBeep).toHaveBeenCalledTimes(2)

    await act(async () => {
      vi.advanceTimersByTime(1000) // T−1
    })
    expect(playCountdownBeep).toHaveBeenCalledTimes(3)

    await act(async () => {
      vi.advanceTimersByTime(1000) // endsAt → sifflet
    })
    expect(playCountdownBeep).toHaveBeenCalledTimes(3)
    expect(playRestEndWhistle).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(800)
    })
    expect(skip).toHaveBeenCalled()
  })

  it('repos court : uniquement les bips restants + sifflet', async () => {
    const skip = vi.fn()
    const endsAt = Date.now() + 1500

    renderHook(() =>
      useRestTimerEndEffects(
        { totalSeconds: 2, endsAt, label: 'Test' },
        skip,
      ),
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(playCountdownBeep).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(playCountdownBeep).toHaveBeenCalledTimes(1)
    expect(playRestEndWhistle).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(800)
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
    expect(playRestEndWhistle).not.toHaveBeenCalled()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(skip).toHaveBeenCalled()
    expect(playRestEndWhistle).not.toHaveBeenCalled()
  })
})

// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSchedulingTransition, type TransitionStorage } from '../useSchedulingTransition'

// ── Helpers ─────────────────────────────────────────────────────────

function createMockStorage(): TransitionStorage & { data: Record<string, string> } {
  const data: Record<string, string> = {}
  return {
    data,
    getItem(key: string) { return data[key] ?? null },
    setItem(key: string, value: string) { data[key] = value },
  }
}


const TODAY = '2026-04-06'

// ── Tests ───────────────────────────────────────────────────────────

describe('useSchedulingTransition', () => {
  // ── First load — no false transition ──

  it('no transition on first load with no baseline (calendar)', () => {
    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'calendar',
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )

    expect(result.current.transition).toBeNull()
    // Baseline initialized
    expect(storage.data['rugbyprep.schedulingMode.baseline.user-a']).toBe('calendar')
  })

  it('no transition on first load with no baseline (sequential)', () => {
    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'sequential',
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )

    expect(result.current.transition).toBeNull()
    expect(storage.data['rugbyprep.schedulingMode.baseline.user-a']).toBe('sequential')
  })

  // ── Mode transitions ──

  it('sequential → calendar emits calendar_mode_activated', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.schedulingMode.baseline.user-a'] = 'sequential'

    const { result } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'calendar',
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )

    expect(result.current.transition).not.toBeNull()
    expect(result.current.transition?.type).toBe('calendar_mode_activated')
    expect(result.current.transition?.message).toContain('calendrier')
    expect(result.current.transition?.cta).toBe('OK')
  })

  it('calendar → sequential emits block_mode_activated', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.schedulingMode.baseline.user-a'] = 'calendar'

    const { result } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'sequential',
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )

    expect(result.current.transition).not.toBeNull()
    expect(result.current.transition?.type).toBe('block_mode_activated')
    expect(result.current.transition?.message).toContain('progression')
    expect(result.current.transition?.cta).toBe('OK')
  })

  it('same mode (calendar → calendar) emits nothing', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.schedulingMode.baseline.user-a'] = 'calendar'

    const { result } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'calendar',
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )

    expect(result.current.transition).toBeNull()
  })

  it('same mode (sequential → sequential) emits nothing', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.schedulingMode.baseline.user-a'] = 'sequential'

    const { result } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'sequential',
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )

    expect(result.current.transition).toBeNull()
  })

  // ── Return after break — retiré (doublon Score de forme) ──

  it('long absence sans changement de mode → pas de bannière scheduling', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.schedulingMode.baseline.user-a'] = 'calendar'

    const { result } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'calendar',
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )

    expect(result.current.transition).toBeNull()
  })

  it('mode transition when mode changes despite long absence', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.schedulingMode.baseline.user-a'] = 'sequential'

    const { result } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'calendar',
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )

    // Mode transition emitted
    expect(result.current.transition?.type).toBe('calendar_mode_activated')
  })

  // ── Dismiss behavior ──

  it('dismiss hides the transition for 7 days', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.schedulingMode.baseline.user-a'] = 'sequential'

    const { result, rerender } = renderHook(
      ({ mode }) =>
        useSchedulingTransition({
          schedulingMode: mode,
          today: TODAY,
          userId: 'user-a',
          storage,
        }),
      { initialProps: { mode: 'calendar' as const } },
    )

    expect(result.current.transition?.type).toBe('calendar_mode_activated')

    // Dismiss
    result.current.dismiss('calendar_mode_activated')

    // Re-render — should be suppressed
    // Reset baseline to trigger again on next rerender
    storage.data['rugbyprep.schedulingMode.baseline.user-a'] = 'sequential'
    rerender({ mode: 'calendar' as const })

    expect(result.current.transition).toBeNull()
  })


  // ── Null schedulingMode ──

  it('returns null when schedulingMode is null', () => {
    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: null,
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )

    expect(result.current.transition).toBeNull()
  })

  // ── Anon user ──

  it('uses anon baseline when no userId', () => {
    const storage = createMockStorage()

    renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'calendar',
        today: TODAY,
        storage,
      }),
    )

    expect(storage.data['rugbyprep.schedulingMode.baseline.anon']).toBe('calendar')
  })

  // ── User-scoped dismiss isolation ──

  it('dismiss for user A does not suppress user B', () => {
    const storage = createMockStorage()
    // Both users have sequential baseline
    storage.data['rugbyprep.schedulingMode.baseline.user-a'] = 'sequential'
    storage.data['rugbyprep.schedulingMode.baseline.user-b'] = 'sequential'

    // User A sees and dismisses calendar_mode_activated
    const { result: rA } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'calendar',
        today: TODAY,
        userId: 'user-a',
        storage,
      }),
    )
    expect(rA.current.transition?.type).toBe('calendar_mode_activated')
    rA.current.dismiss('calendar_mode_activated')

    // User B should still see the transition
    // Reset baseline for user-b since useEffect already wrote 'calendar'
    storage.data['rugbyprep.schedulingMode.baseline.user-b'] = 'sequential'
    const { result: rB } = renderHook(() =>
      useSchedulingTransition({
        schedulingMode: 'calendar',
        today: TODAY,
        userId: 'user-b',
        storage,
      }),
    )
    expect(rB.current.transition?.type).toBe('calendar_mode_activated')
  })
})

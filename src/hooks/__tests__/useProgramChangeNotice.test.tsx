// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useProgramChangeNotice } from '../useProgramChangeNotice'
import type { UserProfile } from '../../types/training'

// In-season override is enough to keep cycle stable; ACWR critical drives the notice.
const profile: UserProfile = {
  weeklySessions: 3,
  position: 'pillar',
  planningAnchors: { manualCycleOverride: 'in_season' },
} as unknown as UserProfile

beforeEach(() => {
  window.localStorage.clear()
})

describe('useProgramChangeNotice', () => {
  it('surfaces a critical notice the first time', () => {
    const { result } = renderHook(() =>
      useProgramChangeNotice({
        profile,
        calendarEvents: [],
        acwrZone: 'critical',
        today: '2026-04-15',
      }),
    )
    expect(result.current.notice).not.toBeNull()
    expect(result.current.notice?.type).toBe('acwr')
    expect(result.current.notice?.severity).toBe('critical')
    expect(result.current.notice?.canPostponeNow).toBe(false) // ACWR is not postponable
  })

  it('hides the notice once acknowledged and persists across re-renders', () => {
    const { result, rerender } = renderHook(
      (today: string) =>
        useProgramChangeNotice({
          profile,
          calendarEvents: [],
          acwrZone: 'critical',
          today,
        }),
      { initialProps: '2026-04-15' },
    )
    expect(result.current.notice).not.toBeNull()

    act(() => result.current.acknowledge())
    expect(result.current.notice).toBeNull()

    // Re-render with a later date — same notice id, still acknowledged.
    rerender('2026-04-16')
    expect(result.current.notice).toBeNull()
  })

  it('postpone suppresses the notice for 7 days', () => {
    // Use a postponable type: simulate an off→pre cycle change.
    const cycleProfile: UserProfile = {
      ...profile,
      planningAnchors: {
        offSeasonStartAt: '2026-02-23',
        firstMatchDateOverride: '2026-07-27',
      },
    } as UserProfile

    const { result, rerender } = renderHook(
      (today: string) =>
        useProgramChangeNotice({
          profile: cycleProfile,
          calendarEvents: [],
          acwrZone: null,
          today,
        }),
      { initialProps: '2026-05-03' },
    )
    expect(result.current.notice?.type).toBe('cycle')
    expect(result.current.notice?.canPostponeNow).toBe(true)

    act(() => result.current.postpone())
    expect(result.current.notice).toBeNull()

    // Same day: still hidden.
    rerender('2026-05-03')
    expect(result.current.notice).toBeNull()
  })

  it('after postpone expiry (>= 7 days) re-surfaces a still-pending notice with no postpone button', () => {
    // Seed localStorage with an explicit postpone entry for a stable ACWR id, then
    // check that the hook honors the 7-day window and flips canPostponeNow off
    // once it expires. Uses ACWR weekly id so we can reason about stability.
    // (ACWR is not postponable in the detector; we exercise the elapsed-check
    // path by swapping in a postponable notice for the year-scoped cycle id.)
    const cycleProfile: UserProfile = {
      ...profile,
      planningAnchors: {
        offSeasonStartAt: '2026-02-23',
        firstMatchDateOverride: '2026-07-27',
      },
    } as UserProfile

    // Manually seed a postpone entry dated 8 days before today.
    window.localStorage.setItem(
      'rf.programNotice.v1',
      JSON.stringify({
        acknowledged: {},
        postponed: { 'cycle:off_season_to_pre_season:2026': '2026-04-25' },
      }),
    )

    const { result } = renderHook(() =>
      useProgramChangeNotice({
        profile: cycleProfile,
        calendarEvents: [],
        acwrZone: null,
        today: '2026-05-03',
      }),
    )
    expect(result.current.notice).not.toBeNull()
    expect(result.current.notice?.canPostponeNow).toBe(false)
  })

  it('returns null when profile is null (logged out)', () => {
    const { result } = renderHook(() =>
      useProgramChangeNotice({
        profile: null,
        calendarEvents: [],
        acwrZone: 'critical',
        today: '2026-04-15',
      }),
    )
    expect(result.current.notice).toBeNull()
  })
})

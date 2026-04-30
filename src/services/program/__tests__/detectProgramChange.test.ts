import { describe, it, expect } from 'vitest'
import { detectProgramChange } from '../detectProgramChange'
import type { CalendarEvent } from '../../../types/training'

const baseInputs = {
  weeklyFrequency: 3 as const,
  positionGroup: 'back_three' as const,
  acwrZone: null,
  calendarEvents: [] as CalendarEvent[],
}

describe('detectProgramChange', () => {
  it('returns null when nothing changes between today and next Monday', () => {
    // Fully in-season, mid-block — no transition pending.
    const today = '2026-04-15' // Wednesday, mid-week
    const result = detectProgramChange({
      ...baseInputs,
      today,
      planningAnchors: {
        manualCycleOverride: 'in_season',
      },
      calendarEvents: [],
    })
    expect(result).toBeNull()
  })

  it('emits a cycle notice when off_season → pre_season transitions next Monday', () => {
    // off-season ending, pre-season starting (firstMatch in 8 weeks → pre-season window)
    const today = '2026-05-03' // Sunday — next Monday is 2026-05-04
    const result = detectProgramChange({
      ...baseInputs,
      today,
      planningAnchors: {
        // Force a manual cycle override so we can flip cycles by date.
        offSeasonStartAt: '2026-02-23',
        firstMatchDateOverride: '2026-07-27', // 12 weeks after 2026-05-04 → starts pre-season Monday
      },
    })
    expect(result).not.toBeNull()
    if (!result) return
    expect(result.type).toBe('cycle')
    expect(result.severity).toBe('warning')
    expect(result.postponable).toBe(true)
    expect(result.id).toContain('cycle:off_season_to_pre_season')
    expect(result.title.toLowerCase()).toContain('pré-saison')
  })

  it('emits a critical ACWR notice and prefers it over phase changes', () => {
    const today = '2026-04-15'
    const result = detectProgramChange({
      ...baseInputs,
      today,
      acwrZone: 'critical',
      planningAnchors: { manualCycleOverride: 'in_season' },
    })
    expect(result).not.toBeNull()
    if (!result) return
    expect(result.type).toBe('acwr')
    expect(result.severity).toBe('critical')
    expect(result.postponable).toBe(false)
  })

  it('emits a danger ACWR notice (warning, not postponable)', () => {
    const today = '2026-04-15'
    const result = detectProgramChange({
      ...baseInputs,
      today,
      acwrZone: 'danger',
      planningAnchors: { manualCycleOverride: 'in_season' },
    })
    expect(result?.type).toBe('acwr')
    expect(result?.severity).toBe('warning')
    expect(result?.postponable).toBe(false)
    expect(result?.id).toContain('acwr:danger')
  })

  it('emits a match-week notice when a match falls in the next 7 days', () => {
    const today = '2026-04-15' // Wednesday
    const matchDate = '2026-04-19' // Sunday — within 7 days
    const result = detectProgramChange({
      ...baseInputs,
      today,
      planningAnchors: { manualCycleOverride: 'in_season' },
      calendarEvents: [
        { id: 'm1', date: matchDate, type: 'match', source: 'manual' } as CalendarEvent,
      ],
    })
    // ACWR null + cycle stable, only the match notice should remain.
    expect(result?.type).toBe('match')
    expect(result?.id).toBe(`match:${matchDate}`)
  })

  it('returns null when planning context cannot be resolved (missing anchors)', () => {
    const today = '2026-04-15'
    const result = detectProgramChange({
      ...baseInputs,
      today,
      // No anchors, no calendar events → detector throws and we return null.
      calendarEvents: [],
    })
    expect(result).toBeNull()
  })

  it('uses stable notice ids based on (from, to, effective Monday)', () => {
    const result = detectProgramChange({
      ...baseInputs,
      today: '2026-05-03',
      acwrZone: 'critical',
      planningAnchors: { manualCycleOverride: 'in_season' },
    })
    expect(result?.id).toMatch(/^acwr:critical:\d{4}-\d{2}-\d{2}$/)
    // ISO-week key snaps to Monday: 2026-05-03 (Sunday) → 2026-04-27 (Monday)
    expect(result?.id).toBe('acwr:critical:2026-04-27')
  })
})

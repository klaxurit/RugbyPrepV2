import { describe, it, expect } from 'vitest'
import { mapSlotsToScheduleDays, type DayPreference } from '../mapSlotsToScheduleDays'
import type { SCSchedule, DayOfWeek } from '../../../types/training'

function slot(dayPreference?: DayPreference) {
  return { dayPreference }
}

function sc(...days: number[]): SCSchedule {
  return {
    sessions: days.map((d, i) => ({ sessionIndex: (i % 3) as 0 | 1 | 2, day: d as DayOfWeek })),
  }
}

describe('mapSlotsToScheduleDays', () => {
  it('2x with scSchedule → correct days', () => {
    const result = mapSlotsToScheduleDays(
      [slot('early_week'), slot('late_week')],
      sc(2, 4),
    )
    expect(result).toEqual([
      { label: 'Mar', dayNumber: 2 },
      { label: 'Jeu', dayNumber: 4 },
    ])
  })

  it('3x with scSchedule + mid_week → 3 correct days', () => {
    const result = mapSlotsToScheduleDays(
      [slot('early_week'), slot('mid_week'), slot('late_week')],
      sc(1, 3, 5),
    )
    expect(result).toEqual([
      { label: 'Lun', dayNumber: 1 },
      { label: 'Mer', dayNumber: 3 },
      { label: 'Ven', dayNumber: 5 },
    ])
  })

  it('pre_match with matchDay → correct day before match', () => {
    const result = mapSlotsToScheduleDays(
      [slot('early_week'), slot('mid_week'), slot('pre_match')],
      sc(1, 3, 5),
      6, // matchDay = Saturday
    )
    expect(result[2]).toEqual({ label: 'Ven', dayNumber: 5 })
  })

  it('fallback sans scSchedule → defaults', () => {
    const result = mapSlotsToScheduleDays(
      [slot('early_week'), slot('late_week')],
    )
    expect(result).toEqual([
      { label: 'Mar', dayNumber: 2 },
      { label: 'Jeu', dayNumber: 4 },
    ])
  })

  it('pre_match without day before match → fallback last day', () => {
    // matchDay = 0 (Sunday), all SC days are after
    const result = mapSlotsToScheduleDays(
      [slot('early_week'), slot('pre_match')],
      sc(2, 4),
      0, // matchDay = Sunday (no days before)
    )
    // No days < 0, so fallback to last available day (4)
    expect(result[1]).toEqual({ label: 'Jeu', dayNumber: 4 })
  })

  it('slots without dayPreference → positional assignment', () => {
    const result = mapSlotsToScheduleDays(
      [slot(), slot()],
      sc(3, 5),
    )
    expect(result).toEqual([
      { label: 'Mer', dayNumber: 3 },
      { label: 'Ven', dayNumber: 5 },
    ])
  })

  it('slots < scSchedule sessions → takes subset early→late', () => {
    const result = mapSlotsToScheduleDays(
      [slot('early_week'), slot('late_week')],
      sc(1, 3, 5), // 3 SC days but only 2 slots
    )
    // Uses first 2 days: [1, 3]
    expect(result).toEqual([
      { label: 'Lun', dayNumber: 1 },
      { label: 'Mer', dayNumber: 3 },
    ])
  })

  it('1 slot without scSchedule → fallback to [1]', () => {
    const result = mapSlotsToScheduleDays([slot('early_week')])
    expect(result).toEqual([{ label: 'Lun', dayNumber: 1 }])
  })

  it('empty slots → empty result', () => {
    expect(mapSlotsToScheduleDays([])).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { computeSCSchedule } from './scheduleOptimizer'

describe('scheduleOptimizer edge contracts', () => {
  it('EC-11: ignores malformed upcoming match dates without crashing', () => {
    const schedule = computeSCSchedule(
      {
        clubDays: [{ day: 2 }, { day: 4 }],
        matchDay: 6,
      },
      3,
      ['not-a-date', '2026-03-15']
    )

    expect(schedule.sessions).toHaveLength(3)
    expect(schedule.sessions.every((slot) => Number.isInteger(slot.day))).toBe(true)
  })

  it('EC-12: always returns required session count for supported frequencies', () => {
    const weeklyOptions: Array<2 | 3> = [2, 3]
    const matchOptions: Array<number | undefined> = [undefined, 0, 1, 2, 3, 4, 5, 6]

    for (const weeklySessions of weeklyOptions) {
      for (const matchDay of matchOptions) {
        const schedule = computeSCSchedule(
          {
            clubDays: [{ day: 1 }, { day: 3 }, { day: 5 }],
            matchDay: matchDay as 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined,
          },
          weeklySessions
        )

        expect(schedule.sessions).toHaveLength(weeklySessions)
        expect(new Set(schedule.sessions.map((slot) => slot.day)).size).toBe(weeklySessions)
      }
    }
  })
})


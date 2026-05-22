import { describe, expect, it } from 'vitest'
import { computeSCSchedule, getDayInfo, primerSlotDay } from './scheduleOptimizer'

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

    // Ne crashe pas et retourne des jours valides (entiers 0-6).
    expect(schedule.sessions.length).toBeGreaterThan(0)
    expect(schedule.sessions.every((slot) => Number.isInteger(slot.day))).toBe(true)
    expect(schedule.sessions.every((slot) => slot.day >= 0 && slot.day <= 6)).toBe(true)
  })

  it('EC-12: never places a session on match day or the day after (MD+1)', () => {
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

        // Jamais plus que la fréquence demandée, toujours des jours distincts.
        expect(schedule.sessions.length).toBeLessThanOrEqual(weeklySessions)
        expect(new Set(schedule.sessions.map((slot) => slot.day)).size).toBe(schedule.sessions.length)

        // Aucune séance sur le jour de match, ni sur MD+1 (récupération obligatoire).
        if (matchDay !== undefined) {
          const mdPlus1 = (matchDay + 1) % 7
          for (const slot of schedule.sessions) {
            expect(slot.day).not.toBe(matchDay)
            expect(slot.day).not.toBe(mdPlus1)
          }
        }
      }
    }
  })

  it('3×/sem + match dimanche → Mar, Jeu, Sam (veille = activation)', () => {
    const schedule = computeSCSchedule(
      {
        clubDays: [{ day: 3 }, { day: 5 }],
        matchDay: 0,
      },
      3,
    )
    const days = schedule.sessions.map((s) => s.day).sort((a, b) => a - b)
    expect(days).toContain(6) // samedi = MD-1
    expect(days).not.toContain(0) // pas dimanche match
    expect(days).not.toContain(1) // pas lundi MD+1
    expect(days.length).toBe(3)
  })

  it('veille de match = primer_slot (pas alerte near_match)', () => {
    const club = { clubDays: [{ day: 3 as const }], matchDay: 0 as const }
    expect(primerSlotDay(0)).toBe(6)
    expect(getDayInfo(6, club).risk).toBe('primer_slot')
    expect(getDayInfo(6, club).reason).toBeNull()
  })

  it('EC-13: match Sat usual Sunday (match moved) → jamais de séance le dimanche', () => {
    const schedule = computeSCSchedule(
      {
        clubDays: [{ day: 3 }, { day: 5 }], // Mer + Ven
        matchDay: 0, // match habituel dimanche
      },
      3,
      ['2026-04-25'], // Samedi exceptionnel
    )

    // matchDay=0 → MD+1=1 (Mon) bloqué.
    // upcoming Sat=6 → MD+1=0 (Sun) bloqué.
    // Eligible: Tue, Wed, Thu, Fri (4 jours). Peut en sélectionner 2 ou 3 selon gap.
    for (const slot of schedule.sessions) {
      expect(slot.day).not.toBe(0) // pas de Dimanche
      expect(slot.day).not.toBe(1) // pas de Lundi (MD+1 du match habituel)
      expect(slot.day).not.toBe(6) // pas de Samedi (match exceptionnel)
    }
  })
})

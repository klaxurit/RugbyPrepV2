import { describe, expect, it } from 'vitest'
import {
  daysUntilNextWeekStart,
  isInWeek,
  previousWeekStartISO,
  weekEndISO,
  weekStartISO,
} from '../weekStart'

// Lundi 2026-09-14 → dimanche 2026-09-20.
const MONDAY = '2026-09-14'
const SUNDAY = '2026-09-20'

describe('weekStartISO', () => {
  it('renvoie le lundi pour chaque jour de la semaine', () => {
    for (const day of [
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ]) {
      expect(weekStartISO(day)).toBe(MONDAY)
    }
  })

  it('rattache le dimanche à la semaine qui vient de finir, pas à la suivante', () => {
    expect(weekStartISO(SUNDAY)).toBe(MONDAY)
  })

  it('accepte un horodatage complet', () => {
    expect(weekStartISO('2026-09-16T22:45:00.000Z')).toBe(MONDAY)
  })

  it('est idempotent', () => {
    expect(weekStartISO(weekStartISO('2026-09-18'))).toBe(MONDAY)
  })
})

describe('weekEndISO', () => {
  it('renvoie le dimanche de la semaine', () => {
    expect(weekEndISO('2026-09-16')).toBe(SUNDAY)
  })
})

describe('previousWeekStartISO', () => {
  it('recule d’une semaine pleine', () => {
    expect(previousWeekStartISO('2026-09-16')).toBe('2026-09-07')
  })

  it('traverse un changement de mois', () => {
    expect(previousWeekStartISO('2026-09-02')).toBe('2026-08-24')
  })
})

describe('daysUntilNextWeekStart', () => {
  it('compte 7 jours le lundi (semaine pleine devant soi)', () => {
    expect(daysUntilNextWeekStart(MONDAY)).toBe(7)
  })

  it('compte 1 jour le dimanche (reset demain)', () => {
    expect(daysUntilNextWeekStart(SUNDAY)).toBe(1)
  })

  it('décroît au fil de la semaine', () => {
    expect(daysUntilNextWeekStart('2026-09-16')).toBe(5)
    expect(daysUntilNextWeekStart('2026-09-19')).toBe(2)
  })
})

describe('isInWeek', () => {
  it('reconnaît les bornes incluses', () => {
    expect(isInWeek(MONDAY, MONDAY)).toBe(true)
    expect(isInWeek(SUNDAY, MONDAY)).toBe(true)
  })

  it('exclut les jours adjacents', () => {
    expect(isInWeek('2026-09-13', MONDAY)).toBe(false)
    expect(isInWeek('2026-09-21', MONDAY)).toBe(false)
  })
})

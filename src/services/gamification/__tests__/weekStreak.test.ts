import { describe, expect, it } from 'vitest'
import {
  FREEZE_MIN_STREAK,
  isFreezeAvailable,
  priorStreakForWeek,
  resolveWeekStreak,
} from '../weekStreak'

describe('resolveWeekStreak', () => {
  it('incrémente le streak quand le plan est tenu', () => {
    const next = resolveWeekStreak({
      weekStartISO: '2026-09-14',
      planFullyRespected: true,
      currentWeekStreak: 3,
      longestWeekStreak: 5,
      freezeUsedAt: null,
    })
    expect(next.currentWeekStreak).toBe(4)
    expect(next.freezeConsumed).toBe(false)
  })

  it('met à jour le record quand il est dépassé', () => {
    const next = resolveWeekStreak({
      weekStartISO: '2026-09-14',
      planFullyRespected: true,
      currentWeekStreak: 5,
      longestWeekStreak: 5,
      freezeUsedAt: null,
    })
    expect(next.longestWeekStreak).toBe(6)
  })

  it('préserve le streak via la tolérance sur une semaine ratée', () => {
    const next = resolveWeekStreak({
      weekStartISO: '2026-09-14',
      planFullyRespected: false,
      currentWeekStreak: 4,
      longestWeekStreak: 4,
      freezeUsedAt: null,
    })
    expect(next.currentWeekStreak).toBe(4)
    expect(next.freezeConsumed).toBe(true)
    expect(next.freezeUsedAt).toBe('2026-09-14')
  })

  it('casse le streak si la tolérance vient d’être utilisée', () => {
    const next = resolveWeekStreak({
      weekStartISO: '2026-09-14',
      planFullyRespected: false,
      currentWeekStreak: 4,
      longestWeekStreak: 6,
      freezeUsedAt: '2026-09-07',
    })
    expect(next.currentWeekStreak).toBe(0)
    expect(next.freezeConsumed).toBe(false)
    expect(next.longestWeekStreak).toBe(6)
  })

  it('n’applique pas la tolérance sous le streak minimal', () => {
    const next = resolveWeekStreak({
      weekStartISO: '2026-09-14',
      planFullyRespected: false,
      currentWeekStreak: FREEZE_MIN_STREAK - 1,
      longestWeekStreak: 3,
      freezeUsedAt: null,
    })
    expect(next.currentWeekStreak).toBe(0)
  })

  it('ne fait jamais baisser le record', () => {
    const next = resolveWeekStreak({
      weekStartISO: '2026-09-14',
      planFullyRespected: false,
      currentWeekStreak: 1,
      longestWeekStreak: 12,
      freezeUsedAt: null,
    })
    expect(next.longestWeekStreak).toBe(12)
  })
})

describe('isFreezeAvailable', () => {
  it('est disponible quand jamais utilisée', () => {
    expect(isFreezeAvailable(null, '2026-09-14')).toBe(true)
  })

  it('reste indisponible pendant la régénération', () => {
    expect(isFreezeAvailable('2026-08-31', '2026-09-14')).toBe(false)
  })

  it('redevient disponible après la régénération', () => {
    expect(isFreezeAvailable('2026-07-13', '2026-09-14')).toBe(true)
  })
})

describe('priorStreakForWeek', () => {
  it('reprend le streak de la semaine précédente', () => {
    expect(priorStreakForWeek(3, '2026-09-07', '2026-09-14')).toBe(3)
  })

  it('ne recompte pas la semaine en cours lors d’un recalcul', () => {
    // Sans ce retrait, chaque recalcul de la semaine courante gonflerait le
    // bonus de régularité d'un cran.
    expect(priorStreakForWeek(3, '2026-09-14', '2026-09-14')).toBe(2)
  })

  it('considère le streak rompu après un trou de clôture', () => {
    expect(priorStreakForWeek(6, '2026-08-24', '2026-09-14')).toBe(0)
  })

  it('accepte une absence de semaine de référence', () => {
    expect(priorStreakForWeek(2, null, '2026-09-14')).toBe(2)
  })
})

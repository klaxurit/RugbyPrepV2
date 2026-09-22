import { describe, expect, it } from 'vitest'
import { computeWeeklyScore, type WeeklyScoreInput } from '../computeWeeklyScore'
import { SCORE_CAPS, SCORE_POINTS } from '../scoreConstants'

const BASE: WeeklyScoreInput = {
  weekStartISO: '2026-09-14',
  sessionsPlanned: 3,
  plannedSessionsCompleted: 3,
  offPlanSessionsCompleted: 0,
  prescribedRestRespected: 0,
  isDeloadWeek: false,
  referenceSessionCount: 3,
  allCompletedHaveLoadData: true,
  priorWeekStreak: 0,
  acwrZone: 'optimal',
}

function score(overrides: Partial<WeeklyScoreInput> = {}) {
  return computeWeeklyScore({ ...BASE, ...overrides })
}

describe('computeWeeklyScore — conformité au plan', () => {
  it('crédite les séances prévues complétées', () => {
    const result = score({ plannedSessionsCompleted: 2, sessionsPlanned: 3 })
    expect(result.breakdown.plannedSessions).toBe(2 * SCORE_POINTS.PLANNED_SESSION)
  })

  it('ne crédite pas plus de séances que le plan n’en prévoit', () => {
    const result = score({ sessionsPlanned: 2, plannedSessionsCompleted: 5 })
    expect(result.breakdown.plannedSessions).toBe(2 * SCORE_POINTS.PLANNED_SESSION)
    expect(result.sessionsPlanned).toBe(2)
  })

  it('donne le bonus plan tenu seulement si tout le plan est fait', () => {
    expect(score({ plannedSessionsCompleted: 3 }).breakdown.fullPlanBonus).toBe(
      SCORE_POINTS.FULL_PLAN_BONUS,
    )
    expect(score({ plannedSessionsCompleted: 2 }).breakdown.fullPlanBonus).toBe(0)
  })

  it('ne donne pas le bonus plan tenu quand rien n’est prévu', () => {
    const result = score({ sessionsPlanned: 0, plannedSessionsCompleted: 0 })
    expect(result.breakdown.fullPlanBonus).toBe(0)
  })

  it('plafonne le nombre de séances déclarables comme prévues', () => {
    const result = score({ sessionsPlanned: 99, plannedSessionsCompleted: 99 })
    expect(result.sessionsPlanned).toBe(SCORE_CAPS.MAX_PLANNED_SESSIONS_PER_WEEK)
  })
})

describe('computeWeeklyScore — le volume ne paie pas', () => {
  it('ne crédite qu’une seule séance hors plan par semaine', () => {
    const one = score({ offPlanSessionsCompleted: 1 })
    const five = score({ offPlanSessionsCompleted: 5 })
    expect(one.breakdown.offPlanSessions).toBe(SCORE_POINTS.OFF_PLAN_SESSION)
    expect(five.breakdown.offPlanSessions).toBe(SCORE_POINTS.OFF_PLAN_SESSION)
    expect(five.points).toBe(one.points)
  })

  it('annule les séances hors plan en zone de surcharge', () => {
    for (const zone of ['danger', 'critical'] as const) {
      const result = score({ offPlanSessionsCompleted: 3, acwrZone: zone })
      expect(result.breakdown.offPlanSessions).toBe(0)
      expect(result.acwrCapped).toBe(true)
    }
  })

  it('ne signale pas de plafonnement ACWR hors surcharge', () => {
    for (const zone of ['underload', 'optimal', 'caution', null] as const) {
      expect(score({ acwrZone: zone }).acwrCapped).toBe(false)
    }
  })

  it('empêche de gagner plus en s’entraînant davantage que son plan en surcharge', () => {
    const conforme = score({ acwrZone: 'danger', offPlanSessionsCompleted: 0 })
    const surcharge = score({ acwrZone: 'danger', offPlanSessionsCompleted: 4 })
    expect(surcharge.points).toBe(conforme.points)
  })
})

describe('computeWeeklyScore — le repos paie', () => {
  it('rend une semaine de deload respectée équivalente à une semaine de charge', () => {
    const chargeRespectee = score({
      sessionsPlanned: 3,
      plannedSessionsCompleted: 3,
      referenceSessionCount: 3,
    })
    const deloadRespecte = score({
      sessionsPlanned: 1,
      plannedSessionsCompleted: 1,
      isDeloadWeek: true,
      referenceSessionCount: 3,
    })
    expect(deloadRespecte.points).toBe(chargeRespectee.points)
    expect(deloadRespecte.deloadRespected).toBe(true)
  })

  it('ne compense pas un deload non respecté', () => {
    const result = score({
      sessionsPlanned: 2,
      plannedSessionsCompleted: 1,
      isDeloadWeek: true,
      referenceSessionCount: 3,
    })
    expect(result.breakdown.deloadCompensation).toBe(0)
    expect(result.deloadRespected).toBe(false)
  })

  it('crédite les jours de repos prescrits respectés, dans la limite du plafond', () => {
    expect(score({ prescribedRestRespected: 2 }).breakdown.prescribedRest).toBe(
      2 * SCORE_POINTS.PRESCRIBED_REST,
    )
    expect(score({ prescribedRestRespected: 6 }).breakdown.prescribedRest).toBe(
      SCORE_CAPS.PRESCRIBED_REST_PER_WEEK * SCORE_POINTS.PRESCRIBED_REST,
    )
  })
})

describe('computeWeeklyScore — régularité et qualité de log', () => {
  it('augmente le bonus de régularité avec les semaines consécutives', () => {
    const premiere = score({ priorWeekStreak: 0 }).breakdown.streakBonus
    const quatrieme = score({ priorWeekStreak: 3 }).breakdown.streakBonus
    expect(quatrieme).toBeGreaterThan(premiere)
  })

  it('plafonne le bonus de régularité', () => {
    const result = score({ priorWeekStreak: 50 })
    expect(result.breakdown.streakBonus).toBe(
      SCORE_CAPS.MAX_STREAK_WEEKS_COUNTED * SCORE_POINTS.PER_STREAK_WEEK,
    )
  })

  it('n’accorde aucun bonus de régularité si le plan n’est pas tenu', () => {
    const result = score({ plannedSessionsCompleted: 1, priorWeekStreak: 4 })
    expect(result.breakdown.streakBonus).toBe(0)
  })

  it('récompense la complétude des logs, pas la valeur du RPE', () => {
    expect(score({ allCompletedHaveLoadData: true }).breakdown.logQualityBonus).toBe(
      SCORE_POINTS.LOG_QUALITY_BONUS,
    )
    expect(score({ allCompletedHaveLoadData: false }).breakdown.logQualityBonus).toBe(0)
  })

  it('n’accorde pas le bonus de log sur une semaine sans séance', () => {
    const result = score({
      sessionsPlanned: 3,
      plannedSessionsCompleted: 0,
      allCompletedHaveLoadData: true,
    })
    expect(result.breakdown.logQualityBonus).toBe(0)
  })
})

describe('computeWeeklyScore — robustesse', () => {
  it('somme le total à partir du détail affiché', () => {
    const result = score({
      plannedSessionsCompleted: 3,
      offPlanSessionsCompleted: 1,
      prescribedRestRespected: 1,
      priorWeekStreak: 2,
    })
    const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0)
    expect(result.points).toBe(sum)
  })

  it('reste monotone en conformité', () => {
    let previous = -1
    for (let done = 0; done <= 3; done++) {
      const result = score({ plannedSessionsCompleted: done })
      expect(result.points).toBeGreaterThanOrEqual(previous)
      previous = result.points
    }
  })

  it('absorbe les entrées négatives ou non finies', () => {
    const result = score({
      sessionsPlanned: Number.NaN,
      plannedSessionsCompleted: -4,
      offPlanSessionsCompleted: -1,
      prescribedRestRespected: -3,
      priorWeekStreak: -9,
      referenceSessionCount: Number.POSITIVE_INFINITY,
    })
    expect(result.points).toBe(0)
    expect(result.sessionsCompleted).toBe(0)
  })

  it('est déterministe à entrée égale', () => {
    expect(score({ priorWeekStreak: 2 })).toEqual(score({ priorWeekStreak: 2 }))
  })
})

import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'
import type { CalendarEvent, SessionLog, UserProfile } from '../../../types/training'
import { buildAthletePlanningInputs } from '../buildAthletePlanningInputs'

const TODAY = '2025-03-10'

function baseProfile(over: Partial<UserProfile>): UserProfile {
  return { ...DEFAULT_PROFILE, ...over }
}

const emptyEvents: CalendarEvent[] = []

describe('buildAthletePlanningInputs', () => {
  it('FRONT_ROW -> front_row', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.derived.resolvedPositionGroup).toBe('front_row')
    expect(r.inputs.positionGroup).toBe('front_row')
  })

  it('BACK_THREE -> back_three', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ rugbyPosition: 'BACK_THREE' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.derived.resolvedPositionGroup).toBe('back_three')
  })

  it('SECOND_ROW (avant non première ligne) -> front_row', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ rugbyPosition: 'SECOND_ROW' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.derived.resolvedPositionGroup).toBe('front_row')
  })

  it('poste absent -> back_three + warning', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ rugbyPosition: undefined, position: undefined }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.derived.resolvedPositionGroup).toBe('back_three')
    expect(r.warnings.some((w) => /non renseigné|back_three/i.test(w))).toBe(true)
  })

  it('fatigue OK + ACWR optimal -> normal', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'optimal',
    })
    expect(r.derived.fatigueLevel).toBe('normal')
  })

  it('FATIGUE ou caution -> high', () => {
    const hi = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'FATIGUE',
      acwrZone: 'optimal',
    })
    expect(hi.derived.fatigueLevel).toBe('high')

    const hi2 = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'caution',
    })
    expect(hi2.derived.fatigueLevel).toBe('high')
  })

  it('danger / critical -> very_high', () => {
    const d = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'danger',
    })
    expect(d.derived.fatigueLevel).toBe('very_high')
    const c = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'critical',
    })
    expect(c.derived.fatigueLevel).toBe('very_high')
  })

  it('monitoring snapshot : compteurs 7j/28j, blessures, dernière charge RPE×durée', () => {
    const logs: SessionLog[] = [
      {
        id: '1',
        dateISO: '2025-03-09T10:00:00.000Z',
        week: 'W1',
        sessionType: 'LOWER',
        fatigue: 'OK',
        rpe: 8,
        durationMin: 60,
      },
      {
        id: '2',
        dateISO: '2025-03-01T10:00:00.000Z',
        week: 'W1',
        sessionType: 'UPPER',
        fatigue: 'OK',
      },
    ]
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ injuries: ['knee_pain', 'ankle_pain'] }),
      events: emptyEvents,
      logs,
      today: '2025-03-10',
      fatigue: 'OK',
    })
    expect(r.inputs.monitoringSnapshot?.completedSessionsLast7d).toBeGreaterThanOrEqual(1)
    expect(r.inputs.monitoringSnapshot?.completedSessionsLast28d).toBeGreaterThanOrEqual(2)
    expect(r.inputs.monitoringSnapshot?.painFlags).toEqual(['knee_pain', 'ankle_pain'])
    expect(r.inputs.monitoringSnapshot?.latestRpeLoad).toBe(8 * 60)
  })

  it('weeklySessions absente -> fallback 2 + warning', () => {
    const r = buildAthletePlanningInputs({
      profile: { ...baseProfile({}), weeklySessions: undefined as unknown as 2 | 3 },
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.weeklyFrequency).toBe(2)
    expect(r.warnings.some((w) => /fréquence|2 séances/i.test(w))).toBe(true)
  })

  it('identity : clubCode + athleteId passés via athleteIdentity', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ clubCode: 'ABC' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      athleteIdentity: { athleteId: 'user-1', source: 'self' },
    })
    expect(r.inputs.identity?.athleteId).toBe('user-1')
    expect(r.inputs.identity?.clubId).toBe('ABC')
    expect(r.inputs.identity?.source).toBe('self')
  })

  it('first-run (events=0, logs=0) : injecte onboardingCycleHint depuis seasonMode', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'off_season' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors).toEqual({ onboardingCycleHint: 'off_season' })
  })

  it('logs présents + pas de match + seasonMode → hint injecté (seasonMode durable)', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'in_season' }),
      events: emptyEvents,
      logs: [{ dateISO: '2025-03-09', sessionType: 'UPPER' as const }] as SessionLog[],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors).toEqual({ onboardingCycleHint: 'in_season' })
  })

  it('événement rest seul + pas de logs → hint injecté', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'in_season' }),
      events: [{ date: '2025-03-08', type: 'rest' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors).toEqual({ onboardingCycleHint: 'in_season' })
  })

  it('événement unavailable seul + pas de logs → hint injecté', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'pre_season' }),
      events: [{ date: '2025-03-08', type: 'unavailable' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors).toEqual({ onboardingCycleHint: 'pre_season' })
  })

  it('match présent + pas de logs → pas de hint', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'in_season' }),
      events: [{ date: '2025-04-05', type: 'match' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors).toBeUndefined()
  })
})

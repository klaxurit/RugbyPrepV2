import { describe, expect, it } from 'vitest'
import { resolveMotherSessionsForWeek } from '../resolveMotherSessionsForWeek'
import type { AthletePlanningInputs } from '../../../types/annualPlanning'

function makeInputs(
  overrides: Partial<AthletePlanningInputs> = {}
): AthletePlanningInputs {
  return {
    events: [{ date: '2026-04-05', type: 'match' }],
    today: '2026-04-10',
    weeklyFrequency: 3,
    positionGroup: 'back_three',
    ...overrides,
  }
}

describe('in-season fatigue load choice (remplace recovery auto)', () => {
  it('in_season + very_high sans choix → plus de swap recovery, template high', () => {
    const inputs = makeInputs({ fatigueLevel: 'very_high' })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.planningContext.cycle).toBe('in_season')
    expect(result.planningContext.loadManagementOverride).toBeUndefined()
    expect(result.sessions.length).toBeGreaterThanOrEqual(2)
    expect(result.sessions[0].sessionId).not.toBe('FULL_OFFSEASON_RECOVERY_A_V1')
  })

  it('drop_session retire une séance (Primer) sur 3×', () => {
    const inputs = makeInputs({
      fatigueLevel: 'very_high',
      fatigueLoadChoice: 'drop_session',
    })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.sessions.length).toBe(2)
    expect(result.planningContext.fatigueLoadChoiceApplied).toBe('drop_session')
    expect(result.warnings.join(' ')).toMatch(/retirée|retir/i)
  })

  it('lighten_volume garde la fréquence et marque light', () => {
    const inputs = makeInputs({
      fatigueLevel: 'very_high',
      fatigueLoadChoice: 'lighten_volume',
    })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.sessions.length).toBeGreaterThanOrEqual(2)
    expect(result.sessions.every((s) => s.variant === 'light')).toBe(true)
    expect(result.planningContext.fatigueLoadChoiceApplied).toBe('lighten_volume')
  })

  it('self_manage ne force pas light sur toutes les séances', () => {
    const inputs = makeInputs({
      fatigueLevel: 'very_high',
      fatigueLoadChoice: 'self_manage',
    })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.planningContext.fatigueLoadChoiceApplied).toBe('self_manage')
    // Sans fatigue template high : pas d’allègement forcé global
    expect(result.sessions.every((s) => s.variant === 'light')).toBe(false)
  })

  it('in_season + high → pas de recovery override', () => {
    const inputs = makeInputs({ fatigueLevel: 'high' })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.planningContext.cycle).toBe('in_season')
    expect(result.planningContext.loadManagementOverride).toBeUndefined()
  })

  it('off_season + very_high → pas de recovery override', () => {
    const inputs = makeInputs({
      events: [],
      fatigueLevel: 'very_high',
      planningAnchors: { onboardingCycleHint: 'off_season' },
    })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.planningContext.cycle).toBe('off_season')
    expect(result.planningContext.loadManagementOverride).toBeUndefined()
  })
})

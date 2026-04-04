import { describe, expect, it } from 'vitest'
import { buildSafeSequentialFallback } from '../buildSafeSequentialFallback'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'

function makeMinimalContext(
  overrides?: Partial<AnnualPlanningContext>,
): AnnualPlanningContext {
  return {
    cycle: 'off_season',
    weekLabel: 'Off-season S1',
    isDeloadWeek: false,
    isMatchWeek: false,
    firstMatchDate: null,
    lastMatchDate: null,
    offSeasonStartAt: null,
    daysUntilNextMatch: null,
    daysSinceLastMatch: null,
    fatigueLevel: 'normal',
    weeklyFrequency: 2,
    positionGroup: 'front_row',
    planningTrace: {
      resolutionMode: 'backfilled',
      rulesApplied: [],
      warnings: [],
    },
    ...overrides,
  }
}

describe('buildSafeSequentialFallback', () => {
  it('returns a valid result with status resolved_with_warnings', () => {
    const ctx = makeMinimalContext()
    const result = buildSafeSequentialFallback(ctx)

    expect(result.status).toBe('resolved_with_warnings')
    expect(result.planningContext).toBe(ctx)
  })

  it('contains exactly 2 sessions using existing recovery templates', () => {
    const result = buildSafeSequentialFallback(makeMinimalContext())

    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0].sessionId).toBe('FULL_OFFSEASON_RECOVERY_A_V1')
    expect(result.sessions[1].sessionId).toBe('FULL_OFFSEASON_RECOVERY_B_V1')
  })

  it('both sessions use variant light', () => {
    const result = buildSafeSequentialFallback(makeMinimalContext())

    for (const slot of result.sessions) {
      expect(slot.variant).toBe('light')
    }
  })

  it('both sessions have role primary', () => {
    const result = buildSafeSequentialFallback(makeMinimalContext())

    for (const slot of result.sessions) {
      expect(slot.role).toBe('primary')
    }
  })

  it('sessions reference real MotherSession objects (not undefined)', () => {
    const result = buildSafeSequentialFallback(makeMinimalContext())

    for (const slot of result.sessions) {
      expect(slot.session).toBeDefined()
      expect(slot.session.metadata.id).toBe(slot.sessionId)
    }
  })

  it('contains a warning message', () => {
    const result = buildSafeSequentialFallback(makeMinimalContext())

    expect(result.warnings.length).toBeGreaterThanOrEqual(1)
    expect(result.warnings[0]).toContain('Programme adapté')
  })

  it('preserves the planningContext as-is (backfilled context)', () => {
    const ctx = makeMinimalContext({
      cycle: 'pre_season',
      weekLabel: 'Pre-season Phase 1',
      planningTrace: {
        resolutionMode: 'backfilled',
        rulesApplied: ['some_rule'],
        warnings: ['some_warning'],
      },
    })
    const result = buildSafeSequentialFallback(ctx)

    expect(result.planningContext).toBe(ctx)
    expect(result.planningContext.cycle).toBe('pre_season')
  })

  it('never throws regardless of context values', () => {
    // Edge: in_season context with match data
    expect(() =>
      buildSafeSequentialFallback(
        makeMinimalContext({
          cycle: 'in_season',
          isMatchWeek: true,
          daysUntilNextMatch: 3,
          fatigueLevel: 'very_high',
        }),
      ),
    ).not.toThrow()
  })

  it('day preferences are set (early_week and late_week)', () => {
    const result = buildSafeSequentialFallback(makeMinimalContext())

    expect(result.sessions[0].dayPreference).toBe('early_week')
    expect(result.sessions[1].dayPreference).toBe('late_week')
  })

  it('guarantees non-empty sessions even if preferred IDs were hypothetically missing', () => {
    // We can't remove entries from the generated dataset at runtime,
    // but we verify the structural guarantee: the result always has
    // sessions with valid MotherSession references and variant=light.
    const result = buildSafeSequentialFallback(makeMinimalContext())

    expect(result.sessions.length).toBeGreaterThanOrEqual(1)
    for (const slot of result.sessions) {
      expect(slot.session).toBeDefined()
      expect(slot.session.metadata).toBeDefined()
      expect(slot.variant).toBe('light')
      expect(slot.role).toBe('primary')
    }
  })
})

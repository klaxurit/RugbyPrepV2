import { describe, expect, it } from 'vitest'
import { buildWeekProgram } from './buildWeekProgram'
import { createProfile } from './testHelpers'

describe('buildWeekProgram contracts', () => {
  it('rejects invalid weeks with a controlled error', () => {
    expect(() => buildWeekProgram(createProfile(), 'INVALID_WEEK' as never)).toThrow(
      /Invalid cycle week/
    )
  })

  it('normalizes malformed profile fields (injuries/equipment) without crashing', () => {
    const malformed = {
      ...createProfile(),
      injuries: null,
      equipment: undefined,
    } as unknown as Parameters<typeof buildWeekProgram>[0]

    const result = buildWeekProgram(malformed, 'W1')
    expect(result.sessions.length).toBeGreaterThanOrEqual(1)
  })

  it('clamps starter weekly sessions to 2 even when profile requests 3', () => {
    const result = buildWeekProgram(
      createProfile({
        trainingLevel: 'starter',
        weeklySessions: 3 as 2 | 3,
      }),
      'W1'
    )

    expect(result.sessions.map((session) => session.recipeId)).toEqual([
      'LOWER_STARTER_V1',
      'UPPER_STARTER_V1',
    ])
  })

  it('routes DELOAD to structured W1 session + mobility (H1, VC-05)', () => {
    const result = buildWeekProgram(createProfile(), 'DELOAD')
    // VC-05: performance 3x deload = 1 structured (LOWER) + 1 mobility (no duplicate)
    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0]?.recipeId).toBe('LOWER_V1')
    expect(result.sessions[1]?.recipeId).toBe('RECOVERY_MOBILITY_V1')
    // Structured session uses W1 version (volume -40-50%)
    for (const builtBlock of result.sessions[0]!.blocks) {
      expect(builtBlock.version.versionId).toBe('W1')
    }
  })

  it('routes starter DELOAD to mobility-only (no structured session)', () => {
    const result = buildWeekProgram(
      createProfile({ trainingLevel: 'starter', weeklySessions: 2 }),
      'DELOAD'
    )
    expect(result.sessions).toHaveLength(2)
    expect(result.sessions.every((s) => s.recipeId === 'RECOVERY_MOBILITY_V1')).toBe(true)
  })

  it('applies U18 hard caps when weekly load context breaches limits', () => {
    const result = buildWeekProgram(
      createProfile({
        ageBand: 'u18',
        parentalConsentHealthData: true,
        weeklyLoadContext: {
          contactHighMinutesWeek: 20,
        },
      }),
      'W1',
      {
        featureFlags: {
          populationProfileV1: true,
          safetyContractsV1: true,
          u18HardCapsV1: true,
        },
      }
    )

    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0]?.recipeId).toBe('RECOVERY_MOBILITY_V1')
    expect(result.hardConstraintEvents).toContain('hard:u18-max-high-contact')
  })

  it('enforces consent gating for U18 health-sensitive profiles', () => {
    const result = buildWeekProgram(
      createProfile({
        ageBand: 'u18',
        parentalConsentHealthData: false,
      }),
      'W1',
      {
        featureFlags: {
          populationProfileV1: true,
          safetyContractsV1: true,
          u18HardCapsV1: true,
        },
      }
    )

    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0]?.recipeId).toBe('RECOVERY_MOBILITY_V1')
    expect(result.hardConstraintEvents).toContain('hard:u18-parental-consent-missing')
  })

  it('supports feature-flag fallback to legacy behavior', () => {
    const result = buildWeekProgram(
      createProfile({
        ageBand: 'u18',
        parentalConsentHealthData: false,
      }),
      'W1',
      {
        featureFlags: {
          populationProfileV1: false,
          safetyContractsV1: false,
          u18HardCapsV1: false,
        },
      }
    )

    expect(result.hardConstraintEvents).toEqual([])
    expect(result.sessions[0]?.recipeId).toBe('LOWER_V1')
  })
})

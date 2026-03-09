import { describe, expect, it } from 'vitest'
import { buildWeekProgram } from './buildWeekProgram'
import { createProfile } from './testHelpers'
import { validateSession } from './validateSession'

describe('buildWeekProgram', () => {
  it('TID-ENG-001 falls back to starter recipes and starter blocks for legacy profiles without trainingLevel', () => {
    const legacyProfile = createProfile({
      trainingLevel: undefined,
      weeklySessions: 2,
      equipment: ['dumbbell', 'band', 'bench', 'pullup_bar'],
    })

    const result = buildWeekProgram(legacyProfile, 'W1')

    expect(result.sessions.map((session) => session.recipeId)).toEqual([
      'UPPER_STARTER_V1',
      'LOWER_STARTER_V1',
    ])

    for (const session of result.sessions) {
      for (const builtBlock of session.blocks) {
        expect(builtBlock.block.tags).toContain('starter')
      }
      expect(validateSession(session).isValid).toBe(true)
    }
  })

  it('TID-ENG-002 keeps upper rehab phase 1 sessions valid when prehab falls back to core', () => {
    const rehabProfile = createProfile({
      injuries: ['shoulder_pain'],
      rehabInjury: {
        zone: 'upper',
        phase: 1,
        startDate: '2026-03-01',
        phaseStartDate: '2026-03-01',
        type: 'shoulder_pain',
      },
    })

    const result = buildWeekProgram(rehabProfile, 'W1')
    const rehabSession = result.sessions.find((session) => session.recipeId === 'REHAB_UPPER_P1_V1')

    expect(rehabSession).toBeTruthy()
    expect(validateSession(rehabSession!).isValid).toBe(true)

    const finisherCount = rehabSession!.blocks.filter(
      (builtBlock) =>
        builtBlock.block.intent === 'neck' ||
        builtBlock.block.intent === 'core' ||
        builtBlock.block.intent === 'carry'
    ).length

    expect(finisherCount).toBeLessThanOrEqual(1)
  })

  it('TID-ENG-003 replaces the last session with recovery mobility in ACWR danger and keeps it valid', () => {
    const result = buildWeekProgram(createProfile(), 'W1', {
      fatigueLevel: 'danger',
      hasSufficientACWRData: true,
    })

    expect(result.sessions.map((session) => session.recipeId)).toEqual([
      'UPPER_V1',
      'LOWER_V1',
      'RECOVERY_MOBILITY_V1',
    ])
    expect(result.warnings).toContain('ACWR surcharge : dernière séance remplacée par mobilité.')
    expect(validateSession(result.sessions[2]!).isValid).toBe(true)
  })

  it('TID-ENG-004 reduces the week to one session in ACWR critical', () => {
    const result = buildWeekProgram(createProfile(), 'W1', {
      fatigueLevel: 'critical',
      hasSufficientACWRData: true,
    })

    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0]?.recipeId).toBe('UPPER_V1')
    expect(result.warnings).toContain('ACWR critique : programme réduit à 1 séance. Récupération prioritaire.')
  })

  it('TID-ENG-005 changes the upper main block after the force block rollover', () => {
    const weekOne = buildWeekProgram(createProfile(), 'W1')
    const weekFive = buildWeekProgram(createProfile(), 'W5')
    // 2 sessions/week = LOWER + UPPER; 3 = UPPER + LOWER + FULL
    const upperWeekOne = weekOne.sessions.find((session) => session.recipeId === 'UPPER_V1')
    const upperWeekFive = weekFive.sessions.find((session) => session.recipeId === 'UPPER_V1')

    const mainIds = (session: NonNullable<typeof upperWeekOne>) =>
      session.blocks
        .filter(
          (builtBlock) =>
            builtBlock.block.intent === 'activation' ||
            builtBlock.block.intent === 'contrast' ||
            builtBlock.block.intent === 'force'
        )
        .map((builtBlock) => builtBlock.block.blockId)

    expect(upperWeekOne).toBeTruthy()
    expect(upperWeekFive).toBeTruthy()
    expect(mainIds(upperWeekOne!)).not.toEqual(mainIds(upperWeekFive!))
  })
})

import { describe, expect, it } from 'vitest'
import { inSeasonAbVariant, inSeasonVarietyLane } from '../inSeasonVarietyLane'
import { resolveInSeasonLowerSessionId } from '../resolveInSeasonLowerSessionId'
import {
  resolveInSeasonFullBodySessionId,
  resolveInSeasonPrimerSessionId,
} from '../resolveInSeasonFullVariantSessionId'
import { getWeeklyTemplate } from '../weeklyTemplates'
import { MOTHER_SESSIONS_BY_ID } from '../motherSessions.generated'

describe('inSeasonVarietyLane', () => {
  it('Fondations : 1 lane / mésocycle', () => {
    expect(
      inSeasonVarietyLane({ mesocycleBlock: 1, mesocycleWeek: 1, trainingLevel: 'starter' }),
    ).toBe(0)
    expect(
      inSeasonVarietyLane({ mesocycleBlock: 1, mesocycleWeek: 4, trainingLevel: 'starter' }),
    ).toBe(0)
    expect(
      inSeasonVarietyLane({ mesocycleBlock: 2, mesocycleWeek: 1, trainingLevel: 'starter' }),
    ).toBe(1)
  })

  it('Performance : change à mi-mésocycle', () => {
    expect(
      inSeasonVarietyLane({ mesocycleBlock: 1, mesocycleWeek: 1, trainingLevel: 'performance' }),
    ).toBe(0)
    expect(
      inSeasonVarietyLane({ mesocycleBlock: 1, mesocycleWeek: 3, trainingLevel: 'performance' }),
    ).toBe(1)
    expect(
      inSeasonVarietyLane({ mesocycleBlock: 2, mesocycleWeek: 1, trainingLevel: 'performance' }),
    ).toBe(2)
  })

  it('A/B suit la parité de lane', () => {
    expect(inSeasonAbVariant(0)).toBe('A')
    expect(inSeasonAbVariant(1)).toBe('B')
  })
})

describe('resolveInSeasonLowerSessionId', () => {
  it('front_row lane 1 → Front Squat mother', () => {
    expect(
      resolveInSeasonLowerSessionId({
        positionGroup: 'front_row',
        mesocycleBlock: 2,
        trainingLevel: 'starter',
      }),
    ).toBe('LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1')
  })

  it('back_three lane 3 → Shrug mother', () => {
    expect(
      resolveInSeasonLowerSessionId({
        positionGroup: 'back_three',
        mesocycleBlock: 4,
        trainingLevel: 'starter',
      }),
    ).toBe('LOWER_IN_SEASON_BACK_THREE_SHRUG_V1')
  })
})

describe('resolveInSeason Primer / Full A/B', () => {
  it('lane paire → A, impaire → B', () => {
    expect(
      resolveInSeasonPrimerSessionId({
        positionGroup: 'front_row',
        mesocycleBlock: 1,
        trainingLevel: 'starter',
      }),
    ).toBe('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1')
    expect(
      resolveInSeasonPrimerSessionId({
        positionGroup: 'front_row',
        mesocycleBlock: 2,
        trainingLevel: 'starter',
      }),
    ).toBe('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_B_V1')
    expect(
      resolveInSeasonFullBodySessionId({
        positionGroup: 'back_three',
        mesocycleBlock: 2,
        trainingLevel: 'starter',
      }),
    ).toBe('FULL_BODY_IN_SEASON_BACK_THREE_B_V1')
  })
})

describe('getWeeklyTemplate — variété Lower + Primer', () => {
  it('mesocycleBlock 2 front_row match : Lower FrontSquat + Primer B + Upper chest pass', () => {
    const { sessions } = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'front_row',
      matchContext: 'match_week',
      mesocycleBlock: 2,
      trainingLevel: 'starter',
    })
    const ids = sessions.map((s) => s.sessionId)
    expect(ids).toContain('LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1')
    expect(ids).toContain('UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1')
    expect(ids).toContain('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_B_V1')
  })
})

describe('corpus variété in-season publié', () => {
  const required = [
    'LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1',
    'LOWER_IN_SEASON_FRONT_ROW_TBRDL_V1',
    'LOWER_IN_SEASON_FRONT_ROW_PAUSEJUMP_V1',
    'LOWER_IN_SEASON_BACK_THREE_RDL_V1',
    'LOWER_IN_SEASON_BACK_THREE_SLHIP_V1',
    'LOWER_IN_SEASON_BACK_THREE_SHRUG_V1',
    'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_B_V1',
    'FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_B_V1',
    'FULL_BODY_IN_SEASON_FRONT_ROW_B_V1',
    'FULL_BODY_IN_SEASON_BACK_THREE_B_V1',
  ]

  for (const id of required) {
    it(`${id} existe dans le dataset`, () => {
      expect(MOTHER_SESSIONS_BY_ID[id]).toBeDefined()
      expect(MOTHER_SESSIONS_BY_ID[id].blocks.length).toBeGreaterThan(0)
    })
  }

  it('FRONTSQUAT B1 = Front Squat', () => {
    const s = MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1
    expect(s.blocks[0].exercises[0].name).toMatch(/front squat/i)
  })

  it('PAUSEJUMP B1 B = Jump Step-Up', () => {
    const s = MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_FRONT_ROW_PAUSEJUMP_V1
    expect(s.blocks[0].exercises[1].name).toMatch(/jump step-up/i)
  })
})

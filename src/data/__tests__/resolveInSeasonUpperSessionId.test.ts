import { describe, expect, it } from 'vitest'
import {
  inSeasonUpperContrastLane,
  resolveInSeasonUpperSessionId,
} from '../resolveInSeasonUpperSessionId'
import { getWeeklyTemplate } from '../weeklyTemplates'
import { MOTHER_SESSIONS_BY_ID } from '../motherSessions.generated'

describe('resolveInSeasonUpperSessionId', () => {
  it('lane suit mesocycleBlock mod 4', () => {
    expect(inSeasonUpperContrastLane(1)).toBe(0)
    expect(inSeasonUpperContrastLane(4)).toBe(3)
    expect(inSeasonUpperContrastLane(5)).toBe(0)
    expect(inSeasonUpperContrastLane(8)).toBe(3)
  })

  it('avants : plyo → chest pass → landmine → supine (landmine si match week)', () => {
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'front_row',
        mesocycleBlock: 1,
      }),
    ).toBe('UPPER_IN_SEASON_FRONT_ROW_V1')
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'front_row',
        mesocycleBlock: 2,
      }),
    ).toBe('UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1')
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'front_row',
        mesocycleBlock: 3,
      }),
    ).toBe('UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1')
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'front_row',
        mesocycleBlock: 4,
        matchContext: 'no_match_week',
      }),
    ).toBe('UPPER_IN_SEASON_FRONT_ROW_SUPINE_V1')
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'front_row',
        mesocycleBlock: 4,
        matchContext: 'match_week',
      }),
    ).toBe('UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1')
  })

  it('arrières : landmine → plyo → chest pass → rotational (push press si match week landmine)', () => {
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'back_three',
        mesocycleBlock: 1,
        matchContext: 'no_match_week',
      }),
    ).toBe('UPPER_IN_SEASON_BACK_THREE_LANDMINE_V1')
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'back_three',
        mesocycleBlock: 1,
        matchContext: 'match_week',
      }),
    ).toBe('UPPER_IN_SEASON_BACK_THREE_PUSHPRESS_V1')
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'back_three',
        mesocycleBlock: 2,
      }),
    ).toBe('UPPER_IN_SEASON_BACK_THREE_PLYO_V1')
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'back_three',
        mesocycleBlock: 3,
      }),
    ).toBe('UPPER_IN_SEASON_BACK_THREE_V1')
    expect(
      resolveInSeasonUpperSessionId({
        positionGroup: 'back_three',
        mesocycleBlock: 4,
      }),
    ).toBe('UPPER_IN_SEASON_BACK_THREE_ROTATIONAL_V1')
  })
})

describe('getWeeklyTemplate — rotation contraste', () => {
  it('sans mesocycleBlock : IDs de base inchangés', () => {
    const { sessions } = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'front_row',
      matchContext: 'match_week',
    })
    expect(sessions.map((s) => s.sessionId)).toContain('UPPER_IN_SEASON_FRONT_ROW_V1')
  })

  it('avec mesocycleBlock 2 front_row : chest pass', () => {
    const { sessions } = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'front_row',
      matchContext: 'match_week',
      mesocycleBlock: 2,
    })
    expect(sessions.map((s) => s.sessionId)).toContain(
      'UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1',
    )
  })
})

describe('in-season upper contrast mothers — corpus', () => {
  const expectedB: Record<string, RegExp> = {
    UPPER_IN_SEASON_FRONT_ROW_V1: /plyo push-up/i,
    UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1: /med ball chest pass/i,
    UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1: /explosive landmine press/i,
    UPPER_IN_SEASON_FRONT_ROW_SUPINE_V1: /supine med ball throw/i,
    UPPER_IN_SEASON_BACK_THREE_V1: /med ball chest pass/i,
    UPPER_IN_SEASON_BACK_THREE_LANDMINE_V1: /explosive landmine press/i,
    UPPER_IN_SEASON_BACK_THREE_PLYO_V1: /plyo push-up/i,
    UPPER_IN_SEASON_BACK_THREE_ROTATIONAL_V1: /med ball rotational throw/i,
    UPPER_IN_SEASON_BACK_THREE_PUSHPRESS_V1: /push press/i,
  }

  for (const [id, re] of Object.entries(expectedB)) {
    it(`${id} existe et B1 contient le contraste attendu`, () => {
      const s = MOTHER_SESSIONS_BY_ID[id]
      expect(s).toBeDefined()
      const b1 = s.blocks[0]
      expect(b1.exercises[0].name).toMatch(/bench/i)
      expect(b1.exercises.some((e) => re.test(e.name))).toBe(true)
    })
  }
})

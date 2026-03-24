import { describe, it, expect } from 'vitest'
import { getSessionFr } from '../motherSessionContentFr'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'

const TRANSLATED_SESSION_IDS = [
  'FULL_OFFSEASON_RECOVERY_A_V1',
  'FULL_OFFSEASON_RECOVERY_B_V1',
  'LOWER_IN_SEASON_FRONT_ROW_V1',
  'LOWER_IN_SEASON_BACK_THREE_V1',
  'UPPER_IN_SEASON_FRONT_ROW_V1',
  'UPPER_IN_SEASON_BACK_THREE_V1',
  'FULL_BODY_IN_SEASON_FRONT_ROW_V1',
  'FULL_BODY_IN_SEASON_BACK_THREE_V1',
  'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1',
  'FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1',
]

describe('motherSessionContentFr', () => {
  describe.each(TRANSLATED_SESSION_IDS)('session %s', (sessionId) => {
    it('FR block count matches source block count', () => {
      const source = MOTHER_SESSIONS_BY_ID[sessionId]
      const fr = getSessionFr(sessionId)
      expect(source).toBeDefined()
      expect(fr).toBeDefined()
      expect(fr!.blocks.length).toBe(source.blocks.length)
    })

    it('has non-empty goals and blocks', () => {
      const fr = getSessionFr(sessionId)!
      expect(fr.goals.length).toBeGreaterThan(0)
      expect(fr.blocks.length).toBeGreaterThan(0)
    })

    it('each FR block has matching exercise count', () => {
      const source = MOTHER_SESSIONS_BY_ID[sessionId]
      const fr = getSessionFr(sessionId)!
      fr.blocks.forEach((frBlock, i) => {
        expect(frBlock.exercises.length).toBe(source.blocks[i].exercises.length)
      })
    })
  })

  it('getSessionFr returns undefined for untranslated session', () => {
    expect(getSessionFr('NONEXISTENT_SESSION_V1')).toBeUndefined()
  })
})

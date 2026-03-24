import { describe, expect, it } from 'vitest'
import { parseAllMotherSessions } from '../parseAllMotherSessions'
import {
  FIXTURE_LOWER_PRESEASON_FORCE_V1,
  FIXTURE_UPPER_IN_SEASON_FRONT_ROW_V1,
} from './motherSessionFixtures'

describe('parseAllMotherSessions', () => {
  it('consolide plusieurs entrées avec sessions et byId', () => {
    const { sessions, byId } = parseAllMotherSessions([
      {
        filePath: 'pre-season/LOWER_PRESEASON_FORCE_V1.md',
        markdown: FIXTURE_LOWER_PRESEASON_FORCE_V1,
      },
      {
        filePath: 'UPPER_IN_SEASON_FRONT_ROW_V1.md',
        markdown: FIXTURE_UPPER_IN_SEASON_FRONT_ROW_V1,
      },
    ])
    expect(sessions).toHaveLength(2)
    expect(byId.LOWER_PRESEASON_FORCE_V1.metadata.sessionType).toBe('lower')
    expect(byId.UPPER_IN_SEASON_FRONT_ROW_V1.metadata.sessionType).toBe('upper')
    expect(byId.LOWER_PRESEASON_FORCE_V1).toBe(sessions.find((s) => s.metadata.id === 'LOWER_PRESEASON_FORCE_V1'))
  })

  it('tri stable par metadata.id (ordre lexicographique en)', () => {
    const { sessions } = parseAllMotherSessions([
      {
        filePath: 'z/UPPER_IN_SEASON_FRONT_ROW_V1.md',
        markdown: FIXTURE_UPPER_IN_SEASON_FRONT_ROW_V1,
      },
      {
        filePath: 'a/LOWER_PRESEASON_FORCE_V1.md',
        markdown: FIXTURE_LOWER_PRESEASON_FORCE_V1,
      },
    ])
    expect(sessions.map((s) => s.metadata.id)).toEqual([
      'LOWER_PRESEASON_FORCE_V1',
      'UPPER_IN_SEASON_FRONT_ROW_V1',
    ])
  })

  it('retourne sessions et byId vides pour une entrée vide', () => {
    expect(parseAllMotherSessions([])).toEqual({ sessions: [], byId: {} })
  })

  it('lève une erreur descriptive si deux fichiers produisent le même id', () => {
    expect(() =>
      parseAllMotherSessions([
        { filePath: 'docs/a/LOWER_PRESEASON_FORCE_V1.md', markdown: FIXTURE_LOWER_PRESEASON_FORCE_V1 },
        { filePath: 'docs/b/LOWER_PRESEASON_FORCE_V1.md', markdown: FIXTURE_LOWER_PRESEASON_FORCE_V1 },
      ])
    ).toThrow(/dupliqués|LOWER_PRESEASON_FORCE_V1|docs\/a|docs\/b/s)
  })
})

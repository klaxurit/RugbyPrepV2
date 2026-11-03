import { describe, expect, it } from 'vitest'
import {
  COMPETITION_PAUSE_MAX_DAYS,
  competitionPauseEndsOn,
  isCompetitionPauseActive,
} from '../competitionPause'

describe('isCompetitionPauseActive', () => {
  it('est inactive sans kind', () => {
    expect(
      isCompetitionPauseActive(
        { kind: null, startedOn: null, endsOn: null },
        '2026-11-03',
      ),
    ).toBe(false)
  })

  it('est active entre début et fin inclus', () => {
    expect(
      isCompetitionPauseActive(
        {
          kind: 'blesse',
          startedOn: '2026-11-01',
          endsOn: '2026-11-28',
        },
        '2026-11-01',
      ),
    ).toBe(true)
    expect(
      isCompetitionPauseActive(
        {
          kind: 'blesse',
          startedOn: '2026-11-01',
          endsOn: '2026-11-28',
        },
        '2026-11-28',
      ),
    ).toBe(true)
  })

  it('expire après endsOn', () => {
    expect(
      isCompetitionPauseActive(
        {
          kind: 'blesse',
          startedOn: '2026-11-01',
          endsOn: '2026-11-28',
        },
        '2026-11-29',
      ),
    ).toBe(false)
  })
})

describe('competitionPauseEndsOn', () => {
  it(`couvre ${COMPETITION_PAUSE_MAX_DAYS} jours inclusifs`, () => {
    expect(competitionPauseEndsOn('2026-11-01')).toBe('2026-11-28')
  })
})

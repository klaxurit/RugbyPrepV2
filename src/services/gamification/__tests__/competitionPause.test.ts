import { describe, expect, it } from 'vitest'
import { isCompetitionPauseActive } from '../competitionPause'

describe('isCompetitionPauseActive', () => {
  it('est inactive sans kind', () => {
    expect(
      isCompetitionPauseActive(
        { kind: null, startedOn: null, endsOn: null },
        '2026-11-03',
      ),
    ).toBe(false)
  })

  it('reste active sans endsOn (ouverte jusqu’à levée)', () => {
    expect(
      isCompetitionPauseActive(
        {
          kind: 'blesse',
          startedOn: '2026-11-01',
          endsOn: null,
        },
        '2026-12-15',
      ),
    ).toBe(true)
  })

  it('honore encore un endsOn legacy', () => {
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

import { describe, expect, it } from 'vitest'
import {
  hasFuturePlayoffCalendarSignal,
  inferMatchKindFromFfrJournee,
  resolveMatchKindOnFfrSync,
} from '../inferMatchKindFromFfrJournee'

describe('inferMatchKindFromFfrJournee', () => {
  const cupFinalCases = [
    'Finale',
    'FINALE',
    'Demi-finale',
    'DEMI FINALE',
    'Quart de finale',
    'Quart-finale',
    'Huitième de finale',
    'Huitieme de finale',
    '8ème de finale',
    'Seizième de finale',
    'Barrage A/R',
    'Phase finale',
  ]

  it.each(cupFinalCases)('"%s" → cup_final', (label) => {
    expect(inferMatchKindFromFfrJournee(label)).toBe('cup_final')
  })

  const leagueCases = ['Journée 1', 'JOURNEE 12', 'journee 26', 'Journée 14 - poule A']

  it.each(leagueCases)('"%s" → league', (label) => {
    expect(inferMatchKindFromFfrJournee(label)).toBe('league')
  })

  const unknownCases = ['', '  ', undefined, 'Match amical', 'Tournoi été', 'Phase 2']

  it.each(unknownCases)('%j → null', (label) => {
    expect(inferMatchKindFromFfrJournee(label as string | undefined)).toBeNull()
  })
})

describe('resolveMatchKindOnFfrSync', () => {
  it('does not overwrite an existing match_kind', () => {
    expect(resolveMatchKindOnFfrSync('friendly', 'Finale')).toBeNull()
  })

  it('infers when match_kind is absent', () => {
    expect(resolveMatchKindOnFfrSync(null, 'Journée 8')).toBe('league')
    expect(resolveMatchKindOnFfrSync(undefined, 'Demi-finale')).toBe('cup_final')
  })
})

describe('hasFuturePlayoffCalendarSignal', () => {
  it('detects future cup_final by kind or journee', () => {
    expect(
      hasFuturePlayoffCalendarSignal(
        [
          { type: 'match', date: '2026-04-01', match_kind: 'cup_final' },
          { type: 'match', date: '2026-05-10', journee_name: 'Quart de finale' },
          { type: 'match', date: '2026-03-01', journee_name: 'Finale' },
        ],
        '2026-04-15',
      ),
    ).toBe(true)
  })

  it('ignores past playoff-labelled matches', () => {
    expect(
      hasFuturePlayoffCalendarSignal(
        [{ type: 'match', date: '2026-03-01', journee_name: 'Finale' }],
        '2026-04-15',
      ),
    ).toBe(false)
  })
})

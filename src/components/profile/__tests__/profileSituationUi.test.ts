import { describe, expect, it } from 'vitest'
import {
  isTreveInSeasonSubMode,
  shouldShowAutoEndOfSeasonConfirm,
  treveGapWeeks,
} from '../profileSituationUi'
import type { UserProfile } from '../../../types/training'

describe('profileSituationUi', () => {
  it('detects treve sub-modes', () => {
    expect(isTreveInSeasonSubMode('treve_deep')).toBe(true)
    expect(isTreveInSeasonSubMode('treve_return')).toBe(true)
    expect(isTreveInSeasonSubMode('competition')).toBe(false)
    expect(isTreveInSeasonSubMode('end_of_season')).toBe(false)
  })

  it('treveGapWeeks rounds up to whole weeks', () => {
    expect(treveGapWeeks(22)).toBe(4)
    expect(treveGapWeeks(7)).toBe(1)
    expect(treveGapWeeks(null)).toBeNull()
  })

  it('shouldShowAutoEndOfSeasonConfirm when end_of_season without anchor', () => {
    const profile = { planningAnchors: {} } as UserProfile
    expect(
      shouldShowAutoEndOfSeasonConfirm(
        {
          cycle: 'in_season',
          inSeasonSubMode: 'end_of_season',
          daysSinceLastMatch: 20,
          daysUntilNextMatch: null,
        } as never,
        profile,
      ),
    ).toBe(true)
  })

  it('shouldShowAutoEndOfSeasonConfirm is false when season already ended in anchors', () => {
    const profile = {
      planningAnchors: { seasonEndedAt: '2026-03-01' },
    } as UserProfile
    expect(
      shouldShowAutoEndOfSeasonConfirm(
        { cycle: 'in_season', inSeasonSubMode: 'end_of_season' } as never,
        profile,
      ),
    ).toBe(false)
  })
})

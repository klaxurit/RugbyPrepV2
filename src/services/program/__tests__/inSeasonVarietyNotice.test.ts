import { describe, expect, it } from 'vitest'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import {
  buildInSeasonVarietyNotice,
  canOfferFeatureNoveltyNotice,
  countCompletedGymSessionsForProductPrompts,
  hasCompletedGymSessionForProductPrompts,
  IN_SEASON_VARIETY_NOTICE_ID,
  IN_SEASON_VARIETY_NOTICE_LAUNCH_YMD,
  novelMotherSessionIds,
} from '../inSeasonVarietyNotice'

function ctx(cycle: AnnualPlanningContext['cycle']): AnnualPlanningContext {
  return {
    cycle,
    weeklyFrequency: 3,
    positionGroup: 'back_three',
    fatigueLevel: 'OK',
  } as AnnualPlanningContext
}

const legacyGate = {
  completedGymSessionCount: 2,
  accountCreatedYmd: '2026-01-15',
}

describe('hasCompletedGymSessionForProductPrompts', () => {
  it('gate centralisé ≥1 séance gym', () => {
    expect(hasCompletedGymSessionForProductPrompts({ completedGymSessionCount: 0 })).toBe(false)
    expect(hasCompletedGymSessionForProductPrompts({ completedGymSessionCount: 1 })).toBe(true)
  })

  it('compte hors récup', () => {
    expect(
      countCompletedGymSessionsForProductPrompts([
        { sessionType: 'LOWER' },
        { sessionType: 'RECOVERY' },
        { sessionType: 'ACTIVE_RECOVERY' },
        { sessionType: 'UPPER' },
      ]),
    ).toBe(2)
  })
})

describe('canOfferFeatureNoveltyNotice', () => {
  it('refuse avant la 1re séance', () => {
    expect(
      canOfferFeatureNoveltyNotice({
        completedGymSessionCount: 0,
        accountCreatedYmd: '2026-01-15',
      }),
    ).toBe(false)
  })

  it('refuse les comptes créés à la date de lancement ou après', () => {
    expect(
      canOfferFeatureNoveltyNotice({
        completedGymSessionCount: 3,
        accountCreatedYmd: IN_SEASON_VARIETY_NOTICE_LAUNCH_YMD,
      }),
    ).toBe(false)
    expect(
      canOfferFeatureNoveltyNotice({
        completedGymSessionCount: 3,
        accountCreatedYmd: '2026-11-10',
      }),
    ).toBe(false)
  })

  it('accepte un compte legacy après au moins 1 séance', () => {
    expect(canOfferFeatureNoveltyNotice(legacyGate)).toBe(true)
  })
})

describe('buildInSeasonVarietyNotice', () => {
  it('émet une notice feature en in-season (compte legacy)', () => {
    const notice = buildInSeasonVarietyNotice(ctx('in_season'), '2026-04-15', 'fr', legacyGate)
    expect(notice).not.toBeNull()
    expect(notice?.id).toBe(IN_SEASON_VARIETY_NOTICE_ID)
    expect(notice?.type).toBe('feature')
    expect(notice?.severity).toBe('info')
    expect(notice?.postponable).toBe(true)
    expect(notice?.title.toLowerCase()).toContain('vivant')
    expect(notice?.bullets.length).toBeGreaterThanOrEqual(2)
    expect(notice?.bullets.some((b) => /Bas du corps/i.test(b))).toBe(true)
    expect(notice?.bullets.every((b) => !/\bLower\b|\bPrimer\b/.test(b))).toBe(true)
  })

  it('ne s’affiche pas hors in-season', () => {
    expect(buildInSeasonVarietyNotice(ctx('pre_season'), '2026-04-15', 'fr', legacyGate)).toBeNull()
    expect(buildInSeasonVarietyNotice(ctx('off_season'), '2026-04-15', 'en', legacyGate)).toBeNull()
  })

  it('ne s’affiche pas pour un compte neuf (0 séance)', () => {
    expect(
      buildInSeasonVarietyNotice(ctx('in_season'), '2026-11-10', 'fr', {
        completedGymSessionCount: 0,
        accountCreatedYmd: '2026-11-10',
      }),
    ).toBeNull()
  })
})

describe('novelMotherSessionIds', () => {
  it('retourne les ids présents cette semaine absents la précédente', () => {
    const novel = novelMotherSessionIds(
      ['LOWER_A', 'UPPER_B', 'FULL_C'],
      ['LOWER_A', 'UPPER_A', 'FULL_C'],
    )
    expect(novel.size).toBe(1)
    expect(novel.has('UPPER_B')).toBe(true)
    expect(novel.has('LOWER_A')).toBe(false)
    expect(novel.has('FULL_C')).toBe(false)
  })
})

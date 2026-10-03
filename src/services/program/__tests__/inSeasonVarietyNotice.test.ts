import { describe, expect, it } from 'vitest'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import {
  buildInSeasonVarietyNotice,
  IN_SEASON_VARIETY_NOTICE_ID,
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

describe('buildInSeasonVarietyNotice', () => {
  it('émet une notice feature en in-season', () => {
    const notice = buildInSeasonVarietyNotice(ctx('in_season'), '2026-04-15', 'fr')
    expect(notice).not.toBeNull()
    expect(notice?.id).toBe(IN_SEASON_VARIETY_NOTICE_ID)
    expect(notice?.type).toBe('feature')
    expect(notice?.severity).toBe('info')
    expect(notice?.postponable).toBe(true)
    expect(notice?.title.toLowerCase()).toContain('vivant')
    expect(notice?.bullets.length).toBeGreaterThanOrEqual(2)
  })

  it('ne s’affiche pas hors in-season', () => {
    expect(buildInSeasonVarietyNotice(ctx('pre_season'), '2026-04-15', 'fr')).toBeNull()
    expect(buildInSeasonVarietyNotice(ctx('off_season'), '2026-04-15', 'en')).toBeNull()
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

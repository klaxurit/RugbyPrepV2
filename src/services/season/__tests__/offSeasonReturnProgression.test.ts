import { describe, expect, it } from 'vitest'
import { detectAnnualPlanningContext } from '../detectAnnualPlanningContext'

const baseParams = {
  weeklyFrequency: 3 as const,
  positionGroup: 'front_row' as const,
}

/**
 * Régression Hugo : preset `manualOffSeasonWeekOverride: 9` + reprise club
 * → Week/Month doivent rester alignés sur Force-Pont S10 (pas pré-saison anticipée).
 */
describe('off-season progression with returnToTeamTrainingAt', () => {
  const stuckAnchors = {
    manualCycleOverride: 'off_season' as const,
    manualOffSeasonWeekOverride: 9,
    returnToTeamTrainingAt: '2026-08-10',
    skipOffSeasonRecoveryIntro: true,
  }

  it('avance S9 figé → S10 Force-Pont (pas de saut pré-saison)', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      today: '2026-07-21',
      events: [],
      planningAnchors: stuckAnchors,
    })

    expect(r.cycle).toBe('off_season')
    expect(r.weekNumber).toBe(10)
    expect(r.offSeasonPhase).toBe(4)
    expect(r.weekLabel).toBe('Inter-saison Force-Pont - S10')
  })

  it('après S10 + fenêtre de reprise dans la fenêtre → pré-saison (pas figé Force-Pont)', () => {
    const w10 = detectAnnualPlanningContext({
      ...baseParams,
      today: '2026-07-21',
      events: [],
      planningAnchors: stuckAnchors,
    })
    expect(w10.offSeasonStartAt).toBeTruthy()
    const next = detectAnnualPlanningContext({
      ...baseParams,
      today: '2026-07-28',
      events: [],
      planningAnchors: {
        manualCycleOverride: 'off_season',
        returnToTeamTrainingAt: '2026-08-10',
        skipOffSeasonRecoveryIntro: true,
        offSeasonStartAt: w10.offSeasonStartAt!,
      },
    })

    expect(w10.weekNumber).toBe(10)
    // Bloc S1–S10 terminé : la reprise ouvre la pré-saison (règle mois partagée).
    expect(next.cycle).toBe('pre_season')
    expect(next.weekNumber).toBeGreaterThanOrEqual(1)
    expect(next.weekLabel).not.toContain('Force-Pont')
  })
})

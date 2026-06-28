import { describe, expect, it } from 'vitest'
import { buildPlanningAnchorsPatch } from '../buildPlanningAnchorsPatch'

const baseForm = {
  seasonEndedAt: '',
  offSeasonStartAt: '',
  returnToTeamTrainingAt: '',
  onboardingCycleHint: 'off_season',
  manualCycleOverride: 'off_season',
  manualOffSeasonWeekOverride: '5',
  manualPreSeasonWeekOverride: '',
  seasonEndedSource: '',
  skipOffSeasonRecoveryIntro: false,
  manualPlayoffs: false,
}

describe('buildPlanningAnchorsPatch', () => {
  it('form week override wins over stale JSON', () => {
    const json = JSON.stringify({
      manualOffSeasonWeekOverride: 6,
      manualCycleOverride: 'off_season',
    })
    const patch = buildPlanningAnchorsPatch(
      { ...baseForm, manualOffSeasonWeekOverride: '5' },
      json
    )
    expect(patch.manualOffSeasonWeekOverride).toBe(5)
  })

  it('clears override when form field emptied', () => {
    const json = JSON.stringify({ manualOffSeasonWeekOverride: 6 })
    const patch = buildPlanningAnchorsPatch(
      { ...baseForm, manualOffSeasonWeekOverride: '' },
      json
    )
    expect(patch.manualOffSeasonWeekOverride).toBeUndefined()
  })
})

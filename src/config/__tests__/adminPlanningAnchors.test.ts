import { describe, expect, it } from 'vitest'
import {
  ADMIN_PLANNING_ANCHOR_PRESETS,
  findAdminPlanningPreset,
  mergeAdminPlanningPreset,
} from '../adminPlanningAnchors'

describe('adminPlanningAnchors', () => {
  it('includes transition preset at S3', () => {
    const p = findAdminPlanningPreset('off_s3')
    expect(p?.label).toContain('Transition')
    expect(p?.anchors.manualOffSeasonWeekOverride).toBe(3)
  })

  it('merge removes null override keys for auto preset', () => {
    const merged = mergeAdminPlanningPreset(
      { manualCycleOverride: 'off_season', manualOffSeasonWeekOverride: 5 },
      findAdminPlanningPreset('auto')!
    )
    expect(merged.manualCycleOverride).toBeUndefined()
    expect(merged.manualOffSeasonWeekOverride).toBeUndefined()
  })

  it('has off-season and pre-season presets', () => {
    expect(ADMIN_PLANNING_ANCHOR_PRESETS.some((p) => p.id.startsWith('off_'))).toBe(true)
    expect(ADMIN_PLANNING_ANCHOR_PRESETS.some((p) => p.id.startsWith('pre_'))).toBe(true)
  })
})

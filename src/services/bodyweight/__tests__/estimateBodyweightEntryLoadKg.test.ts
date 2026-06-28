import { describe, expect, it } from 'vitest'
import {
  estimateBodyweightEntryLoadKg,
  exerciseSupportsBodyweightEntryLoad,
} from '../estimateBodyweightEntryLoadKg'
import { getLoadSuggestion } from '../../loadSuggestion'

describe('estimateBodyweightEntryLoadKg', () => {
  it('returns null without profile weight', () => {
    expect(
      estimateBodyweightEntryLoadKg('push_horizontal__push_up__standard', null),
    ).toBeNull()
  })

  it('estimates push-up at ~64% bodyweight', () => {
    expect(
      estimateBodyweightEntryLoadKg('push_horizontal__push_up__standard', 80),
    ).toBe(50)
  })

  it('estimates bulgarian split at ~85% bodyweight', () => {
    expect(
      estimateBodyweightEntryLoadKg('lower_squat__bulgarian_split_squat__bodyweight', 80),
    ).toBe(67.5)
  })

  it('skips plyometric exercises', () => {
    expect(
      exerciseSupportsBodyweightEntryLoad('push_horizontal__push_up__plyo'),
    ).toBe(false)
    expect(
      estimateBodyweightEntryLoadKg('power__countermovement_jump', 80),
    ).toBeNull()
  })
})

describe('getLoadSuggestion bodyweight entry', () => {
  it('suggests entry load from weightKg on first log', () => {
    const r = getLoadSuggestion({
      exerciseId: 'push_horizontal__push_up__decline',
      lastEntry: undefined,
      week: 'W1',
      acwr: null,
      fatigueLevel: 'normal',
      weightKg: 90,
      isBodyweightProgram: true,
      prescribedRepsLow: 8,
      prescribedRepsHigh: 10,
    })
    expect(r.suggestedWeight).toBe(67.5)
    expect(r.confidence).toBe('high')
    expect(r.suggestedReps).toBe(8)
  })

  it('warns when bodyweight program but no weightKg', () => {
    const r = getLoadSuggestion({
      exerciseId: 'push_horizontal__push_up__decline',
      lastEntry: undefined,
      week: 'W1',
      acwr: null,
      fatigueLevel: 'normal',
      isBodyweightProgram: true,
    })
    expect(r.suggestedWeight).toBeNull()
    expect(r.justification).toContain('Morphologie')
  })
})

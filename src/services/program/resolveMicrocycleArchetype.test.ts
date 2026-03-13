import { describe, expect, it } from 'vitest'
import type { SessionRecipeId } from '../../data/sessionRecipes.v1'
import { createProfile } from './testHelpers'
import { resolveMicrocycleArchetype } from './resolveMicrocycleArchetype'

describe('resolveMicrocycleArchetype', () => {
  it('orders in-season 3x performance weeks as lower -> upper -> third slot', () => {
    const profile = createProfile({
      trainingLevel: 'performance',
      seasonMode: 'in_season',
      weeklySessions: 3,
    })
    const recipeIds: SessionRecipeId[] = ['UPPER_V1', 'FULL_V1', 'LOWER_V1']

    const result = resolveMicrocycleArchetype(profile, 'W1', recipeIds)

    expect(result.archetypeId).toBe('IN_SEASON_3X_STD')
    expect(result.recipeIds).toEqual(['LOWER_V1', 'UPPER_V1', 'FULL_V1'])
  })

  it('returns UNKNOWN match offsets when no match context exists', () => {
    const profile = createProfile({
      clubSchedule: undefined,
      scSchedule: undefined,
    })
    const recipeIds: SessionRecipeId[] = ['LOWER_V1', 'UPPER_V1', 'FULL_V1']

    const result = resolveMicrocycleArchetype(profile, 'W1', recipeIds)

    expect(result.hasReliableMatchContext).toBe(false)
    expect(result.slots.map((slot) => slot.matchDayOffset)).toEqual([
      'UNKNOWN',
      'UNKNOWN',
      'UNKNOWN',
    ])
  })

  it('derives match offsets from profile schedule when match day is known', () => {
    const profile = createProfile({
      clubSchedule: { clubDays: [], matchDay: 6 },
      weeklySessions: 3,
    })
    const recipeIds: SessionRecipeId[] = ['LOWER_V1', 'UPPER_V1', 'FULL_V1']

    const result = resolveMicrocycleArchetype(profile, 'W1', recipeIds)

    expect(result.hasReliableMatchContext).toBe(true)
    expect(result.slots.map((slot) => slot.matchDayOffset)).toEqual([
      'MD-5',
      'MD-3',
      'MD-1',
    ])
  })
})


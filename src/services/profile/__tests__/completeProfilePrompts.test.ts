import { describe, expect, it } from 'vitest'
import { resolveCompleteProfileKind } from '../completeProfilePrompts'

describe('resolveCompleteProfileKind', () => {
  it('priorise le club, puis la morpho, puis le genre', () => {
    expect(resolveCompleteProfileKind({})).toBe('club')
    expect(resolveCompleteProfileKind({ clubCode: '5143R' })).toBe('morpho')
    expect(resolveCompleteProfileKind({
      clubCode: '5143R',
      heightCm: 180,
      weightKg: 90,
    })).toBe('gender')
    expect(resolveCompleteProfileKind({
      clubCode: '5143R',
      heightCm: 180,
      weightKg: 90,
      populationSegment: 'male_senior',
    })).toBeNull()
  })

  it('respecte les dismiss et ignore un club vide', () => {
    expect(resolveCompleteProfileKind({
      clubCode: '   ',
      dismissed: { club: true },
    })).toBe('morpho')
    expect(resolveCompleteProfileKind({
      clubCode: '5143R',
      heightCm: 180,
      weightKg: 90,
      populationSegment: 'unknown',
      dismissed: { gender: true },
    })).toBeNull()
  })
})

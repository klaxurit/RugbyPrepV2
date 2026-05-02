import { describe, it, expect } from 'vitest'
import { parseBlockTourCount, parseExerciseSets } from '../blockPresentation'
import type { Block } from '../../../types/motherSession'

function block(format: string, exercises: Array<{ name: string; prescription: string }>): Block {
  return {
    number: 1,
    type: 'main',
    name: 'test',
    format,
    exercises,
  } as unknown as Block
}

describe('parseExerciseSets', () => {
  it('parses leading "Nx" or "N×" set count', () => {
    expect(parseExerciseSets('3x10-12')).toBe(3)
    expect(parseExerciseSets('3×10-12')).toBe(3)
    expect(parseExerciseSets('2x12-15')).toBe(2)
    expect(parseExerciseSets(' 4 × 5 @ 80% ')).toBe(4)
  })

  it('returns null when no leading count is present', () => {
    expect(parseExerciseSets('10-12 reps')).toBeNull()
    expect(parseExerciseSets('AMRAP 60s')).toBeNull()
    expect(parseExerciseSets('')).toBeNull()
  })
})

describe('parseBlockTourCount — picks the MAX exo set count', () => {
  it('takes the max so optional 2× exos at the end do not shrink the block', () => {
    // Real shape of the "Arms / Shoulder Support" block.
    const b = block('', [
      { name: 'Hammer Curl', prescription: '3x10-12' },
      { name: 'Rope Pressdown', prescription: '3x10-12' },
      { name: 'Face Pull', prescription: '3x12-15' },
      { name: 'Lateral Raise', prescription: '2x12-15' },
      { name: 'T-Y-I Incline Bench', prescription: '2x10' },
    ])
    expect(parseBlockTourCount(b)).toBe(3)
  })

  it('still respects an explicit "N rounds" format if present', () => {
    const b = block('`4 rounds`, `90-120s` rest', [
      { name: 'Squat', prescription: '5 reps' },
      { name: 'Box jump', prescription: '5 reps' },
    ])
    expect(parseBlockTourCount(b)).toBe(4)
  })

  it('falls back to 3 when nothing parseable is present', () => {
    const b = block('', [{ name: 'Plank', prescription: '60s' }])
    expect(parseBlockTourCount(b)).toBe(3)
  })

  it('handles exos with shorter set count first (max wins regardless of order)', () => {
    const b = block('', [
      { name: 'Lateral Raise', prescription: '2x12-15' },
      { name: 'Hammer Curl', prescription: '3x10-12' },
    ])
    expect(parseBlockTourCount(b)).toBe(3)
  })
})

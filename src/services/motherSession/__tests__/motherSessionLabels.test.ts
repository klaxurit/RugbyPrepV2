import { describe, expect, it } from 'vitest'
import { stripBackticks } from '../motherSessionLabels'

describe('motherSessionLabels.stripBackticks', () => {
  it('collapses visible ranges to their upper bound', () => {
    expect(stripBackticks('`2-3 tours`, `60-90s` de repos')).toBe('3 tours, 60-90s de repos')
    expect(stripBackticks('2-3x4-5')).toBe('3x5')
    expect(stripBackticks('1x15-20s/côté')).toBe('1x20s/côté')
    expect(stripBackticks('2-3 progressive ramp-up sets')).toBe('3 progressive ramp-up sets')
  })

  it('does not break shuttle-style names or week ranges', () => {
    expect(stripBackticks('5-10-5 Shuttle')).toBe('5-10-5 Shuttle')
    expect(stripBackticks('W5-W6 = 4 rounds')).toBe('W5-W6 = 4 rounds')
    expect(stripBackticks('3 rounds, 90-120s rest after the pair')).toBe('3 rounds, 90-120s rest after the pair')
  })
})

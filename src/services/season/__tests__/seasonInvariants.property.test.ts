import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

describe('B4 property test scaffold', () => {
  it('fast-check is wired up', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => n + 0 === n),
      { numRuns: 10 },
    )
    expect(true).toBe(true)
  })
})

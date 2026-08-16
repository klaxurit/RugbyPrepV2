import { describe, expect, it } from 'vitest'
import { plannedSessionCardStats } from '../plannedSessionCardStats'

const slot = (over: {
  blockCount?: number
  duration?: string
  maxBlocks?: number
  variant?: 'normal' | 'light'
}) => ({
  session: {
    blocks: Array.from({ length: over.blockCount ?? 5 }, () => ({})),
    metadata: { targetDuration: over.duration ?? '60-66 min' },
  },
  maxBlocks: over.maxBlocks,
  variant: over.variant,
})

describe('plannedSessionCardStats', () => {
  it('sans coupe : blocs et durée mother', () => {
    expect(plannedSessionCardStats(slot({}))).toEqual({
      blocs: 5,
      durationMin: 63,
      isLight: false,
    })
  })

  it('club dur : 3 blocs, durée au prorata, allégée', () => {
    expect(
      plannedSessionCardStats(slot({ maxBlocks: 3, variant: 'light' })),
    ).toEqual({
      blocs: 3,
      durationMin: 38,
      isLight: true,
    })
  })
})

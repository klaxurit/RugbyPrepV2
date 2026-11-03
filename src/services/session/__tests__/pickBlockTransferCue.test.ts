import { describe, expect, it } from 'vitest'
import { pickBlockTransferCue } from '../pickBlockTransferCue'

describe('pickBlockTransferCue', () => {
  it('préfère une note avec mot rugby / transfert', () => {
    const cue = pickBlockTransferCue([
      'Tempo 3-1-1, RER 1-2, full ROM.',
      'Transfert mêlée — push horizontal qualité.',
      'Couper si fatigue club.',
    ])
    expect(cue).toMatch(/mêlée/i)
  })

  it('tronque les notes trop longues', () => {
    const long = 'a'.repeat(200)
    const cue = pickBlockTransferCue([long], 40)
    expect(cue?.length).toBeLessThanOrEqual(40)
    expect(cue?.endsWith('…')).toBe(true)
  })

  it('null si pas de notes', () => {
    expect(pickBlockTransferCue([])).toBeNull()
    expect(pickBlockTransferCue(null)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import {
  BLOC_POSITION_BACK_THREE,
  BLOC_POSITION_FRONT_ROW,
  getPositionAccentBlock,
} from '../positionAccentRegistry'

describe('positionAccentRegistry', () => {
  it('front_row inclut nuque + adducteurs + carry', () => {
    const ids = BLOC_POSITION_FRONT_ROW.slots.map((s) => s.slotId)
    expect(ids).toContain('neck_flexion')
    expect(ids).toContain('neck_extension')
    expect(ids).toContain('adductors')
    expect(ids).toContain('carry_contact')
  })

  it('back_three inclut COD + trunk + pull', () => {
    const ids = BLOC_POSITION_BACK_THREE.slots.map((s) => s.slotId)
    expect(ids).toContain('cod_speed')
    expect(ids).toContain('trunk_anti_rot')
    expect(ids).toContain('pull_tackle')
    expect(ids).not.toContain('neck_flexion')
  })

  it('getPositionAccentBlock retourne le bon bloc', () => {
    expect(getPositionAccentBlock('front_row').id).toBe('BLOC_POSITION_FRONT_ROW')
    expect(getPositionAccentBlock('back_three').id).toBe('BLOC_POSITION_BACK_THREE')
  })
})

import { describe, expect, it } from 'vitest'
import {
  BLOC_POSITION_BACK_ROW,
  BLOC_POSITION_BACK_THREE,
  BLOC_POSITION_CENTERS,
  BLOC_POSITION_FRONT_ROW,
  BLOC_POSITION_HALF_BACKS,
  BLOC_POSITION_HOOKER,
  BLOC_POSITION_PROP,
  BLOC_POSITION_SECOND_ROW,
  filterPositionAccentSlots,
  getPositionAccentBlock,
  getPositionAccentBlockForRugbyPosition,
  resolvePositionAccentPackId,
  toPlanningPositionGroup,
} from '../positionAccentRegistry'

describe('positionAccentRegistry', () => {
  it('PROP : push Upper, farmer Lower', () => {
    const ids = BLOC_POSITION_PROP.slots.map((s) => s.slotId)
    expect(ids).toContain('neck_triplanar')
    expect(ids).toContain('adductors')
    expect(ids).toContain('scrum_push')
    expect(ids).toContain('carry_contact')
    expect(BLOC_POSITION_PROP.slots.find((s) => s.slotId === 'scrum_push')?.onlySessionTypes).toEqual([
      'upper',
    ])
    expect(BLOC_POSITION_PROP.slots.find((s) => s.slotId === 'carry_contact')?.onlySessionTypes).toEqual([
      'lower',
    ])

    const upper = filterPositionAccentSlots(BLOC_POSITION_PROP, {
      skipNeck: true,
      sessionType: 'upper',
    })
    expect(upper.map((s) => s.slotId)).toEqual(['adductors', 'scrum_push'])

    const lower = filterPositionAccentSlots(BLOC_POSITION_PROP, {
      skipNeck: true,
      sessionType: 'lower',
    })
    expect(lower.map((s) => s.slotId)).toEqual(['adductors', 'carry_contact'])
  })

  it('HOOKER inclut diamant + chaise + pike', () => {
    const ids = BLOC_POSITION_HOOKER.slots.map((s) => s.slotId)
    expect(ids).toContain('lineout_lockout')
    expect(ids).toContain('lineout_extension')
    expect(ids).toContain('lineout_overhead')
    expect(BLOC_POSITION_HOOKER.slots.find((s) => s.slotId === 'lineout_lockout')?.exerciseIds[0]).toBe(
      'push_horizontal__push_up__diamond',
    )
    expect(
      BLOC_POSITION_HOOKER.slots.find((s) => s.slotId === 'lineout_extension')?.exerciseIds[0],
    ).toBe('arm_extension__triceps_chair__bodyweight')
  })

  it('SECOND_ROW : saut Lower seulement, adducteurs Upper', () => {
    const ids = BLOC_POSITION_SECOND_ROW.slots.map((s) => s.slotId)
    expect(ids).toContain('maul_grip')
    expect(ids).toContain('lineout_jump')
    expect(ids).toContain('adductors_upper')
    expect(
      BLOC_POSITION_SECOND_ROW.slots.find((s) => s.slotId === 'lineout_jump')?.onlySessionTypes,
    ).toEqual(['lower'])
    expect(
      BLOC_POSITION_SECOND_ROW.slots.find((s) => s.slotId === 'adductors_upper')?.onlySessionTypes,
    ).toEqual(['upper'])
  })

  it('BACK_THREE : pull+T Upper, bound+sprint Lower', () => {
    const ids = BLOC_POSITION_BACK_THREE.slots.map((s) => s.slotId)
    expect(ids).toContain('pull_tackle')
    expect(ids).toContain('push_rot_upper')
    expect(ids).toContain('cod_speed')
    expect(ids).toContain('sprint_prep')

    const upper = filterPositionAccentSlots(BLOC_POSITION_BACK_THREE, {
      skipNeck: true,
      sessionType: 'upper',
    })
    expect(upper.map((s) => s.slotId)).toEqual([
      'pull_tackle',
      'trunk_anti_rot',
      'push_rot_upper',
    ])

    const lower = filterPositionAccentSlots(BLOC_POSITION_BACK_THREE, {
      skipNeck: true,
      sessionType: 'lower',
    })
    expect(lower.map((s) => s.slotId)).toEqual(['cod_speed', 'sprint_prep'])
  })

  it('HALF_BACKS / CENTERS / BACK_ROW split Upper-Lower', () => {
    expect(
      filterPositionAccentSlots(BLOC_POSITION_HALF_BACKS, {
        skipNeck: true,
        sessionType: 'upper',
      }).map((s) => s.slotId),
    ).toEqual(['trunk_anti_rot', 'trunk_rotation', 'pull_light'])

    expect(
      filterPositionAccentSlots(BLOC_POSITION_HALF_BACKS, {
        skipNeck: true,
        sessionType: 'lower',
      }).map((s) => s.slotId),
    ).toEqual(['cod_speed', 'lunge_explosive'])

    expect(
      filterPositionAccentSlots(BLOC_POSITION_CENTERS, {
        skipNeck: true,
        sessionType: 'upper',
      }).map((s) => s.slotId),
    ).toEqual(['push_unilat', 'pull_tackle', 'trunk_anti_rot'])

    expect(
      filterPositionAccentSlots(BLOC_POSITION_CENTERS, {
        skipNeck: true,
        sessionType: 'lower',
      }).map((s) => s.slotId),
    ).toEqual(['cod_bound', 'lunge_carry'])

    expect(
      filterPositionAccentSlots(BLOC_POSITION_BACK_ROW, {
        skipNeck: true,
        sessionType: 'upper',
      }).map((s) => s.slotId),
    ).toEqual(['pull_tackle', 'push_rot_upper', 'carry_iso_upper'])

    expect(
      filterPositionAccentSlots(BLOC_POSITION_BACK_ROW, {
        skipNeck: true,
        sessionType: 'lower',
      }).map((s) => s.slotId),
    ).toEqual(['carry_contact', 'cod_speed'])
  })

  it('legacy FRONT_ROW → pack PROP', () => {
    expect(resolvePositionAccentPackId('FRONT_ROW')).toBe('PROP')
    expect(getPositionAccentBlockForRugbyPosition('FRONT_ROW')?.id).toBe('BLOC_POSITION_PROP')
  })

  it('toPlanningPositionGroup mappe avants / arrières', () => {
    expect(toPlanningPositionGroup('HOOKER')).toBe('front_row')
    expect(toPlanningPositionGroup('SECOND_ROW')).toBe('front_row')
    expect(toPlanningPositionGroup('HALF_BACKS')).toBe('back_three')
  })

  it('getPositionAccentBlock (legacy binôme) reste stable', () => {
    expect(getPositionAccentBlock('front_row').id).toBe(BLOC_POSITION_FRONT_ROW.id)
    expect(getPositionAccentBlock('back_three').id).toBe(BLOC_POSITION_BACK_THREE.id)
  })

  it('filterPositionAccentSlots : HOOKER sans nuque → diamant + chaise + pike', () => {
    const slots = filterPositionAccentSlots(BLOC_POSITION_HOOKER, {
      skipNeck: true,
      sessionType: 'upper',
    })
    expect(slots.map((s) => s.slotId)).toEqual([
      'lineout_lockout',
      'lineout_extension',
      'lineout_overhead',
    ])
  })

  it('filterPositionAccentSlots : SECOND_ROW upper vs lower', () => {
    const upper = filterPositionAccentSlots(BLOC_POSITION_SECOND_ROW, {
      skipNeck: true,
      sessionType: 'upper',
    })
    expect(upper.map((s) => s.slotId)).toEqual(['maul_grip', 'adductors_upper'])

    const lower = filterPositionAccentSlots(BLOC_POSITION_SECOND_ROW, {
      skipNeck: true,
      sessionType: 'lower',
    })
    expect(lower.map((s) => s.slotId)).toEqual(['maul_grip', 'lineout_jump'])
  })
})

import { describe, expect, it } from 'vitest'
import {
  alternatePositionAccentTheme,
  resolveEffectiveAccentTheme,
  resolvePositionAccentTheme,
} from '../positionAccentTheme'
import {
  BLOC_POSITION_PROP,
  BLOC_POSITION_SECOND_ROW,
  filterPositionAccentSlots,
  pickPositionAccentExerciseId,
} from '../positionAccentRegistry'

describe('positionAccentTheme', () => {
  it('W1 contact · W2 power · W3 skill · W4 null', () => {
    expect(resolvePositionAccentTheme(1)).toBe('contact')
    expect(resolvePositionAccentTheme(2)).toBe('power')
    expect(resolvePositionAccentTheme(3)).toBe('skill')
    expect(resolvePositionAccentTheme(4)).toBeNull()
  })

  it('focus B bascule vers le thème complémentaire', () => {
    expect(resolveEffectiveAccentTheme(1, 'a')).toBe('contact')
    expect(resolveEffectiveAccentTheme(1, 'b')).toBe('power')
    expect(alternatePositionAccentTheme('skill')).toBe('contact')
  })

  it('PROP Lower salle → sled push (priorité pack, hors variante thématique)', () => {
    const carry = BLOC_POSITION_PROP.slots.find((s) => s.slotId === 'carry_contact')!
    expect(pickPositionAccentExerciseId(carry, 'full_gym')).toBe('sled__push__standard')
  })

  it('filtre priorise les slots tagués power (SECOND_ROW Lower)', () => {
    const powerFirst = filterPositionAccentSlots(BLOC_POSITION_SECOND_ROW, {
      skipNeck: true,
      sessionType: 'lower',
      theme: 'power',
    })
    expect(powerFirst.map((s) => s.slotId)[0]).toBe('lineout_jump')

    const contactFirst = filterPositionAccentSlots(BLOC_POSITION_SECOND_ROW, {
      skipNeck: true,
      sessionType: 'lower',
      theme: 'contact',
    })
    expect(contactFirst.map((s) => s.slotId)[0]).toBe('maul_grip')
  })
})

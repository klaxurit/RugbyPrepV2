import { describe, expect, it } from 'vitest'
import type { MotherSession } from '../../../types/motherSession'
import { BLOC_POSITION_BACK_ROW } from '../../equipment/positionAccentRegistry'
import {
  bumpEmomFormatByOneMinute,
  findEmomFinisherBlockIndex,
  mergeContactAccentIntoFinisher,
} from '../mergeContactAccentIntoFinisher'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'

describe('bumpEmomFormatByOneMinute', () => {
  it('passe EMOM 8′ → 9′ en conservant les backticks', () => {
    expect(bumpEmomFormatByOneMinute("`EMOM 8'`")).toBe("`EMOM 9'`")
  })

  it('refuse un format non-EMOM', () => {
    expect(bumpEmomFormatByOneMinute('3 rounds')).toBeNull()
  })
})

describe('mergeContactAccentIntoFinisher', () => {
  it('trouve le Finisher EMOM 2-exos', () => {
    const raw = MOTHER_SESSIONS_BY_ID.UPPER_IN_SEASON_FRONT_ROW_V1
    expect(raw).toBeTruthy()
    expect(findEmomFinisherBlockIndex(raw!.blocks)).toBeGreaterThanOrEqual(0)
  })

  it('BACK_ROW Contact : ajoute minute 3 et EMOM 9′, sans Accent séparé', () => {
    const raw = structuredClone(
      MOTHER_SESSIONS_BY_ID.UPPER_IN_SEASON_FRONT_ROW_V1!,
    ) as MotherSession
    const before = raw.blocks.length
    const out = mergeContactAccentIntoFinisher(raw, {
      accent: BLOC_POSITION_BACK_ROW,
      mode: 'full_gym',
      skipNeck: true,
      lang: 'fr',
    })
    expect(out).not.toBeNull()
    expect(out!.blocks.length).toBe(before)
    const finisher = out!.blocks.find((b) => /finisher/i.test(b.name))
    expect(finisher?.format).toMatch(/EMOM\s*9/i)
    expect(finisher?.exercises).toHaveLength(3)
    expect(finisher?.exercises[2]?.slotLabel).toBe('minute 3')
    expect(finisher?.exercises[2]?.exerciseId).toBeTruthy()
  })
})

import { describe, expect, it } from 'vitest'
import type { MotherSession } from '../../../types/motherSession'
import { applyPositionAccentBlock } from '../applyPositionAccentBlock'
import { applyNeckIsometricBlock } from '../applyNeckIsometricBlock'
import { prepareSessionForRender } from '../prepareSessionForRender'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'

function baseUpperBwHyp(): MotherSession {
  const raw = MOTHER_SESSIONS_BY_ID.UPPER_BW_OFFSEASON_HYPERTROPHY_V1
  if (!raw) throw new Error('missing UPPER_BW_OFFSEASON_HYPERTROPHY_V1')
  return structuredClone(raw)
}

describe('applyPositionAccentBlock', () => {
  it('ajoute un bloc HOOKER sans retirer les blocs existants', () => {
    const s = baseUpperBwHyp()
    const before = s.blocks.length
    // W1 contact : nuque prioritaire → nuque + diamant + chaise (pike hors cap)
    const out = applyPositionAccentBlock(s, {
      rugbyPosition: 'HOOKER',
      mesoWeek: 1,
      trainingLevel: 'performance',
      lang: 'fr',
    })
    expect(out.blocks.length).toBe(before + 1)
    expect(out.blocks.slice(0, before)).toEqual(s.blocks)
    const accent = out.blocks[out.blocks.length - 1]
    expect(accent?.name).toMatch(/Accent poste/i)
    expect(accent?.isOptional).toBe(true)
    const ids = accent?.exercises.map((e) => e.exerciseId) ?? []
    expect(ids).toContain('push_horizontal__push_up__diamond')
    expect(ids).toContain('arm_extension__triceps_chair__bodyweight')
    expect(ids.some((id) => id?.includes('pike'))).toBe(false)
  })

  it('HOOKER avec cou déjà là → diamant + chaise + pike', () => {
    const withNeck = applyNeckIsometricBlock(baseUpperBwHyp(), {
      mesoWeek: 1,
      trainingLevel: 'performance',
      lang: 'fr',
    })
    // W1 + cou déjà là : les 3 slots skill/lockout restent
    const out = applyPositionAccentBlock(withNeck, {
      rugbyPosition: 'HOOKER',
      mesoWeek: 1,
      trainingLevel: 'performance',
      lang: 'fr',
    })
    const accent = out.blocks[out.blocks.length - 1]
    const ids = accent?.exercises.map((e) => e.exerciseId) ?? []
    expect(ids).toContain('push_horizontal__push_up__diamond')
    expect(ids).toContain('arm_extension__triceps_chair__bodyweight')
    expect(ids).toContain('push_vertical__pike_push_up__bodyweight')
  })

  it('omet les slots nuque si le mini-bloc cou est déjà là', () => {
    const withNeck = applyNeckIsometricBlock(baseUpperBwHyp(), {
      mesoWeek: 2,
      trainingLevel: 'performance',
      lang: 'fr',
    })
    const out = applyPositionAccentBlock(withNeck, {
      rugbyPosition: 'PROP',
      mesoWeek: 2,
      trainingLevel: 'performance',
      lang: 'fr',
    })
    const accent = out.blocks[out.blocks.length - 1]
    const ids = accent?.exercises.map((e) => e.exerciseId) ?? []
    expect(ids.some((id) => id?.startsWith('neck__'))).toBe(false)
    expect(ids.length).toBeGreaterThan(0)
  })

  it('ignore starter / deload', () => {
    const s = baseUpperBwHyp()
    expect(
      applyPositionAccentBlock(s, {
        rugbyPosition: 'HOOKER',
        mesoWeek: 2,
        trainingLevel: 'starter',
      }),
    ).toBe(s)
    expect(
      applyPositionAccentBlock(s, {
        rugbyPosition: 'HOOKER',
        mesoWeek: 4,
        trainingLevel: 'performance',
      }),
    ).toBe(s)
  })

  it('couvre Transition → In-season Upper + Lower BW', () => {
    const ids = [
      'UPPER_BW_OFFSEASON_TRANSITION_V1',
      'UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1',
      'UPPER_BW_PRESEASON_FORCE_V1',
      'UPPER_BW_PRESEASON_FORCE_POWER_V1',
      'UPPER_BW_PRESEASON_POWER_V1',
      'UPPER_BW_IN_SEASON_V1',
      'LOWER_BW_OFFSEASON_TRANSITION_V1',
      'LOWER_BW_OFFSEASON_HYPERTROPHY_V1',
      'LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1',
      'LOWER_BW_PRESEASON_FORCE_V1',
      'LOWER_BW_PRESEASON_FORCE_POWER_V1',
      'LOWER_BW_PRESEASON_POWER_V1',
      'LOWER_BW_IN_SEASON_V1',
    ] as const
    for (const id of ids) {
      const raw = MOTHER_SESSIONS_BY_ID[id]
      expect(raw, id).toBeTruthy()
      const out = applyPositionAccentBlock(structuredClone(raw!), {
        rugbyPosition: 'PROP',
        mesoWeek: 2,
        trainingLevel: 'builder',
        lang: 'fr',
      })
      expect(out.blocks.length, id).toBe(raw!.blocks.length + 1)
    }
  })

  it('prepareSessionForRender SECOND_ROW Upper → poigne + adducteurs (pas de saut)', () => {
    const prepared = prepareSessionForRender({
      session: baseUpperBwHyp(),
      trainingLevel: 'performance',
      equipment: ['none'],
      lang: 'fr',
      mesocycleWeek: 1,
      rugbyPosition: 'SECOND_ROW',
    })
    const accent = prepared.blocks.find((b) => /Accent poste/i.test(b.name))
    expect(accent).toBeTruthy()
    const ids = accent?.exercises.map((e) => e.exerciseId) ?? []
    expect(ids).toContain('grip__towel_isometric__bodyweight')
    expect(ids.some((id) => id?.includes('copenhagen') || id?.includes('supine_squeeze'))).toBe(
      true,
    )
    expect(ids.some((id) => id?.includes('jump'))).toBe(false)
  })

  it('SECOND_ROW Lower → poigne + saut vertical', () => {
    const lower = MOTHER_SESSIONS_BY_ID.LOWER_BW_OFFSEASON_HYPERTROPHY_V1
    expect(lower).toBeTruthy()
    const out = applyPositionAccentBlock(structuredClone(lower!), {
      rugbyPosition: 'SECOND_ROW',
      mesoWeek: 1,
      trainingLevel: 'builder',
      lang: 'fr',
    })
    const accent = out.blocks[out.blocks.length - 1]
    const ids = accent?.exercises.map((e) => e.exerciseId) ?? []
    expect(ids).toContain('grip__towel_isometric__bodyweight')
    expect(ids).toContain('power__jump__vertical_jump')
  })

  it('salle HOOKER Upper → dips + skull crusher (pas chaise BW)', () => {
    const raw = MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_HYPERTROPHY_V1
    expect(raw).toBeTruthy()
    const withNeck = applyNeckIsometricBlock(structuredClone(raw!), {
      mesoWeek: 1,
      trainingLevel: 'performance',
      lang: 'fr',
    })
    const out = applyPositionAccentBlock(withNeck, {
      rugbyPosition: 'HOOKER',
      mesoWeek: 1,
      trainingLevel: 'performance',
      lang: 'fr',
    })
    const accent = out.blocks[out.blocks.length - 1]
    const ids = accent?.exercises.map((e) => e.exerciseId) ?? []
    expect(ids).toContain('push_horizontal__dip__parallel')
    expect(ids).toContain('arm_extension__skull_crusher__ez_bar')
    expect(ids).toContain('push_vertical__overhead_press__barbell')
    expect(ids).not.toContain('arm_extension__triceps_chair__bodyweight')
  })

  it('salle SECOND_ROW Lower → farmer hold + box jump', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_OFFSEASON_HYPERTROPHY_V1
    expect(raw).toBeTruthy()
    const out = applyPositionAccentBlock(structuredClone(raw!), {
      rugbyPosition: 'SECOND_ROW',
      mesoWeek: 1,
      trainingLevel: 'builder',
      lang: 'fr',
    })
    const accent = out.blocks[out.blocks.length - 1]
    const ids = accent?.exercises.map((e) => e.exerciseId) ?? []
    expect(ids).toContain('carry__farmer_hold__dumbbell')
    expect(ids).toContain('power__jump__box_jump')
  })

  it('theme-week W1 PROP Lower salle → sled push ; focus B change le libellé', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_OFFSEASON_HYPERTROPHY_V1
    expect(raw).toBeTruthy()
    const a = applyPositionAccentBlock(structuredClone(raw!), {
      rugbyPosition: 'PROP',
      mesoWeek: 1,
      trainingLevel: 'builder',
      lang: 'fr',
      positionAccentFocus: 'a',
    })
    const accentA = a.blocks[a.blocks.length - 1]
    expect(accentA?.name).toMatch(/Contact/i)
    expect(accentA?.exercises.some((e) => e.exerciseId === 'sled__push__standard')).toBe(true)

    const b = applyPositionAccentBlock(structuredClone(raw!), {
      rugbyPosition: 'PROP',
      mesoWeek: 1,
      trainingLevel: 'builder',
      lang: 'fr',
      positionAccentFocus: 'b',
    })
    const accentB = b.blocks[b.blocks.length - 1]
    expect(accentB?.name).toMatch(/Puissance/i)
  })

  it('couvre les 35 Upper/Lower full_gym du cycle (dont BACK_THREE)', () => {
    const ids = [
      'UPPER_OFFSEASON_TRANSITION_V1',
      'UPPER_OFFSEASON_HYPERTROPHY_V1',
      'UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
      'UPPER_OFFSEASON_FORCE_BRIDGE_V1',
      'UPPER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1',
      'UPPER_PRESEASON_FORCE_V1',
      'UPPER_PRESEASON_FORCE_POWER_V1',
      'UPPER_PRESEASON_POWER_FRONT_ROW_V1',
      'UPPER_PRESEASON_POWER_BACK_THREE_V1',
      'UPPER_IN_SEASON_FRONT_ROW_V1',
      'UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1',
      'UPPER_IN_SEASON_FRONT_ROW_SUPINE_V1',
      'UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1',
      'UPPER_IN_SEASON_BACK_THREE_V1',
      'UPPER_IN_SEASON_BACK_THREE_LANDMINE_V1',
      'UPPER_IN_SEASON_BACK_THREE_PLYO_V1',
      'UPPER_IN_SEASON_BACK_THREE_PUSHPRESS_V1',
      'UPPER_IN_SEASON_BACK_THREE_ROTATIONAL_V1',
      'LOWER_OFFSEASON_TRANSITION_V1',
      'LOWER_OFFSEASON_HYPERTROPHY_V1',
      'LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
      'LOWER_OFFSEASON_FORCE_BRIDGE_V1',
      'LOWER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1',
      'LOWER_PRESEASON_FORCE_V1',
      'LOWER_PRESEASON_FORCE_POWER_V1',
      'LOWER_PRESEASON_POWER_FRONT_ROW_V1',
      'LOWER_PRESEASON_POWER_BACK_THREE_V1',
      'LOWER_IN_SEASON_FRONT_ROW_V1',
      'LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1',
      'LOWER_IN_SEASON_FRONT_ROW_PAUSEJUMP_V1',
      'LOWER_IN_SEASON_FRONT_ROW_TBRDL_V1',
      'LOWER_IN_SEASON_BACK_THREE_V1',
      'LOWER_IN_SEASON_BACK_THREE_RDL_V1',
      'LOWER_IN_SEASON_BACK_THREE_SHRUG_V1',
      'LOWER_IN_SEASON_BACK_THREE_SLHIP_V1',
    ] as const
    expect(ids).toHaveLength(35)
    for (const id of ids) {
      const raw = MOTHER_SESSIONS_BY_ID[id]
      expect(raw, id).toBeTruthy()
      expect(raw!.metadata.equipment).toBe('full_gym')
      const out = applyPositionAccentBlock(structuredClone(raw!), {
        rugbyPosition: id.includes('BACK_THREE') ? 'BACK_THREE' : 'PROP',
        mesoWeek: 2,
        trainingLevel: 'builder',
        lang: 'fr',
      })
      expect(out.blocks.length, id).toBe(raw!.blocks.length + 1)
    }
  })

  it('ne branche pas Primer / Recovery', () => {
    const primer = MOTHER_SESSIONS_BY_ID.FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1
    expect(primer).toBeTruthy()
    const clone = structuredClone(primer!)
    const out = applyPositionAccentBlock(clone, {
      rugbyPosition: 'PROP',
      mesoWeek: 2,
      trainingLevel: 'builder',
    })
    expect(out).toBe(clone)
  })

  it('Full hors match → accent allégé (≤2 slots)', () => {
    const full = MOTHER_SESSIONS_BY_ID.FULL_BODY_IN_SEASON_FRONT_ROW_V1
    expect(full).toBeTruthy()
    const out = applyPositionAccentBlock(structuredClone(full!), {
      rugbyPosition: 'PROP',
      mesoWeek: 1,
      trainingLevel: 'builder',
      lang: 'fr',
    })
    const accent = out.blocks[out.blocks.length - 1]
    expect(accent?.name).toMatch(/Accent poste/i)
    expect(accent?.exercises.length).toBeLessThanOrEqual(2)
  })

  it('Full en semaine de match → pas d’accent', () => {
    const full = MOTHER_SESSIONS_BY_ID.FULL_BODY_IN_SEASON_FRONT_ROW_V1
    const clone = structuredClone(full!)
    const out = applyPositionAccentBlock(clone, {
      rugbyPosition: 'PROP',
      mesoWeek: 1,
      trainingLevel: 'builder',
      isMatchWeek: true,
    })
    expect(out).toBe(clone)
  })
})

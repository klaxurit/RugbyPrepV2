import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { applyPackPorteurAdaptation } from '../applyPackPorteurAdaptation'
import { prepareSessionForRender } from '../prepareSessionForRender'

describe('applyPackPorteurAdaptation', () => {
  it('no-op pour front_row family', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_PRESEASON_POWER_FRONT_ROW_V1
    const out = applyPackPorteurAdaptation(structuredClone(raw!), {
      contentFamily: 'front_row',
      lang: 'fr',
    })
    expect(out.blocks[0]?.exercises[0]?.name).toMatch(/Box Squat/i)
  })

  it('back_row pré Power lower : trap bar + broad, pas box squat / Zercher', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_PRESEASON_POWER_FRONT_ROW_V1
    const out = applyPackPorteurAdaptation(structuredClone(raw!), {
      contentFamily: 'back_row',
      lang: 'fr',
    })
    const names = out.blocks.flatMap((b) => b.exercises.map((e) => e.name)).join(' | ')
    expect(names).toMatch(/trap bar|Trap Bar/i)
    expect(names).toMatch(/Broad Jump/i)
    expect(names).not.toMatch(/Box Squat/i)
    expect(names).not.toMatch(/Zercher/i)
  })

  it('back_row Upper Power : Zercher → Farmer', () => {
    const raw = MOTHER_SESSIONS_BY_ID.UPPER_PRESEASON_POWER_FRONT_ROW_V1
    const out = applyPackPorteurAdaptation(structuredClone(raw!), {
      contentFamily: 'back_row',
      lang: 'en',
    })
    const names = out.blocks.flatMap((b) => b.exercises.map((e) => e.name)).join(' | ')
    expect(names).toMatch(/Farmer Carry/i)
    expect(names).not.toMatch(/Zercher/i)
  })

  it('primer back_row : retire neck du bloc confiance optionnel', () => {
    const raw = MOTHER_SESSIONS_BY_ID.FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1
    const out = applyPackPorteurAdaptation(structuredClone(raw!), {
      contentFamily: 'back_row',
      lang: 'en',
    })
    const opt = out.blocks.find((b) => /confidence|pump|contact/i.test(b.name))
    const neck = opt?.exercises.some((e) => /neck/i.test(e.name))
    expect(neck).toBe(false)
  })

  it('prepareSessionForRender branche porteur + garde accents ensuite', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_PRESEASON_POWER_FRONT_ROW_V1
    const prepared = prepareSessionForRender({
      session: structuredClone(raw!),
      trainingLevel: 'builder',
      equipment: ['barbell', 'dumbbell', 'bench', 'sprint_track'],
      lang: 'fr',
      mesocycleWeek: 1,
      contentFamily: 'back_row',
      rugbyPosition: 'BACK_ROW',
    })
    const names = prepared.blocks.flatMap((b) => b.exercises.map((e) => e.name)).join(' | ')
    expect(names).toMatch(/trap bar|Trap Bar|Soulevé/i)
    expect(prepared.blocks.some((b) => /Accent poste|3ème ligne/i.test(b.name))).toBe(true)
  })

  it('Full FRONT_ROW back_row : CMJ → split jump, neck → landmine, pas de neck residual', () => {
    const raw = MOTHER_SESSIONS_BY_ID.FULL_BODY_IN_SEASON_FRONT_ROW_V1
    const out = applyPackPorteurAdaptation(structuredClone(raw!), {
      contentFamily: 'back_row',
      lang: 'en',
    })
    const names = out.blocks.flatMap((b) => b.exercises.map((e) => e.name)).join(' | ')
    expect(names).toMatch(/Split Jump/i)
    expect(names).not.toMatch(/Countermovement Jump/i)
    expect(names).toMatch(/Landmine Rotation/i)
    expect(names).not.toMatch(/Neck/i)
    expect(out.blocks.some((b) => /Carrier pack|Pack porteur/i.test(b.name))).toBe(true)
  })

  it('Full B second_row : neck support retiré / swapé', () => {
    const raw = MOTHER_SESSIONS_BY_ID.FULL_BODY_IN_SEASON_FRONT_ROW_B_V1
    const out = applyPackPorteurAdaptation(structuredClone(raw!), {
      contentFamily: 'second_row',
      lang: 'en',
    })
    const names = out.blocks.flatMap((b) => b.exercises.map((e) => e.name)).join(' | ')
    expect(names).not.toMatch(/Neck/i)
    expect(names).toMatch(/Landmine Rotation/i)
  })

  it('Full front_row family : no-op (pilier garde neck)', () => {
    const raw = MOTHER_SESSIONS_BY_ID.FULL_BODY_IN_SEASON_FRONT_ROW_V1
    const out = applyPackPorteurAdaptation(structuredClone(raw!), {
      contentFamily: 'front_row',
      lang: 'en',
    })
    const names = out.blocks.flatMap((b) => b.exercises.map((e) => e.name)).join(' | ')
    expect(names).toMatch(/Neck/i)
  })
})

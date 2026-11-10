import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { applyContentFamilyCopyPolish } from '../applyContentFamilyCopyPolish'
import { prepareSessionForRender } from '../prepareSessionForRender'

describe('applyContentFamilyCopyPolish', () => {
  it('Lower BACK_ROW : Back Row Finisher → Finisher 3ème ligne', () => {
    const raw = structuredClone(MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_BACK_ROW_V1!)
    const out = applyContentFamilyCopyPolish(raw, { contentFamily: 'back_row', lang: 'fr' })
    expect(out.blocks.some((b) => b.name === 'Finisher 3ème ligne')).toBe(true)
  })

  it('prepareSessionForRender FR : Finisher 3ème ligne, pas Premières Lignes', () => {
    const prepared = prepareSessionForRender({
      session: structuredClone(MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_BACK_ROW_V1!),
      trainingLevel: 'builder',
      equipment: ['barbell', 'dumbbell', 'bench'],
      lang: 'fr',
      mesocycleWeek: 2,
      contentFamily: 'back_row',
      rugbyPosition: 'BACK_ROW',
    })
    const blob = [
      ...(prepared.goal ?? []),
      ...(prepared.sessionIdentity ?? []),
      ...prepared.blocks.map((b) => b.name),
      ...prepared.blocks.flatMap((b) => b.coachingNotes ?? []),
    ].join(' | ')
    expect(blob).not.toMatch(/front-row|premi[eè]res?\s+lignes?/i)
    expect(prepared.blocks.some((b) => b.name === 'Finisher 3ème ligne')).toBe(true)
  })

  it('sans contentFamily explicite : rugbyPosition BACK_ROW suffit (régression Plan A)', () => {
    const prepared = prepareSessionForRender({
      session: structuredClone(MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_BACK_ROW_V1!),
      trainingLevel: 'starter',
      equipment: ['barbell', 'dumbbell', 'bench', 'squat_rack'],
      lang: 'fr',
      mesocycleWeek: 1,
      rugbyPosition: 'BACK_ROW',
    })
    expect(prepared.blocks.some((b) => b.name === 'Finisher 3ème ligne')).toBe(true)
    const blob = prepared.blocks.map((b) => b.name).join(' | ')
    expect(blob).not.toMatch(/premi[eè]res?\s+lignes?/i)
  })

  it('front_row : Finisher Pack inchangé (pas de polish 3ème ligne)', () => {
    const prepared = prepareSessionForRender({
      session: structuredClone(MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_FRONT_ROW_V1!),
      trainingLevel: 'builder',
      equipment: ['barbell', 'dumbbell', 'bench'],
      lang: 'fr',
      contentFamily: 'front_row',
      rugbyPosition: 'FRONT_ROW',
    })
    expect(prepared.blocks.some((b) => b.name === 'Finisher Pack')).toBe(true)
    expect(prepared.blocks.some((b) => /3[eè]me ligne/i.test(b.name))).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { getWeeklyTemplate } from '../../../data/weeklyTemplates'
import { GYM_PRESET } from '../../equipment/equipmentPresets'
import { prepareSessionForRender } from '../prepareSessionForRender'
import { truncateSessionBlocks } from '../truncateSessionBlocks'

const gym = {
  trainingLevel: 'performance' as const,
  equipment: GYM_PRESET,
  lang: 'fr' as const,
}

describe('QA runtime prépa IA (hors saison / décharge / speed)', () => {
  it('Upper hyp off : mini-bloc cou optionnel, coupé en premier', () => {
    const prepared = prepareSessionForRender({
      session: MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_HYPERTROPHY_V1,
      ...gym,
      mesocycleWeek: 2,
    })
    const neck = prepared.blocks.find((b) => /Cou —|Neck isometrics/i.test(b.name))
    expect(neck?.isOptional).toBe(true)
    expect(prepared.metadata.reductionOrder?.[0]).toBe(neck?.number)

    const cut = truncateSessionBlocks(prepared, { maxBlocks: prepared.blocks.length - 1 })
    expect(cut.session.blocks.some((b) => /Cou —/i.test(b.name))).toBe(false)
  })

  it('Transition Lower off : farmer optionnel', () => {
    const prepared = prepareSessionForRender({
      session: MOTHER_SESSIONS_BY_ID.LOWER_OFFSEASON_TRANSITION_V1,
      ...gym,
      mesocycleWeek: 2,
    })
    const finisher = prepared.blocks.find((b) => /Finisher rugby/i.test(b.name))
    expect(finisher?.isOptional).toBe(true)
    expect(finisher?.exercises[0].exerciseId).toBe('carry__farmer_walk__dumbbell')
  })

  it('Lower hyp off : primes 5 séries, pas en décharge', () => {
    const w2 = prepareSessionForRender({
      session: MOTHER_SESSIONS_BY_ID.LOWER_OFFSEASON_HYPERTROPHY_V1,
      ...gym,
      mesocycleWeek: 2,
    })
    expect(w2.blocks[0].exercises[0].prescription).toMatch(/^5\s*[x×]/i)
    expect(w2.blocks[1].exercises[0].prescription).toMatch(/^5\s*[x×]/i)

    const deload = prepareSessionForRender({
      session: MOTHER_SESSIONS_BY_ID.LOWER_OFFSEASON_HYPERTROPHY_V1,
      ...gym,
      mesocycleWeek: 4,
    })
    expect(deload.blocks[0].exercises[0].prescription).toMatch(/^4\s*[x×]/i)
  })

  it('Lower in-season hors match : bloc force 4 séries ; match : 3', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_FRONT_ROW_V1
    const noMatch = prepareSessionForRender({
      session: raw,
      ...gym,
      mesocycleWeek: 2,
      isMatchWeek: false,
    })
    expect(noMatch.blocks[1].exercises[0].prescription).toMatch(/^4\s*[x×]/i)
    expect(noMatch.blocks[0].exercises[0].prescription).toMatch(/^4\s*[x×]/i)

    const match = prepareSessionForRender({
      session: raw,
      ...gym,
      mesocycleWeek: 2,
      isMatchWeek: true,
    })
    expect(match.blocks[1].exercises[0].prescription).toMatch(/^3\s*[x×]/i)
  })

  it('in-season 3× : pas de séance Speed (pré-saison seulement)', () => {
    const noMatch = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'front_row',
      matchContext: 'no_match_week',
      fatigueLevel: 'normal',
    })
    expect(noMatch.sessions.some((s) => s.sessionId.startsWith('SPEED_'))).toBe(false)

    const pre = getWeeklyTemplate({
      cycle: 'pre_season',
      frequency: 4,
      positionGroup: 'front_row',
      phase: 2,
      fatigueLevel: 'normal',
    })
    expect(pre.sessions.some((s) => s.sessionId.startsWith('SPEED_'))).toBe(true)
  })

  it('décharge : coupe de blocs, intensité % gardée', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_FRONT_ROW_V1
    const prepared = prepareSessionForRender({
      session: raw,
      ...gym,
      mesocycleWeek: 4,
      isDeloadWeek: true,
      isMatchWeek: true,
    })
    const cut = truncateSessionBlocks(prepared, { maxBlocks: 2, variant: 'light' })
    expect(cut.session.blocks.length).toBeLessThan(prepared.blocks.length)
    expect(cut.session.blocks[0].exercises[0].prescription).toMatch(/80-85%/)
  })
})

import { describe, expect, it } from 'vitest'
import type { Block, MotherSession } from '../../../types/motherSession'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { GYM_PRESET } from '../../equipment/equipmentPresets'
import { applyOptionalOffSeasonFinisher } from '../applyOptionalOffSeasonFinisher'
import { prepareSessionForRender } from '../prepareSessionForRender'
import { truncateSessionBlocks } from '../truncateSessionBlocks'

function block(number: number, name = 'Main'): Block {
  return {
    number,
    name: `Block ${number} ${name}`,
    format: '`3 rounds`',
    exercises: [{ name, prescription: '3x8' }],
    coachingNotes: [],
  }
}

function session(
  id: string,
  cycle: MotherSession['metadata']['cycle'],
  sessionType: MotherSession['metadata']['sessionType'],
  blocks: Block[],
): MotherSession {
  return {
    metadata: {
      id,
      status: 'validated',
      version: 'V1',
      cycle,
      sessionType,
      targetLevel: 'performance',
      targetPositionGroup: 'front_row',
      equipment: 'full_gym',
      targetDuration: '50 min',
      reductionOrder: [3, 2],
    },
    goal: [],
    sessionIdentity: [],
    warmUp: { exercises: [], notes: [] },
    blocks,
    progressionRules: [],
    positionAccent: [],
    injurySubstitutions: [],
    coachingWarnings: [],
    sourceReferences: [],
  }
}

describe('applyOptionalOffSeasonFinisher', () => {
  it('ajoute un farmer optionnel hors saison, coupé en premier', () => {
    const s = session('LOWER_OFFSEASON_TRANSITION_V1', 'off_season', 'lower', [
      block(1),
      block(2),
      block(3),
    ])
    const out = applyOptionalOffSeasonFinisher(s, {
      mesoWeek: 2,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
    })
    const finisher = out.blocks[out.blocks.length - 1]
    expect(finisher.name).toMatch(/Finisher/)
    expect(finisher.isOptional).toBe(true)
    expect(finisher.exercises).toHaveLength(1)
    expect(finisher.exercises[0].exerciseId).toBe('carry__farmer_walk__dumbbell')
    expect(finisher.exercises[0].prescription).toBe('2×20–30 s')
    expect(out.metadata.reductionOrder?.[0]).toBe(finisher.number)
  })

  it('sans haltères : sac à dos', () => {
    const s = session('LOWER_OFFSEASON_TRANSITION_V1', 'off_season', 'lower', [block(1)])
    const out = applyOptionalOffSeasonFinisher(s, {
      mesoWeek: 1,
      trainingLevel: 'performance',
      equipment: [],
      lang: 'fr',
    })
    expect(out.blocks.at(-1)?.exercises[0].exerciseId).toBe('carry__farmer_walk__backpack')
  })

  it('ignore in-season, décharge, starter, closer déjà là, séance trop longue', () => {
    const inSeason = session('LOWER_IN_SEASON_FRONT_ROW_V1', 'in_season', 'lower', [block(1)])
    expect(
      applyOptionalOffSeasonFinisher(inSeason, { mesoWeek: 2, trainingLevel: 'performance' }),
    ).toBe(inSeason)

    const off = session('LOWER_OFFSEASON_TRANSITION_V1', 'off_season', 'lower', [block(1)])
    expect(applyOptionalOffSeasonFinisher(off, { mesoWeek: 4, trainingLevel: 'performance' })).toBe(
      off,
    )
    expect(applyOptionalOffSeasonFinisher(off, { mesoWeek: 1, trainingLevel: 'starter' })).toBe(off)

    const withFinisher = session('FULL_OFFSEASON_HYPERTROPHY_V1', 'off_season', 'full', [
      block(1, 'Finisher Rugby'),
    ])
    expect(
      applyOptionalOffSeasonFinisher(withFinisher, { mesoWeek: 2, trainingLevel: 'performance' }),
    ).toBe(withFinisher)

    const long = session('UPPER_OFFSEASON_HYPERTROPHY_V1', 'off_season', 'upper', [
      block(1),
      block(2),
      block(3),
      block(4),
      block(5),
    ])
    expect(applyOptionalOffSeasonFinisher(long, { mesoWeek: 2, trainingLevel: 'performance' })).toBe(
      long,
    )
  })

  it('pipeline Transition Lower : farmer présent, truncate le retire en premier', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_OFFSEASON_TRANSITION_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 2,
    })
    const finisher = prepared.blocks.find((b) => /Finisher rugby/i.test(b.name))
    expect(finisher).toBeDefined()
    expect(finisher?.exercises[0].exerciseId).toBe('carry__farmer_walk__dumbbell')
    expect(prepared.metadata.reductionOrder?.[0]).toBe(finisher?.number)

    const cut = truncateSessionBlocks(prepared, { maxBlocks: prepared.blocks.length - 1 })
    expect(cut.droppedBlockNumbers).toContain(finisher!.number)
    expect(cut.session.blocks.some((b) => /Finisher rugby/i.test(b.name))).toBe(false)
  })

  it('pipeline Full hyp : pas de doublon (Finisher Rugby déjà là)', () => {
    const raw = MOTHER_SESSIONS_BY_ID.FULL_OFFSEASON_HYPERTROPHY_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 2,
    })
    const injected = prepared.blocks.filter((b) => b.name === 'Finisher rugby — portage')
    expect(injected).toHaveLength(0)
  })

  it('pipeline Lower hyp : skip (Optional Reward déjà là)', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_OFFSEASON_HYPERTROPHY_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 2,
    })
    expect(prepared.blocks.some((b) => b.name === 'Finisher rugby — portage')).toBe(false)
  })

  it('pipeline Upper transition : farmer avant le cou dans reductionOrder', () => {
    const raw = MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_TRANSITION_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 2,
    })
    const finisher = prepared.blocks.find((b) => /Finisher rugby/i.test(b.name))
    const neck = prepared.blocks.find((b) => b.name.includes('Cou'))
    expect(finisher).toBeDefined()
    expect(neck).toBeDefined()
    expect(prepared.metadata.reductionOrder?.[0]).toBe(finisher?.number)
    expect(prepared.metadata.reductionOrder?.[1]).toBe(neck?.number)
  })
})

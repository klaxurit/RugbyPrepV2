import { describe, expect, it } from 'vitest'
import type { Block, MotherSession } from '../../../types/motherSession'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { GYM_PRESET } from '../../equipment/equipmentPresets'
import { applyNeckIsometricBlock } from '../applyNeckIsometricBlock'
import { prepareSessionForRender } from '../prepareSessionForRender'
import { truncateSessionBlocks } from '../truncateSessionBlocks'

function block(number: number, name = 'Bench Press'): Block {
  return {
    number,
    name: `Block ${number}`,
    format: '`3 rounds`',
    exercises: [{ name, prescription: '3x8' }],
    coachingNotes: [],
  }
}

function session(id: string, sessionType: MotherSession['metadata']['sessionType'], blocks: Block[]): MotherSession {
  return {
    metadata: {
      id,
      status: 'validated',
      version: 'V1',
      cycle: 'in_season',
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

describe('applyNeckIsometricBlock', () => {
  it('ajoute un bloc optionnel en fin d’Upper, coupé en premier', () => {
    const s = session('UPPER_IN_SEASON_FRONT_ROW_V1', 'upper', [block(1), block(2)])
    const out = applyNeckIsometricBlock(s, { mesoWeek: 2, trainingLevel: 'performance', lang: 'fr' })
    const neck = out.blocks[out.blocks.length - 1]
    expect(neck.name).toMatch(/Cou/)
    expect(neck.isOptional).toBe(true)
    expect(neck.exercises).toHaveLength(3)
    expect(neck.exercises.every((e) => e.exerciseId?.startsWith('neck__'))).toBe(true)
    expect(out.metadata.reductionOrder?.[0]).toBe(neck.number)
  })

  it('ignore Lower, décharge, starter, et Upper déjà pourvu', () => {
    const lower = session('LOWER_IN_SEASON_FRONT_ROW_V1', 'lower', [block(1)])
    expect(applyNeckIsometricBlock(lower, { mesoWeek: 2, trainingLevel: 'performance' })).toBe(lower)

    const upper = session('UPPER_IN_SEASON_FRONT_ROW_V1', 'upper', [block(1)])
    expect(applyNeckIsometricBlock(upper, { mesoWeek: 4, trainingLevel: 'performance' })).toBe(upper)
    expect(applyNeckIsometricBlock(upper, { mesoWeek: 1, trainingLevel: 'starter' })).toBe(upper)

    const withNeck = session('UPPER_IN_SEASON_FRONT_ROW_V1', 'upper', [
      block(1, 'Banded Neck Isometric'),
    ])
    expect(applyNeckIsometricBlock(withNeck, { mesoWeek: 2, trainingLevel: 'performance' })).toBe(
      withNeck,
    )
  })

  it('pipeline Upper hyp : bloc cou présent, truncate le retire en premier', () => {
    const raw = MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_HYPERTROPHY_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 2,
    })
    const neck = prepared.blocks.find((b) => b.name.includes('Cou'))
    expect(neck).toBeDefined()
    expect(prepared.metadata.reductionOrder?.[0]).toBe(neck?.number)

    const cut = truncateSessionBlocks(prepared, { maxBlocks: prepared.blocks.length - 1 })
    expect(cut.droppedBlockNumbers).toContain(neck!.number)
    expect(cut.session.blocks.some((b) => b.name.includes('Cou'))).toBe(false)
  })

  it('pipeline Upper in-season avants : pas de doublon (cou déjà dans la séance)', () => {
    const raw = MOTHER_SESSIONS_BY_ID.UPPER_IN_SEASON_FRONT_ROW_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 2,
    })
    const neckBlocks = prepared.blocks.filter((b) => /Cou —|Neck isometrics/i.test(b.name))
    expect(neckBlocks).toHaveLength(0)
    expect(
      prepared.blocks.some((b) =>
        b.exercises.some((e) => /neck|cou/i.test(e.name) || e.exerciseId?.startsWith('neck__')),
      ),
    ).toBe(true)
  })
})

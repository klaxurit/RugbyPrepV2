import { describe, expect, it } from 'vitest'
import type { Block, MotherSession } from '../../../types/motherSession'
import {
  applyProgressiveNordic,
  resolveNordicMesoWeek,
  NORDIC_PROGRESSION_BY_MESO_WEEK,
} from '../applyProgressiveNordic'

function block(number: number, name: string, prescription: string): Block {
  return {
    number,
    name: `Block ${number}`,
    format: '`3 rounds`',
    exercises: [{ name, prescription }],
    coachingNotes: [],
  }
}

function session(id: string, blocks: Block[]): MotherSession {
  return {
    metadata: {
      id,
      status: 'validated',
      version: 'V1',
      cycle: 'off_season',
      sessionType: 'lower',
      targetLevel: 'performance',
      targetPositionGroup: 'front_row',
      equipment: 'bodyweight_minimal',
      targetDuration: '45 min',
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

describe('resolveNordicMesoWeek', () => {
  it('privilégie mesocycleWeek', () => {
    expect(resolveNordicMesoWeek({ mesocycleWeek: 3, weekNumber: 1 })).toBe(3)
  })

  it('dérive weekNumber en 1–4', () => {
    expect(resolveNordicMesoWeek({ weekNumber: 1 })).toBe(1)
    expect(resolveNordicMesoWeek({ weekNumber: 4 })).toBe(4)
    expect(resolveNordicMesoWeek({ weekNumber: 5 })).toBe(1)
  })
})

describe('applyProgressiveNordic', () => {
  it('réécrit Nordic sur LOWER_BW_OFFSEASON selon la semaine', () => {
    const s = session('LOWER_BW_OFFSEASON_HYPERTROPHY_V1', [
      block(1, 'Nordic Eccentric Curl', '4x6-8 @ RER 1-2'),
      block(2, 'Push-Up', '3x10'),
    ])
    const out = applyProgressiveNordic(s, 1)
    expect(out.blocks[0].exercises[0].prescription).toBe(NORDIC_PROGRESSION_BY_MESO_WEEK[1])
    expect(out.blocks[1].exercises[0].prescription).toBe('3x10')
    expect(out.blocks[0].coachingNotes?.some((n) => n.includes('NHE progressif'))).toBe(true)
  })

  it('ignore les séances hors scope', () => {
    const s = session('UPPER_OFFSEASON_FORCE_BRIDGE_V1', [
      block(1, 'Nordic Curl', '3x5'),
    ])
    expect(applyProgressiveNordic(s, 2)).toBe(s)
  })

  it('monte le volume en semaine 4', () => {
    const s = session('LOWER_OFFSEASON_FORCE_BRIDGE_V1', [
      block(1, 'nordic curl', '4x4-5'),
    ])
    const out = applyProgressiveNordic(s, 4)
    expect(out.blocks[0].exercises[0].prescription).toBe('3x8 @ RER 1-2')
  })

  it('match le libellé FR Nordique', () => {
    const s = session('LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1', [
      block(1, 'Nordique excentrique solo', '4x4-5 @ RER 1-2'),
    ])
    const out = applyProgressiveNordic(s, 2)
    expect(out.blocks[0].exercises[0].prescription).toBe(NORDIC_PROGRESSION_BY_MESO_WEEK[2])
  })
})

import { describe, expect, it } from 'vitest'
import type { Block, MotherSession } from '../../../types/motherSession'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { GYM_PRESET } from '../../equipment/equipmentPresets'
import {
  applyHypertrophyPrimeBump,
  bumpFourSetPrescription,
} from '../applyHypertrophyPrimeBump'
import { prepareSessionForRender } from '../prepareSessionForRender'

function block(number: number, name: string, prescription: string): Block {
  return {
    number,
    name: `Block ${number}`,
    format: number === 1 ? '`4 work sets`, `2 min` rest' : '`4 rounds`',
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
      equipment: 'full_gym',
      targetDuration: '55 min',
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

describe('bumpFourSetPrescription', () => {
  it('4x → 5x, ignore le reste', () => {
    expect(bumpFourSetPrescription('4x8-10 @ RER 1-2')).toBe('5x8-10 @ RER 1-2')
    expect(bumpFourSetPrescription('3x8-10 @ RER 1-2')).toBeNull()
    expect(bumpFourSetPrescription('5x8-10 @ RER 1-2')).toBeNull()
  })
})

describe('applyHypertrophyPrimeBump', () => {
  it('Lower hyp : 2 primes 4→5, pas le support', () => {
    const s = session('LOWER_OFFSEASON_HYPERTROPHY_V1', [
      block(1, 'Back Squat', '4x8-10 @ RER 1-2'),
      block(2, 'Barbell Romanian Deadlift', '4x8-10 @ RER 1-2'),
      block(3, 'Lying Leg Curl', '3x10-12 @ RER 1-2'),
    ])
    const out = applyHypertrophyPrimeBump(s, { mesoWeek: 2, trainingLevel: 'performance', lang: 'fr' })
    expect(out.blocks[0].exercises[0].prescription).toBe('5x8-10 @ RER 1-2')
    expect(out.blocks[1].exercises[0].prescription).toBe('5x8-10 @ RER 1-2')
    expect(out.blocks[2].exercises[0].prescription).toBe('3x10-12 @ RER 1-2')
    expect(out.blocks[0].coachingNotes.join(' ')).toMatch(/Hypertrophie : \+1 série/)
  })

  it('décharge : pas de bump', () => {
    const s = session('UPPER_OFFSEASON_HYPERTROPHY_V1', [
      block(1, 'Bench Press', '4x8-10 @ RER 1-2'),
    ])
    expect(applyHypertrophyPrimeBump(s, { mesoWeek: 4, trainingLevel: 'performance' })).toBe(s)
  })

  it('starter : pas de bump', () => {
    const s = session('LOWER_OFFSEASON_HYPERTROPHY_V1', [
      block(1, 'Back Squat', '4x8-10 @ RER 1-2'),
    ])
    expect(applyHypertrophyPrimeBump(s, { mesoWeek: 1, trainingLevel: 'starter' })).toBe(s)
  })

  it('Full / Nordic : pas de bump', () => {
    const full = session('FULL_OFFSEASON_HYPERTROPHY_V1', [
      block(1, 'Barbell Hip Thrust', '4x8-10 @ RER 1-2'),
    ])
    expect(applyHypertrophyPrimeBump(full, { mesoWeek: 2, trainingLevel: 'performance' })).toBe(full)

    const nordic = session('LOWER_BW_OFFSEASON_HYPERTROPHY_V1', [
      block(1, 'Bulgarian Split Squat', '5x8-10/side @ RER 1-2'),
      block(2, 'Nordic Eccentric', '4x6-8 @ RER 1-2'),
    ])
    expect(applyHypertrophyPrimeBump(nordic, { mesoWeek: 2, trainingLevel: 'performance' })).toBe(
      nordic,
    )
  })

  it('pipeline salle Lower hyp : squat et RDL à 5 séries', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_OFFSEASON_HYPERTROPHY_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 2,
    })
    expect(prepared.blocks[0].exercises[0].prescription).toMatch(/^5\s*[x×]/i)
    expect(prepared.blocks[1].exercises[0].prescription).toMatch(/^5\s*[x×]/i)
  })

  it('pipeline Upper hyp : bench et row à 5 séries', () => {
    const raw = MOTHER_SESSIONS_BY_ID.UPPER_OFFSEASON_HYPERTROPHY_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 1,
    })
    expect(prepared.blocks[0].exercises[0].prescription).toMatch(/^5\s*[x×]/i)
    expect(prepared.blocks[1].exercises[0].prescription).toMatch(/^5\s*[x×]/i)
  })
})

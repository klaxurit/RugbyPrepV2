import { describe, expect, it } from 'vitest'
import type { Block, MotherSession } from '../../../types/motherSession'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { GYM_PRESET } from '../../equipment/equipmentPresets'
import {
  applyInSeasonNoMatchPrimeBump,
  bumpThreeSetPrescription,
} from '../applyInSeasonNoMatchPrimeBump'
import { prepareSessionForRender } from '../prepareSessionForRender'

function block(number: number, name: string, prescription: string): Block {
  return {
    number,
    name: number === 1 ? 'Contrast Lower' : 'Strength Pair',
    format: number === 2 ? '`3 rounds`, `90s` rest' : '`4 rounds`',
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
      cycle: 'in_season',
      sessionType: 'lower',
      targetLevel: 'performance',
      targetPositionGroup: 'front_row',
      equipment: 'full_gym',
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

const bumpOpts = {
  mesoWeek: 2 as const,
  trainingLevel: 'performance' as const,
  lang: 'fr' as const,
  isMatchWeek: false,
}

describe('bumpThreeSetPrescription', () => {
  it('3x → 4x, ignore le reste', () => {
    expect(bumpThreeSetPrescription('3x5-6 @ RER 2-3')).toBe('4x5-6 @ RER 2-3')
    expect(bumpThreeSetPrescription('4x3 @ 80-85%')).toBeNull()
    expect(bumpThreeSetPrescription('3 reps')).toBeNull()
  })
})

describe('applyInSeasonNoMatchPrimeBump', () => {
  it('bloc force 3→4, contraste inchangé', () => {
    const s = session('LOWER_IN_SEASON_FRONT_ROW_V1', [
      block(1, 'Box Squat', '4x3 @ 80-85%'),
      block(2, 'Barbell Romanian Deadlift', '3x5-6 @ RER 2-3'),
    ])
    const out = applyInSeasonNoMatchPrimeBump(s, bumpOpts)
    expect(out.blocks[0].exercises[0].prescription).toBe('4x3 @ 80-85%')
    expect(out.blocks[1].exercises[0].prescription).toBe('4x5-6 @ RER 2-3')
    expect(out.blocks[1].format).toMatch(/4 rounds/)
    expect(out.blocks[1].coachingNotes.join(' ')).toMatch(/Semaine sans match/)
  })

  it('skip match week, décharge, club dur, starter', () => {
    const s = session('UPPER_IN_SEASON_FRONT_ROW_V1', [
      block(2, 'Neutral-Grip Pull-Up', '3x5 @ RER 2-3'),
    ])
    expect(applyInSeasonNoMatchPrimeBump(s, { ...bumpOpts, isMatchWeek: true })).toBe(s)
    expect(applyInSeasonNoMatchPrimeBump(s, { ...bumpOpts, mesoWeek: 4 })).toBe(s)
    expect(applyInSeasonNoMatchPrimeBump(s, { ...bumpOpts, clubContactProxy: 'hard' })).toBe(s)
    expect(applyInSeasonNoMatchPrimeBump(s, { ...bumpOpts, trainingLevel: 'starter' })).toBe(s)
    expect(applyInSeasonNoMatchPrimeBump(s, { mesoWeek: 2, trainingLevel: 'performance' })).toBe(s)
  })

  it('Full / primer : pas de bump', () => {
    const full = session('FULL_BODY_IN_SEASON_FRONT_ROW_V1', [
      block(2, 'Parallel Bar Dip', '3x8-10 @ RER 1-2'),
    ])
    expect(applyInSeasonNoMatchPrimeBump(full, bumpOpts)).toBe(full)
  })

  it('pipeline Lower hors match : RDL à 4 séries, squat contraste à 4', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_FRONT_ROW_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 2,
      isMatchWeek: false,
    })
    expect(prepared.blocks[0].exercises[0].prescription).toMatch(/^4\s*[x×]/i)
    expect(prepared.blocks[1].exercises[0].prescription).toMatch(/^4\s*[x×]/i)
  })

  it('pipeline semaine de match : pas de bump', () => {
    const raw = MOTHER_SESSIONS_BY_ID.LOWER_IN_SEASON_FRONT_ROW_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
      mesocycleWeek: 2,
      isMatchWeek: true,
    })
    expect(prepared.blocks[1].exercises[0].prescription).toMatch(/^3\s*[x×]/i)
  })
})

import { describe, expect, it } from 'vitest'
import type { Block, MotherSession } from '../../../types/motherSession'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { GYM_PRESET } from '../../equipment/equipmentPresets'
import { getExerciseVariantOptions } from '../../equipment/exerciseVariantOptions'
import { applyGymSpeedFallback } from '../applyGymSpeedFallback'
import { prepareSessionForRender } from '../prepareSessionForRender'

function block(number: number, name: string, exercises: Block['exercises']): Block {
  return {
    number,
    name,
    format: '`4 rounds`',
    exercises,
    coachingNotes: [],
  }
}

function speedSession(blocks: Block[]): MotherSession {
  return {
    metadata: {
      id: 'SPEED_POWER_PRESEASON_INTRO_V1',
      status: 'validated',
      version: 'V1',
      cycle: 'pre_season',
      sessionType: 'speed_power',
      targetLevel: 'performance',
      targetPositionGroup: 'front_row',
      equipment: 'field priority',
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

describe('applyGymSpeedFallback', () => {
  it('salle sans piste → départ 3–5 pas à la place du sprint 10–20 m', () => {
    const s = speedSession([
      block(1, 'Sprint / Acceleration', [
        { name: 'Short Acceleration Sprint', prescription: '10-20m', exerciseId: 'sprint__short_acceleration' },
      ]),
    ])
    const out = applyGymSpeedFallback(s, GYM_PRESET, 'fr')
    expect(out.blocks[0].exercises[0].exerciseId).toBe('sprint__falling_start_short')
    expect(out.blocks[0].exercises[0].prescription).not.toMatch(/10-20/)
    expect(out.blocks[0].coachingNotes.join(' ')).toMatch(/pas de piste requise/)
    expect(out.blocks[0].fallbackOptions?.join(' ')).toMatch(/Short Acceleration Sprint/)
  })

  it('bande sans piste → accélération résistée courte, pas de luge', () => {
    const s = speedSession([
      block(1, 'Acceleration Contrast', [
        { name: 'Resisted Acceleration', prescription: '8-10m', exerciseId: 'sprint__resisted_acceleration' },
        { name: 'Free Acceleration Sprint', prescription: '10-20m', exerciseId: 'sprint__free_acceleration' },
      ]),
    ])
    const out = applyGymSpeedFallback(s, ['band'], 'fr')
    expect(out.blocks[0].exercises[0].exerciseId).toBe('sprint__resisted_acceleration')
    expect(out.blocks[0].exercises[0].prescription).toMatch(/6–8 m/)
    expect(out.blocks[0].exercises[1].exerciseId).toBe('sprint__falling_start_short')
  })

  it('piste déclarée → séance terrain inchangée', () => {
    const s = speedSession([
      block(1, 'Sprint / Acceleration', [
        { name: 'Short Acceleration Sprint', prescription: '10-20m', exerciseId: 'sprint__short_acceleration' },
      ]),
    ])
    const out = applyGymSpeedFallback(s, [...GYM_PRESET, 'sprint_track'], 'fr')
    expect(out).toBe(s)
    expect(out.blocks[0].exercises[0].prescription).toBe('10-20m')
  })

  it('ignore les séances non Speed', () => {
    const s = speedSession([
      block(1, 'Sprint / Acceleration', [
        { name: 'Short Acceleration Sprint', prescription: '10-20m', exerciseId: 'sprint__short_acceleration' },
      ]),
    ])
    const lower = { ...s, metadata: { ...s.metadata, sessionType: 'lower' as const } }
    expect(applyGymSpeedFallback(lower, GYM_PRESET, 'fr')).toBe(lower)
  })

  it('pipeline salle : SPEED intro n’impose plus 10–20 m', () => {
    const raw = MOTHER_SESSIONS_BY_ID.SPEED_POWER_PRESEASON_INTRO_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: GYM_PRESET,
      lang: 'fr',
    })
    const accel = prepared.blocks[0]
    expect(accel.exercises.some((e) => e.exerciseId === 'sprint__falling_start_short')).toBe(true)
    expect(accel.exercises.every((e) => !/10-20/.test(e.prescription))).toBe(true)
    expect(accel.coachingNotes.join(' ')).toMatch(/pas de piste/)
    const alts = getExerciseVariantOptions('sprint__falling_start_short', {
      equipment: GYM_PRESET,
      mdAlternativeIds: ['sprint__short_acceleration'],
    })
    expect(alts.map((o) => o.exerciseId)).toContain('sprint__short_acceleration')
  })

  it('pipeline avec piste : SPEED intro garde l’accel terrain', () => {
    const raw = MOTHER_SESSIONS_BY_ID.SPEED_POWER_PRESEASON_INTRO_V1
    const prepared = prepareSessionForRender({
      session: raw,
      trainingLevel: 'performance',
      equipment: [...GYM_PRESET, 'sprint_track'],
      lang: 'fr',
    })
    expect(
      prepared.blocks[0].exercises.some((e) => e.exerciseId === 'sprint__short_acceleration'),
    ).toBe(true)
  })
})

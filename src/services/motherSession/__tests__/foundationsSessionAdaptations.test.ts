import { describe, expect, it } from 'vitest'
import type { MotherSession } from '../../../types/motherSession'
import type { SessionContentFr } from '../motherSessionContentFr'
import {
  adaptMotherSessionForFoundations,
  adaptSessionContentFrForFoundations,
} from '../foundationsSessionAdaptations'

function makeSession(): MotherSession {
  return {
    metadata: {
      id: 'TEST_FOUNDATIONS_V1',
      status: 'validated',
      version: 'V1',
      cycle: 'pre_season',
      sessionType: 'upper',
      targetLevel: 'performance',
      targetPositionGroup: 'front_row',
      equipment: 'full_gym',
      targetDuration: '45-55 min',
    },
    title: 'Test Session',
    goal: [],
    sessionIdentity: [],
    warmUp: { exercises: [], notes: [] },
    blocks: [
      {
        number: 1,
        name: 'Main Lower Force',
        format: '4x4-5',
        exercises: [{ name: 'Pin Back Squat', prescription: '4x4-5' }],
        coachingNotes: ['Pin Back Squat must stay clean.'],
      },
      {
        number: 2,
        name: 'Posterior Chain',
        format: '3x4-5',
        exercises: [{ name: 'Nordic Curl', prescription: '3x4-5' }],
        coachingNotes: ['Stop the Nordics before reps become ugly.'],
      },
      {
        number: 3,
        name: 'Lower Foundations',
        format: '3x5-6',
        exercises: [
          { name: 'Box Squat', prescription: '3x5-6' },
          { name: 'Barbell Romanian Deadlift', prescription: '3x6' },
        ],
        coachingNotes: ['Box Squat and Barbell Romanian Deadlift should stay clean.'],
      },
      {
        number: 4,
        name: 'Upper Power',
        format: '3x5',
        exercises: [
          { name: 'Strict Standing Overhead Press', prescription: '3x5' },
          { name: 'Push Press', prescription: '3x5' },
          { name: 'T-Bar Row', prescription: '3x6' },
        ],
        coachingNotes: ['Strict Standing Overhead Press, Push Press and T-Bar Row should stay crisp.'],
      },
      {
        number: 5,
        name: 'Core Rotation',
        format: '2x8/side',
        exercises: [{ name: 'GHD Rotations', prescription: '2x8/side' }],
        coachingNotes: ['Keep GHD Rotations controlled.'],
      },
    ],
    progressionRules: [],
    positionAccent: [],
    injurySubstitutions: [],
    coachingWarnings: [],
    sourceReferences: [],
  }
}

function makeFrContent(): SessionContentFr {
  return {
    goals: [],
    sessionIdentity: [],
    warmUpExercises: [],
    warmUpNotes: [],
    blocks: [
      {
        name: 'Force bas du corps',
        format: '4x4-5',
        exercises: [{ name: 'Pin Back Squat', prescription: '4x4-5' }],
        coachingNotes: ['Pin Back Squat doit rester propre.'],
      },
      {
        name: 'Chaîne postérieure',
        format: '3x4-5',
        exercises: [{ name: 'Nordic Curl', prescription: '3x4-5' }],
        coachingNotes: ['Arrête les Nordic Curl avant que ça ne se dégrade.'],
      },
      {
        name: 'Puissance haut du corps',
        format: '3x5-6',
        exercises: [
          { name: 'Box Squat', prescription: '3x5-6' },
          { name: 'Barbell Romanian Deadlift', prescription: '3x6' },
        ],
        coachingNotes: ['Box Squat et Barbell Romanian Deadlift doivent rester propres.'],
      },
      {
        name: 'Puissance haut du corps',
        format: '3x5',
        exercises: [
          { name: 'Strict Standing Overhead Press', prescription: '3x5' },
          { name: 'Push Press', prescription: '3x5' },
          { name: 'T-Bar Row', prescription: '3x6' },
        ],
        coachingNotes: ['Strict Standing Overhead Press, Push Press et T-Bar Row doivent rester propres.'],
      },
      {
        name: 'Rotation tronc',
        format: '2x8/côté',
        exercises: [{ name: 'GHD Rotations', prescription: '2x8/côté' }],
        coachingNotes: ['GHD Rotations contrôlées.'],
      },
    ],
    progressionRules: [],
    positionAccent: [],
    coachingWarnings: [],
  }
}

describe('foundationsSessionAdaptations', () => {
  it('remplace les exercices techniques par des variantes guidées quand le matériel est disponible', () => {
    const adapted = adaptMotherSessionForFoundations(makeSession(), ['machine', 'cable', 'dumbbell'])

    expect(adapted.metadata.targetLevel).toBe('starter')
    expect(adapted.blocks[0].exercises[0].exerciseId).toBe('squat__leg_press__machine')
    expect(adapted.blocks[1].exercises[0].exerciseId).toBe('hamstring__leg_curl__machine')
    expect(adapted.blocks[2].exercises[0].exerciseId).toBe('squat__goblet_squat__dumbbell')
    expect(adapted.blocks[2].exercises[1].exerciseId).toBe('hinge__rdl__dumbbell')
    expect(adapted.blocks[3].exercises[0].exerciseId).toBe('push_vertical__shoulder_press__machine')
    expect(adapted.blocks[3].exercises[1].exerciseId).toBe('push_vertical__shoulder_press__machine')
    expect(adapted.blocks[3].exercises[2].exerciseId).toBe('pull_horizontal__cable_row__seated')
    expect(adapted.blocks[4].exercises[0].exerciseId).toBe('core_rotation__cable_chop')
    expect(adapted.blocks[3].coachingNotes.at(-1)).toMatch(/Foundations version/i)
  })

  it('adapte aussi le contenu FR affiché pour montrer les bons noms', () => {
    const session = makeSession()
    const fr = adaptSessionContentFrForFoundations(session, makeFrContent(), ['machine', 'cable', 'dumbbell'])

    expect(fr?.blocks[0].exercises[0].name).toBe('Presse à cuisses')
    expect(fr?.blocks[1].exercises[0].name).toBe('Curl ischios machine')
    expect(fr?.blocks[2].exercises[0].name).toBe('Goblet squat haltère')
    expect(fr?.blocks[2].exercises[1].name).toBe('Soulevé de terre jambes tendues haltères (RDL)')
    expect(fr?.blocks[3].exercises[0].name).toBe('Développé épaules machine')
    expect(fr?.blocks[3].exercises[1].name).toBe('Développé épaules machine')
    expect(fr?.blocks[3].exercises[2].name).toBe('Rowing poulie assis')
    expect(fr?.blocks[4].exercises[0].name).toBe('Chop au câble')
    expect(fr?.blocks[0].coachingNotes.at(-1)).toMatch(/Version Fondations/i)
  })
})

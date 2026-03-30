import { describe, expect, it } from 'vitest'
import type { MotherSession } from '../../../types/motherSession'
import type { SessionContentFr } from '../motherSessionContentFr'
import {
  adaptMotherSessionForEquipmentAlternatives,
  adaptSessionContentFrForEquipmentAlternatives,
} from '../equipmentAlternativeAdaptations'

function makeSession(): MotherSession {
  return {
    metadata: {
      id: 'TEST_MEDBALL_ALTS_V1',
      status: 'validated',
      version: 'V1',
      cycle: 'pre_season',
      sessionType: 'upper',
      targetLevel: 'performance',
      targetPositionGroup: 'front_row',
      equipment: 'full_gym',
      targetDuration: '45-55 min',
    },
    title: 'Test Med Ball Session',
    goal: [],
    sessionIdentity: [],
    warmUp: { exercises: [], notes: [] },
    blocks: [
      {
        number: 1,
        name: 'Upper ballistic',
        format: '3 rounds',
        exercises: [{ name: 'Med Ball Chest Pass', prescription: '3 reps' }],
        coachingNotes: ['Keep the Med Ball Chest Pass sharp.'],
      },
      {
        number: 2,
        name: 'Rotation power',
        format: '3 rounds',
        exercises: [{ name: 'Med Ball Rotational Throw', prescription: '3/side' }],
        coachingNotes: ['The Med Ball Rotational Throw should stay sharp.'],
      },
      {
        number: 3,
        name: 'Primer push',
        format: '3 rounds',
        exercises: [{ name: 'Supine Med Ball Throw', prescription: '3 reps' }],
        coachingNotes: ['Supine Med Ball Throw stays ballistic.'],
      },
      {
        number: 4,
        name: 'Full power',
        format: '3 rounds',
        exercises: [{ name: 'Slam medecine ball', prescription: '4 reps' }],
        coachingNotes: ['Slam medecine ball should stay violent and clean.'],
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
        name: 'Ballistique haut',
        format: '3 tours',
        exercises: [{ name: 'Lancer medecine ball poitrine mur', prescription: '3 reps' }],
        coachingNotes: ['Le lancer med ball poitrine doit rester net.'],
      },
      {
        name: 'Rotation puissance',
        format: '3 tours',
        exercises: [{ name: 'Lancer rotationnel medball', prescription: '3/côté' }],
        coachingNotes: ['Le lancer rotationnel medball doit rester net.'],
      },
      {
        name: 'Primer push',
        format: '3 tours',
        exercises: [{ name: 'Lancer med ball allongé', prescription: '3 reps' }],
        coachingNotes: ['Le lancer med ball allongé doit rester explosif.'],
      },
      {
        name: 'Full power',
        format: '3 tours',
        exercises: [{ name: 'Slam medecine ball', prescription: '4 reps' }],
        coachingNotes: ['Le slam med ball doit rester propre.'],
      },
    ],
    progressionRules: [],
    positionAccent: [],
    coachingWarnings: [],
  }
}

describe('equipmentAlternativeAdaptations', () => {
  it('garde les exercices medball comme mouvement principal mais ajoute systématiquement les alternatives', () => {
    const adapted = adaptMotherSessionForEquipmentAlternatives(makeSession(), ['cable'])

    expect(adapted.blocks[0].exercises[0].name).toBe('Med Ball Chest Pass')
    expect(adapted.blocks[1].exercises[0].name).toBe('Med Ball Rotational Throw')
    expect(adapted.blocks[2].exercises[0].name).toBe('Supine Med Ball Throw')
    expect(adapted.blocks[3].exercises[0].name).toBe('Slam medecine ball')
    expect(adapted.blocks[0].fallbackOptions?.join(' ')).toContain('Cable Press explosif')
    expect(adapted.blocks[1].fallbackOptions?.join(' ')).toContain('Cable Rotation explosif')
    expect(adapted.blocks[3].fallbackOptions?.join(' ')).toContain('Cable Slam haut vers bas')
  })

  it('ajoute les mêmes alternatives même quand la salle possède une med ball', () => {
    const adapted = adaptMotherSessionForEquipmentAlternatives(makeSession(), ['med_ball', 'cable'])

    expect(adapted.blocks[0].exercises[0].name).toBe('Med Ball Chest Pass')
    expect(adapted.blocks[0].exercises[0].exerciseId).toBeUndefined()
    expect(adapted.blocks[0].fallbackOptions?.join(' ')).toContain('Cable Press explosif')
  })

  it('ajoute aussi les alternatives visibles dans le contenu FR', () => {
    const fr = adaptSessionContentFrForEquipmentAlternatives(makeSession(), makeFrContent(), ['cable'])

    expect(fr?.blocks[0].exercises[0].name).toBe('Lancer medecine ball poitrine mur')
    expect(fr?.blocks[1].exercises[0].name).toBe('Lancer rotationnel medball')
    expect(fr?.blocks[3].exercises[0].name).toBe('Slam medecine ball')
    expect(fr?.blocks[0].fallbackOptions?.join(' ')).toContain('Si pas de med ball')
    expect(fr?.blocks[0].fallbackOptions?.join(' ')).toContain('Landmine press vitesse')
    expect(fr?.blocks[3].fallbackOptions?.join(' ')).toContain('Cable Slam haut vers bas')
  })
})

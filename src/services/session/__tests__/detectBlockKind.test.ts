import { describe, expect, it } from 'vitest'
import type { Block } from '../../../types/motherSession'
import { detectBlockKind } from '../detectBlockKind'

const shoulderHealthBlock: Block = {
  number: 5,
  name: 'Shoulder Health',
  format: '`3 rounds`, `45-60s` rest after the round',
  exercises: [
    { name: 'Face Pull', prescription: '3x12-15' },
    { name: 'Lateral Raise', prescription: '2x12-15', isOptional: true },
  ],
  coachingNotes: [],
}

const isoPrehabBlock: Block = {
  number: 3,
  name: 'Mandatory Shoulder Prehab Micro-Block',
  format: '`2 rounds`',
  exercises: [
    { name: 'Band external rotation iso', prescription: '2x20s/side' },
  ],
  coachingNotes: [],
}

const shoulderHealthBlockFr: Block = {
  number: 5,
  name: 'Santé épaule',
  format: '`3 tours`, `45-60s` de repos après le tour',
  exercises: [
    { name: 'Face pull poulie corde', prescription: '3x12-15' },
    { name: 'Élévation latérale haltères', prescription: '2x12-15 (optionnel)' },
  ],
  coachingNotes: [],
}

describe('detectBlockKind', () => {
  it('route Shoulder Health (rounds + reps) vers tours pour saisie kg/reps', () => {
    expect(detectBlockKind(shoulderHealthBlock)).toBe('tours')
  })

  it('route Santé épaule FR (tours + reps) vers tours malgré le nom prehab', () => {
    expect(detectBlockKind(shoulderHealthBlockFr)).toBe('tours')
  })

  it('garde les micro-blocs iso en prehab', () => {
    expect(detectBlockKind(isoPrehabBlock)).toBe('prehab')
  })
})

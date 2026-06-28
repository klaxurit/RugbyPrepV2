import { describe, expect, it } from 'vitest'
import { buildExerciseTourKey } from '../../../contexts/SessionRunContext'
import type { MotherSession } from '../../../types/motherSession'
import { findCurrentPending, isTimedBlockComplete } from '../findCurrentPending'

const emomSession = {
  metadata: { id: 'emom-test' },
  warmUp: { exercises: [], notes: '' },
  blocks: [
    {
      number: 3,
      name: 'Finisher',
      format: "`EMOM 8'`",
      coachingNotes: '',
      exercises: [
        { name: 'KB Swing', prescription: '10 reps', exerciseId: 'kb_swing', slotLabel: 'Min 1, 3, 5, 7' },
        { name: 'Burpee', prescription: '8 reps', exerciseId: 'burpee', slotLabel: 'Min 2, 4, 6, 8' },
      ],
    },
    {
      number: 4,
      name: 'Force',
      format: '`3 rounds`',
      coachingNotes: '',
      exercises: [
        { name: 'Squat', prescription: '4×5', exerciseId: 'squat' },
      ],
    },
  ],
} as unknown as MotherSession

describe('findCurrentPending — blocs chronométrés', () => {
  it('retourne isTimedBlock pour un EMOM non terminé', () => {
    const cursor = findCurrentPending(emomSession, new Set())
    expect(cursor?.isTimedBlock).toBe(true)
    expect(cursor?.blockNumber).toBe(3)
    expect(cursor?.tourIndex).toBe(0)
  })

  it('passe au bloc suivant quand l’EMOM est terminé', () => {
    const completed = new Set([
      buildExerciseTourKey(3, 0, 0),
      buildExerciseTourKey(3, 0, 1),
    ])
    const cursor = findCurrentPending(emomSession, completed)
    expect(cursor?.isTimedBlock).toBeUndefined()
    expect(cursor?.blockNumber).toBe(4)
  })

  it('isTimedBlockComplete vérifie uniquement le tour 0', () => {
    const block = emomSession.blocks[0]
    expect(isTimedBlockComplete(block, new Set([buildExerciseTourKey(3, 0, 0)]))).toBe(false)
    expect(
      isTimedBlockComplete(
        block,
        new Set([buildExerciseTourKey(3, 0, 0), buildExerciseTourKey(3, 0, 1)]),
      ),
    ).toBe(true)
  })
})

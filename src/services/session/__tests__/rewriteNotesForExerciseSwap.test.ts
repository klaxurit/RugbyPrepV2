import { describe, expect, it } from 'vitest'
import {
  applyExerciseNameSwaps,
  rewriteNotesForExerciseSwaps,
} from '../rewriteNotesForExerciseSwap'

describe('rewriteNotesForExerciseSwap', () => {
  it('remplace le nom source (casse-insensible) par la cible', () => {
    const swaps = [
      {
        sources: ['Bulgarian Split Squat', 'Fente bulgare'],
        target: 'Cossack Squat',
      },
    ]
    expect(applyExerciseNameSwaps('Keep bulgarian split squat clean', swaps)).toBe(
      'Keep Cossack Squat clean',
    )
    expect(applyExerciseNameSwaps('Fente bulgare stable', swaps)).toBe('Cossack Squat stable')
  })

  it('réécrit un tableau de notes', () => {
    const notes = rewriteNotesForExerciseSwaps(
      ['Bulgarian Split Squat → plant', 'Other cue'],
      [{ sources: ['Bulgarian Split Squat'], target: 'Cossack Squat' }],
    )
    expect(notes).toEqual(['Cossack Squat → plant', 'Other cue'])
  })
})

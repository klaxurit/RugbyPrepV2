import { describe, expect, it } from 'vitest'
import type { Block } from '../../../types/motherSession'
import { buildExerciseTourKey } from '../../../contexts/SessionRunContext'
import { resolveSessionRunProgress } from '../resolveSessionRunProgress'

function emomBlock(number: number, minutes: number, name = 'Back Row Finisher'): Block {
  return {
    number,
    name,
    format: `\`EMOM ${minutes}'\``,
    exercises: [
      {
        name: 'Medicine Ball Slam',
        prescription: '8–10',
        exerciseId: 'medicine_ball_slam',
      },
      {
        name: 'Farmer Carry',
        prescription: '20–30m',
        exerciseId: 'farmer_carry',
      },
    ],
    coachingNotes: [],
  }
}

function roundsBlock(number: number, tours: number): Block {
  return {
    number,
    name: 'Contrast Lower',
    format: `\`${tours} rounds\`, \`90s\` rest after the pair`,
    exercises: [
      {
        name: 'Trap Bar Jump',
        prescription: '3×3',
        exerciseId: 'trap_bar_jump',
      },
      {
        name: 'Broad Jump',
        prescription: '3×3',
        exerciseId: 'broad_jump',
      },
    ],
    coachingNotes: [],
  }
}

describe('resolveSessionRunProgress', () => {
  it('EMOM finished live → Minute N/N, pas Minute 1', () => {
    const blocks = [emomBlock(3, 8)]
    const p = resolveSessionRunProgress({
      blocks,
      completedExercises: new Set(),
      emomLive: {
        blockNumber: 3,
        displayMinute: 8,
        totalMinutes: 8,
        emomFinished: true,
      },
      finishedEmomBlockNumber: 3,
    })
    expect(p.activeTourIndex).toBe(8)
    expect(p.activeBlockTourCount).toBe(8)
    expect(p.activeBlockUnitLabel).toBe('Minute')
    expect(p.completedTours).toBe(8)
  })

  it('skip minutes → displayMinute live', () => {
    const p = resolveSessionRunProgress({
      blocks: [emomBlock(3, 8)],
      completedExercises: new Set(),
      emomLive: {
        blockNumber: 3,
        displayMinute: 5,
        totalMinutes: 8,
        emomFinished: false,
      },
    })
    expect(p.activeTourIndex).toBe(5)
    expect(p.completedTours).toBe(0)
  })

  it('après validation EMOM (clés tour 0) → passe au bloc suivant', () => {
    const blocks = [emomBlock(3, 8), roundsBlock(4, 3)]
    const completed = new Set([
      buildExerciseTourKey(3, 0, 0),
      buildExerciseTourKey(3, 0, 1),
    ])
    const p = resolveSessionRunProgress({
      blocks,
      completedExercises: completed,
      emomLive: null,
      finishedEmomBlockNumber: null,
    })
    expect(p.activeBlockIndex).toBe(2)
    expect(p.activeBlockName.toLowerCase()).toMatch(/contrast|contraste/)
    expect(p.activeTourIndex).toBe(1)
    expect(p.activeBlockUnitLabel).toBe('Tour')
    expect(p.completedTours).toBe(8)
  })

  it('EMOM non démarré : actif sans Minute 1/N fantôme', () => {
    const p = resolveSessionRunProgress({
      blocks: [emomBlock(3, 8)],
      completedExercises: new Set(),
    })
    expect(p.activeBlockIndex).toBe(1)
    expect(p.activeTourIndex).toBeNull()
  })
})

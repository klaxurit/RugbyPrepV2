// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MotherSessionBlock } from '../MotherSessionBlock'
import type { Block } from '../../../types/motherSession'

afterEach(cleanup)

// A block with known loggable exercises
const loggableBlock: Block = {
  number: 1,
  name: 'Strength Block',
  format: '4×5',
  exercises: [
    { name: 'Bench Press', prescription: '4×5 @80%' },
    { name: 'Pendlay Row', prescription: '4×5' },
  ],
  coachingNotes: [],
}

// A block with no loggable exercises (warmup/directive)
const unloggableBlock: Block = {
  number: 0,
  name: 'Warm-Up',
  format: '',
  exercises: [
    { name: '2 progressive prep sets', prescription: '' },
    { name: '1 easy prep round', prescription: '' },
  ],
  coachingNotes: [],
}

// A block with mixed loggable/unloggable
const mixedBlock: Block = {
  number: 2,
  name: 'Mixed Block',
  format: '3×8',
  exercises: [
    { name: 'Hammer Curl', prescription: '3×10' },
    { name: 'Chest-Supported Row or T-Bar Row', prescription: '3×8' }, // "or" = non-loggable
  ],
  coachingNotes: [],
}

describe('MotherSessionBlock — logger toggle visibility', () => {
  it('shows toggle when block has loggable exercises', () => {
    render(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        onSaveBlock={vi.fn()}
        getLastEntryForExercise={() => undefined}
        isPremium
      />
    )
    expect(screen.getByTestId('block-log-toggle')).toBeTruthy()
  })

  it('does NOT show toggle when block has no loggable exercises', () => {
    render(
      <MotherSessionBlock
        block={unloggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        onSaveBlock={vi.fn()}
        getLastEntryForExercise={() => undefined}
      />
    )
    expect(screen.queryByTestId('block-log-toggle')).toBeNull()
  })

  it('shows toggle for mixed block + shows unmapped note', () => {
    render(
      <MotherSessionBlock
        block={mixedBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        onSaveBlock={vi.fn()}
        getLastEntryForExercise={() => undefined}
        isPremium
      />
    )
    const toggle = screen.getByTestId('block-log-toggle')
    fireEvent.click(toggle)
    expect(screen.getByText(/pas encore loggables/i)).toBeTruthy()
  })

  it('does NOT show toggle when onSaveBlock is not provided', () => {
    render(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
      />
    )
    expect(screen.queryByTestId('block-log-toggle')).toBeNull()
  })
})

describe('MotherSessionBlock — logger inputs by metricType', () => {
  it('shows load/reps/rir/sets for load_reps exercise', () => {
    render(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        onSaveBlock={vi.fn()}
        getLastEntryForExercise={() => undefined}
        isPremium
      />
    )
    fireEvent.click(screen.getByTestId('block-log-toggle'))
    expect(screen.getAllByText('Charge (kg)').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Reps').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('RIR').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Séries').length).toBeGreaterThanOrEqual(1)
  })

  it('pre-fills from lastEntry (placeholder)', () => {
    render(
      <MotherSessionBlock
        block={loggableBlock}
        motherSessionId="TEST_MS_V1"
        sessionType="UPPER"
        week="W1"
        fatigue="OK"
        onSaveBlock={vi.fn()}
        isPremium
        getLastEntryForExercise={(id) =>
          id === 'push_horizontal__bench_press__barbell'
            ? { exerciseId: id, loadKg: 80, reps: 5 }
            : undefined
        }
      />
    )
    fireEvent.click(screen.getByTestId('block-log-toggle'))
    const loadInputs = screen.getAllByPlaceholderText('80')
    expect(loadInputs.length).toBeGreaterThanOrEqual(1)
  })
})

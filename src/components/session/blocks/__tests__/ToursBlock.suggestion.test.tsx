// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ToursBlock } from '../ToursBlock'
import type { Block } from '../../../../types/motherSession'
import type { LoadSuggestion } from '../../../../services/loadSuggestion'

afterEach(() => cleanup())

const mkBlock = (): Block => ({
  number: 1,
  name: 'Force lourde',
  format: '3x5',
  exercises: [
    {
      name: 'Back squat',
      exerciseId: 'back_squat',
      prescription: '3x5',
    },
  ],
  coachingNotes: [],
})

const baseProps = {
  number: 1,
  state: 'active' as const,
  expanded: true,
  onToggle: vi.fn(),
  totalTours: 3,
  restLabel: '2 min',
  currentTourIdx: 0,
  currentExoIdx: 0,
  premium: true,
  tourData: {
    0: { 0: { kg: '', reps: '', validated: false } },
    1: { 0: { kg: '', reps: '', validated: false } },
    2: { 0: { kg: '', reps: '', validated: false } },
  },
  onValidateExo: vi.fn(),
  onSetExoData: vi.fn(),
}

const mkSuggestion = (overrides: Partial<LoadSuggestion> = {}): LoadSuggestion => ({
  decision: 'increase',
  suggestedWeight: 102.5,
  suggestedReps: 5,
  justification: 'Charge bien maitrisée — on monte.',
  nextTarget: 'Si réussi → 105 kg',
  confidence: 'high',
  ...overrides,
})

describe('ToursBlock — badge suggestion de charge', () => {
  it('affiche un badge "increase" pour Premium + confidence high sur exo courant', () => {
    render(
      <ToursBlock
        {...baseProps}
        block={mkBlock()}
        getLoadSuggestion={() => mkSuggestion()}
      />,
    )
    const badge = screen.getByTestId('exo-load-suggestion')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('data-decision', 'increase')
    expect(badge).toHaveTextContent(/102\.5/)
  })

  it('aucun badge pour confidence "low"', () => {
    render(
      <ToursBlock
        {...baseProps}
        block={mkBlock()}
        getLoadSuggestion={() => mkSuggestion({ confidence: 'low' })}
      />,
    )
    expect(screen.queryByTestId('exo-load-suggestion')).toBeNull()
  })

  it('aucun badge pour user non Premium', () => {
    render(
      <ToursBlock
        {...baseProps}
        premium={false}
        block={mkBlock()}
        getLoadSuggestion={() => mkSuggestion()}
      />,
    )
    expect(screen.queryByTestId('exo-load-suggestion')).toBeNull()
  })

  it('aucun badge pour decision "no_data"', () => {
    render(
      <ToursBlock
        {...baseProps}
        block={mkBlock()}
        getLoadSuggestion={() =>
          mkSuggestion({ decision: 'no_data', suggestedWeight: null })
        }
      />,
    )
    expect(screen.queryByTestId('exo-load-suggestion')).toBeNull()
  })

  it('badge "decrease" affiche le symbole ↓ et le poids', () => {
    render(
      <ToursBlock
        {...baseProps}
        block={mkBlock()}
        getLoadSuggestion={() =>
          mkSuggestion({ decision: 'decrease', suggestedWeight: 95 })
        }
      />,
    )
    const badge = screen.getByTestId('exo-load-suggestion')
    expect(badge).toHaveAttribute('data-decision', 'decrease')
    expect(badge).toHaveTextContent(/↓/)
  })

  it('badge "maintain" affiche le symbole →', () => {
    render(
      <ToursBlock
        {...baseProps}
        block={mkBlock()}
        getLoadSuggestion={() =>
          mkSuggestion({ decision: 'maintain' })
        }
      />,
    )
    const badge = screen.getByTestId('exo-load-suggestion')
    expect(badge).toHaveAttribute('data-decision', 'maintain')
    expect(badge).toHaveTextContent(/→/)
  })

  it('disclaimer présent dans le tooltip natif', () => {
    render(
      <ToursBlock
        {...baseProps}
        block={mkBlock()}
        getLoadSuggestion={() => mkSuggestion()}
      />,
    )
    const badge = screen.getByTestId('exo-load-suggestion')
    expect(badge.getAttribute('title')).toMatch(/indicative/i)
    expect(badge.getAttribute('title')).toMatch(/ressenti/i)
  })
})

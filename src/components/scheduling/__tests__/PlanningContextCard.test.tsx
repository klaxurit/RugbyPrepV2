// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PlanningContextCard } from '../PlanningContextCard'
import type { WeekExplanation } from '../../../types/scheduling'

const mockUserId = 'user-card-1'
const mockLogs: Array<{ id: string }> = []

vi.mock('../../../services/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
      upsert: () => Promise.resolve({ error: null }),
    }),
  },
}))

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ authState: { status: 'authenticated', user: { id: mockUserId } } }),
}))

vi.mock('../../../hooks/useHistory', () => ({
  useHistory: () => ({ logs: mockLogs }),
}))

const baseExplanation: WeekExplanation = {
  summaryLine: '3 séances Hypertrophie — à ton rythme',
  detailLines: ['Ajoute tes matchs pour un programme plus précis.'],
  detailItems: [
    { ruleId: 'rule:onboarding_cycle_hint', text: 'Ajoute tes matchs pour un programme plus précis.' },
  ],
  corrections: [],
}

beforeEach(() => { localStorage.clear() })
afterEach(() => cleanup())

function renderCard(props: Parameters<typeof PlanningContextCard>[0]) {
  return render(
    <MemoryRouter>
      <PlanningContextCard {...props} />
    </MemoryRouter>,
  )
}

describe('PlanningContextCard', () => {
  it('renders the summary inline and exposes a dismiss button', () => {
    renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    expect(screen.getByTestId('planning-context-card')).toBeInTheDocument()
    expect(screen.getByTestId('planning-context-card').textContent).toContain('Hypertrophie')
    expect(screen.getByTestId('planning-context-dismiss')).toBeInTheDocument()
  })

  it('exposes "Pourquoi ?" et déplie le détail inline', () => {
    renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    expect(screen.getByTestId('planning-context-toggle')).toBeInTheDocument()
    expect(screen.queryByTestId('planning-context-details')).toBeNull()
    fireEvent.click(screen.getByTestId('planning-context-toggle'))
    expect(screen.getByTestId('planning-context-details').textContent).toContain('Ajoute tes matchs')
    expect(screen.getByTestId('planning-context-ask-coach')).toHaveAttribute('href', expect.stringContaining('/chat'))
  })

  it('hides on dismiss click and stays hidden after a remount (same contextHash)', async () => {
    const { unmount } = renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    fireEvent.click(screen.getByTestId('planning-context-dismiss'))
    await waitFor(() => {
      expect(screen.queryByTestId('planning-context-card')).toBeNull()
    })

    unmount()

    renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    expect(screen.queryByTestId('planning-context-card')).toBeNull()
  })

  it('reappears after remount when contextHash changes (new phase)', async () => {
    const { unmount } = renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    fireEvent.click(screen.getByTestId('planning-context-dismiss'))
    await waitFor(() => {
      expect(screen.queryByTestId('planning-context-card')).toBeNull()
    })
    unmount()

    renderCard({ explanation: baseExplanation, contextHash: 'off_season:4:' })
    expect(screen.getByTestId('planning-context-card')).toBeInTheDocument()
  })

  it('hides "Pourquoi ?" when explanation has no details and no corrections', () => {
    renderCard({
      explanation: { summaryLine: 'Phase X', detailLines: [], detailItems: [], corrections: [] },
      contextHash: 'in_season::',
    })
    expect(screen.queryByTestId('planning-context-toggle')).toBeNull()
    expect(screen.getByTestId('planning-context-ask-coach')).toBeInTheDocument()
  })

  it('renders summaryFooterAction when provided', () => {
    const onClick = vi.fn()
    renderCard({
      explanation: baseExplanation,
      contextHash: 'off_season:1:',
      summaryFooterAction: { label: 'Passer la récup', onClick, testId: 'footer-skip' },
    })
    fireEvent.click(screen.getByTestId('footer-skip'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

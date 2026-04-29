// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CoachProvider } from '../../../contexts/CoachContext'
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
    <CoachProvider>
      <PlanningContextCard {...props} />
    </CoachProvider>,
  )
}

describe('PlanningContextCard', () => {
  it('renders the summary inline and exposes a dismiss button', () => {
    renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    expect(screen.getByTestId('planning-context-card')).toBeInTheDocument()
    expect(screen.getByTestId('planning-context-card').textContent).toContain('Hypertrophie')
    expect(screen.getByTestId('planning-context-dismiss')).toBeInTheDocument()
  })

  it('exposes "Pourquoi ?" toggle when details exist (opens companion, not inline)', () => {
    renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    expect(screen.getByTestId('planning-context-toggle')).toBeInTheDocument()
    // Click should not throw (companion open is handled by CoachContext)
    fireEvent.click(screen.getByTestId('planning-context-toggle'))
    // Detail text never appears inline anymore
    expect(screen.queryByText(/Ajoute tes matchs/)).toBeNull()
  })

  it('hides immediately on dismiss click and stays hidden after a remount (same contextHash)', () => {
    const { unmount } = renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    fireEvent.click(screen.getByTestId('planning-context-dismiss'))
    expect(screen.queryByTestId('planning-context-card')).toBeNull()
    unmount()

    // Remount = page refresh
    renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    expect(screen.queryByTestId('planning-context-card')).toBeNull()
  })

  it('reappears after remount when contextHash changes (new phase)', () => {
    const { unmount } = renderCard({ explanation: baseExplanation, contextHash: 'off_season:3:' })
    fireEvent.click(screen.getByTestId('planning-context-dismiss'))
    expect(screen.queryByTestId('planning-context-card')).toBeNull()
    unmount()

    // Phase 4 → different contextHash → dismiss invalidated
    renderCard({ explanation: baseExplanation, contextHash: 'off_season:4:' })
    expect(screen.getByTestId('planning-context-card')).toBeInTheDocument()
  })

  it('hides "Pourquoi ?" when explanation has no details and no corrections', () => {
    renderCard({
      explanation: { summaryLine: 'Phase X', detailLines: [], detailItems: [], corrections: [] },
      contextHash: 'in_season::',
    })
    expect(screen.queryByTestId('planning-context-toggle')).toBeNull()
  })
})

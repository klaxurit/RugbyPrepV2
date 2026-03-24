// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { HistoryPage } from '../HistoryPage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'
import type { SessionLog } from '../../types/training'

const useHistoryMock = vi.fn()
const useBlockLogsMock = vi.fn()

vi.mock('../../services/analytics/posthog', () => ({
  posthog: { capture: vi.fn() },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    authState: { status: 'authenticated', user: { id: 'u1', avatarUrl: null } },
    isInitializing: false,
  }),
}))

vi.mock('../../hooks/useHistory', () => ({
  useHistory: () => useHistoryMock(),
}))

vi.mock('../../hooks/useBlockLogs', () => ({
  useBlockLogs: () => useBlockLogsMock(),
}))

const LEGACY_LOG: SessionLog = {
  id: 'log-legacy',
  dateISO: new Date().toISOString(),
  week: 'W2',
  sessionType: 'LOWER',
  fatigue: 'OK',
  programSource: 'legacy',
  legacyRecipeId: 'LOWER_V1',
  sessionLabel: 'Lower Force',
}

const MOTHER_LOG: SessionLog = {
  id: 'log-mother',
  dateISO: new Date().toISOString(),
  week: 'W1',
  sessionType: 'FULL',
  fatigue: 'OK',
  programSource: 'mother_session',
  motherSessionId: 'FULL_OFFSEASON_RECOVERY_A_V1',
  sessionLabel: 'Full Body Récupération A',
  programContext: {
    cycle: 'off_season',
    weekLabel: 'off_season — S3',
    annualWeekCode: 'OFF_S03',
    annualWeekNumber: 3,
  },
}

describe('HistoryPage · enriched logs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBlockLogsMock.mockReturnValue({ logs: [] })
  })

  afterEach(() => {
    cleanup()
  })

  it('affiche un log legacy + un log mother-session avec badges source', () => {
    useHistoryMock.mockReturnValue({
      logs: [MOTHER_LOG, LEGACY_LOG],
      clearLogs: vi.fn(),
    })

    renderWithRouter(<HistoryPage />, { initialEntries: ['/history'] })

    const entries = screen.getAllByTestId('history-log-entry')
    expect(entries).toHaveLength(2)

    // Source badges
    const badges = screen.getAllByTestId('log-source-badge')
    expect(badges[0]).toHaveTextContent('Programme annuel')
    expect(badges[1]).toHaveTextContent('Programme historique')
  })

  it('sessionLabel visible si présent', () => {
    useHistoryMock.mockReturnValue({
      logs: [LEGACY_LOG],
      clearLogs: vi.fn(),
    })

    renderWithRouter(<HistoryPage />, { initialEntries: ['/history'] })

    expect(screen.getByTestId('log-title')).toHaveTextContent('Lower Force')
  })

  it('annualWeekCode visible pour mother-session', () => {
    useHistoryMock.mockReturnValue({
      logs: [MOTHER_LOG],
      clearLogs: vi.fn(),
    })

    renderWithRouter(<HistoryPage />, { initialEntries: ['/history'] })

    expect(screen.getByTestId('log-week-label')).toHaveTextContent('OFF_S03')
    expect(screen.getByTestId('log-cycle-label')).toHaveTextContent('Hors-saison')
  })

  it('stats rapides calculées', () => {
    useHistoryMock.mockReturnValue({
      logs: [MOTHER_LOG, LEGACY_LOG],
      clearLogs: vi.fn(),
    })

    renderWithRouter(<HistoryPage />, { initialEntries: ['/history'] })

    expect(screen.getByTestId('history-stats')).toBeInTheDocument()
    expect(screen.getByTestId('stat-total')).toHaveTextContent('2')
    expect(screen.getByTestId('stat-mother')).toHaveTextContent('1')
    expect(screen.getByTestId('stat-legacy')).toHaveTextContent('1')
  })

  it('état vide → pas de stats', () => {
    useHistoryMock.mockReturnValue({
      logs: [],
      clearLogs: vi.fn(),
    })

    renderWithRouter(<HistoryPage />, { initialEntries: ['/history'] })

    expect(screen.queryByTestId('history-stats')).toBeNull()
    expect(screen.getByText('Aucune séance')).toBeInTheDocument()
  })
})

// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen, fireEvent } from '@testing-library/react'
import { ProfilePage } from '../ProfilePage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockUpdateProfile = vi.fn()
const mockEvents: any[] = []

const mockDetectCtx = vi.fn()

vi.mock('../../services/season/detectAnnualPlanningContext', () => ({
  detectAnnualPlanningContext: (...args: unknown[]) => mockDetectCtx(...args),
}))

vi.mock('../../services/analytics/posthog', () => ({
  posthog: { capture: vi.fn() },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    authState: { status: 'authenticated', user: { id: 'u1', avatarUrl: null } },
    updateAvatar: vi.fn(),
  }),
}))

vi.mock('../../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: {
      level: 'intermediate',
      equipment: ['barbell'],
      injuries: [],
      weeklySessions: 3,
      seasonMode: 'in_season',
      ageBand: 'adult',
      rugbyPosition: 'BACK_THREE',
      position: 'BACK_THREE',
      trainingLevel: 'performance',
      performanceFocus: 'balanced',
      populationSegment: 'male_senior',
      parentalConsentHealthData: false,
      healthConsentStatus: 'not_required',
      healthDataRetentionState: 'active',
      healthConsentAuditTrail: [],
      planningAnchors: {},
    },
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    resetProfile: vi.fn(),
  }),
}))

vi.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => ({ events: mockEvents }),
}))

vi.mock('../../hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => ({ features: {}, isPremium: false, loading: false }),
}))

vi.mock('../../hooks/useUpsellTiming', () => ({
  useUpsellTiming: () => ({ canShowUpsell: false }),
  isDismissed: () => true,
  dismissUpsell: vi.fn(),
  markWeekViewed: vi.fn(),
}))

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    status: 'default',
    errorMessage: null,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
}))

vi.mock('../../services/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ data: [], error: null }) }) }) },
}))

vi.mock('../../services/calendar/ffrSyncService', () => ({
  fetchCompetitions: vi.fn().mockResolvedValue([]),
  syncCalendar: vi.fn().mockResolvedValue({ added: 0, updated: 0 }),
}))

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ProfilePage · Ma situation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEvents.length = 0
    mockDetectCtx.mockReturnValue({ cycle: 'in_season' })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders "Ma situation" section instead of old season selector', () => {
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    expect(screen.getByTestId('ma-situation')).toBeInTheDocument()
    // Old selector should be gone
    expect(screen.queryByText('Période actuelle')).toBeNull()
  })

  it('displays detected cycle from real annual context detection', () => {
    mockDetectCtx.mockReturnValue({ cycle: 'in_season' })
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    expect(screen.getByTestId('situation-cycle')).toHaveTextContent('En saison')
  })

  it('displays "Phase finale" when annual context detects playoffs', () => {
    mockDetectCtx.mockReturnValue({ cycle: 'playoffs' })
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    expect(screen.getByTestId('situation-cycle')).toHaveTextContent('Phase finale')
  })

  it('displays "Aucun match prévu" when no future matches', () => {
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    expect(screen.getByTestId('situation-next-match')).toHaveTextContent('Aucun match prévu')
  })

  it('displays "Aucun calendrier" when no events', () => {
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    expect(screen.getByTestId('situation-calendar')).toHaveTextContent('Aucun calendrier')
  })

  it('displays FFR calendar source count', () => {
    mockEvents.push(
      { id: '1', date: '2026-04-10', type: 'match', source: 'ffr_import' },
      { id: '2', date: '2026-04-17', type: 'match', source: 'ffr_import' },
    )
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    expect(screen.getByTestId('situation-calendar')).toHaveTextContent('FFR (2 matchs)')
  })

  it('displays "Manuel" when only manual events', () => {
    mockEvents.push(
      { id: '1', date: '2026-04-10', type: 'match', source: 'manual' },
    )
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    expect(screen.getByTestId('situation-calendar')).toHaveTextContent('Manuel')
  })

  it('"La saison est finie" writes seasonEndedAt anchor + seasonMode compat', () => {
    mockEvents.push(
      { id: '1', date: '2026-03-15', type: 'match', source: 'manual' },
    )
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    fireEvent.click(screen.getByTestId('situation-season-ended'))

    expect(mockUpdateProfile).toHaveBeenCalledTimes(1)
    const call = mockUpdateProfile.mock.calls[0][0]
    // Primary: anchor
    expect(call.planningAnchors.seasonEndedAt).toBe('2026-03-15')
    // Transitional compat
    expect(call.seasonMode).toBe('off_season')
    // manualPlayoffs cleared
    expect(call.planningAnchors.manualPlayoffs).toBeUndefined()
  })

  it('"La saison est finie" falls back to today when no past match', () => {
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    fireEvent.click(screen.getByTestId('situation-season-ended'))

    const call = mockUpdateProfile.mock.calls[0][0]
    // Falls back to today since no past match
    expect(call.planningAnchors.seasonEndedAt).toBeDefined()
    expect(typeof call.planningAnchors.seasonEndedAt).toBe('string')
  })

  it('"Je n\'ai plus de match" writes seasonEndedAt = today and clears manualPlayoffs', () => {
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    fireEvent.click(screen.getByTestId('situation-no-match'))

    const call = mockUpdateProfile.mock.calls[0][0]
    expect(call.planningAnchors.seasonEndedAt).toBeDefined()
    expect(call.seasonMode).toBe('off_season')
    // manualPlayoffs must be cleared to avoid stale playoff state
    expect(call.planningAnchors.manualPlayoffs).toBeUndefined()
  })

  it('no internal jargon in the section', () => {
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    const section = screen.getByTestId('ma-situation')
    const text = section.textContent ?? ''
    const jargon = ['mode calendrier', 'mode bloc', 'mésocycle', 'DUP', 'ACWR', 'scheduling', 'sequential']
    for (const term of jargon) {
      expect(text.toLowerCase()).not.toContain(term.toLowerCase())
    }
  })
})

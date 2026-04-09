// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen, fireEvent } from '@testing-library/react'
import { ProfilePage } from '../ProfilePage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'
import type { CalendarEvent } from '../../types/training'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockUpdateProfile = vi.fn()
const mockEvents: CalendarEvent[] = []
let mockProfileOverrides: Record<string, unknown> = {}

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
      ...mockProfileOverrides,
    },
    updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    resetProfile: vi.fn(),
  }),
}))

vi.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => ({
    events: mockEvents,
    visibleEvents: mockEvents.filter((event) => event.user_hidden !== true),
    structuralEvents: mockEvents.filter((event) => event.user_hidden !== true),
  }),
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
    mockProfileOverrides = {}
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
    // Source tag
    expect(call.planningAnchors.seasonEndedSource).toBe('manual')
    // Transitional compat
    expect(call.seasonMode).toBe('off_season')
    // manualPlayoffs cleared
    expect(call.planningAnchors.manualPlayoffs).toBeUndefined()
    // Journal entry written
    expect(call.seasonTransitionState).toBeDefined()
    expect(call.seasonTransitionState.transitionJournal).toHaveLength(1)
    expect(call.seasonTransitionState.transitionJournal[0].to).toBe('off_season')
  })

  it('ignores hidden reserve matches for cycle detection and season-ended anchor', () => {
    mockEvents.push(
      { id: 'hidden', date: '2026-03-22', type: 'match', source: 'ffr_import', user_hidden: true },
      { id: 'visible', date: '2026-03-15', type: 'match', source: 'manual' },
    )
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    expect(mockDetectCtx).toHaveBeenCalled()
    expect(mockDetectCtx.mock.calls[0][0].events).toEqual([
      { date: '2026-03-15', type: 'match' },
    ])

    fireEvent.click(screen.getByTestId('situation-season-ended'))

    const call = mockUpdateProfile.mock.calls[0][0]
    expect(call.planningAnchors.seasonEndedAt).toBe('2026-03-15')
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

  it('shows "En fait, la saison reprend" when seasonEndedAt is set (no journal)', () => {
    mockProfileOverrides = {
      seasonMode: 'off_season',
      planningAnchors: { seasonEndedAt: '2026-03-29' },
    }

    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    expect(screen.getByTestId('situation-confirmed')).toHaveTextContent('Saison terminée')
    expect(screen.getByTestId('situation-resume-season')).toHaveTextContent('En fait, la saison reprend')

    fireEvent.click(screen.getByTestId('situation-resume-season'))

    expect(mockUpdateProfile).toHaveBeenCalledTimes(1)
    const call = mockUpdateProfile.mock.calls[0][0]
    // Fallback path: no journal → simple clear
    expect(call.planningAnchors.seasonEndedAt).toBeUndefined()
    expect(call.planningAnchors.seasonEndedSource).toBeUndefined()
    expect(call.seasonMode).toBe('in_season')
  })

  it('"En fait, la saison reprend" restores from journal when available', () => {
    mockProfileOverrides = {
      seasonMode: 'off_season',
      planningAnchors: { seasonEndedAt: '2026-03-29', seasonEndedSource: 'manual' },
      seasonTransitionState: {
        transitionJournal: [{
          id: 't-1',
          at: '2026-03-29',
          trigger: 'user_manual',
          from: { cycle: 'in_season', weekNumber: 10, schedulingMode: 'calendar' },
          anchorsSnapshot: { manualPlayoffs: true },
          to: 'off_season',
        }],
      },
    }

    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })
    fireEvent.click(screen.getByTestId('situation-resume-season'))

    expect(mockUpdateProfile).toHaveBeenCalledTimes(1)
    const call = mockUpdateProfile.mock.calls[0][0]
    // Restored from journal snapshot
    expect(call.planningAnchors.manualPlayoffs).toBe(true)
    expect(call.planningAnchors.seasonEndedAt).toBeUndefined()
    expect(call.seasonMode).toBe('in_season')
    // Journal trimmed
    expect(call.seasonTransitionState.transitionJournal).toBeUndefined()
  })
})

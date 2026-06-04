// @vitest-environment jsdom

import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, screen, fireEvent, within } from '@testing-library/react'
import { ProfilePage } from '../ProfilePage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'

vi.mock('../../services/season/detectAnnualPlanningContext', () => ({
  detectAnnualPlanningContext: vi.fn().mockReturnValue({ cycle: 'in_season' }),
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
      preferredLanguage: 'fr',
      heightCm: 182,
      weightKg: 90,
    },
    updateProfile: vi.fn(),
    resetProfile: vi.fn(),
  }),
}))

vi.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => ({ events: [], visibleEvents: [], structuralEvents: [] }),
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

vi.mock('../../hooks/useHistory', () => ({
  useHistory: () => ({ logs: [], addLog: vi.fn(), clearLogs: vi.fn() }),
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
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ data: [], error: null }) }) }),
    rpc: vi.fn().mockResolvedValue({
      data: { cap: 100, issued: 0, accepting_new: true },
      error: null,
    }),
  },
}))

vi.mock('../../services/calendar/ffrSyncService', () => ({
  fetchCompetitions: vi.fn().mockResolvedValue([]),
  syncCalendar: vi.fn().mockResolvedValue({ added: 0, updated: 0 }),
}))

describe('ProfilePage · Préférences', () => {
  afterEach(() => {
    cleanup()
  })

  it('groups language and morphology under profile-section-preferences when opened', () => {
    renderWithRouter(<ProfilePage />, { initialEntries: ['/profile'] })

    const section = screen.getByTestId('profile-section-preferences')
    fireEvent.click(within(section).getByRole('button'))

    expect(screen.getByTestId('profile-section-language')).toBeInTheDocument()
    expect(screen.getByTestId('profile-section-morphology')).toBeInTheDocument()
    expect(screen.getByText('Français')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('182')).toBeInTheDocument()
  })
})

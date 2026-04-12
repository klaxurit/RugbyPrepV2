// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { ProgressPage } from '../ProgressPage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'
import type { SessionLog } from '../../types/training'

const useHistoryMock = vi.fn()
const useBlockLogsMock = vi.fn()
const useAthleteTestsMock = vi.fn()
const useProfileMock = vi.fn()
const useFeatureAccessMock = vi.fn()

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

vi.mock('../../hooks/useAthleteTests', () => ({
  useAthleteTests: () => useAthleteTestsMock(),
}))

vi.mock('../../hooks/useProfile', () => ({
  useProfile: () => useProfileMock(),
}))

vi.mock('../../hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => useFeatureAccessMock(),
}))

vi.mock('../../data/fakeDataForProgress', () => ({
  seedDemoData: vi.fn(),
  clearDemoMode: vi.fn(),
  isDemoModeActive: () => false,
  DEMO_MODE_KEY: 'demo',
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

const BASE_PROFILE = {
  level: 'intermediate',
  equipment: ['barbell', 'dumbbell', 'bench'],
  injuries: [],
  weeklySessions: 2,
  seasonMode: 'in_season',
  ageBand: 'adult',
  rugbyPosition: 'FRONT_ROW',
  position: 'FRONT_ROW',
  trainingLevel: 'builder',
  performanceFocus: 'balanced',
  populationSegment: 'male_senior',
}

describe('ProgressPage · adherence & recent activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBlockLogsMock.mockReturnValue({
      logs: [],
      getLastEntryForExercise: () => undefined,
    })
    useAthleteTestsMock.mockReturnValue({
      addTest: vi.fn(),
      getHistoryFor: () => [],
      getBestFor: () => undefined,
    })
    useProfileMock.mockReturnValue({ profile: BASE_PROFILE })
    useFeatureAccessMock.mockReturnValue({
      features: { premiumAnalytics: false, premiumProgramAdaptations: false },
      isPremium: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('section adhérence visible avec logs mixtes', () => {
    useHistoryMock.mockReturnValue({
      logs: [MOTHER_LOG, LEGACY_LOG],
      clearLogs: vi.fn(),
    })

    renderWithRouter(<ProgressPage />, { initialEntries: ['/progress'] })

    expect(screen.getByTestId('adherence-section')).toBeInTheDocument()
    expect(screen.getByTestId('adherence-7d')).toBeInTheDocument()
    expect(screen.getByTestId('adherence-28d')).toBeInTheDocument()
  })

  it('activité récente visible avec logs mixtes', () => {
    useHistoryMock.mockReturnValue({
      logs: [MOTHER_LOG, LEGACY_LOG],
      clearLogs: vi.fn(),
    })

    renderWithRouter(<ProgressPage />, { initialEntries: ['/progress'] })

    expect(screen.getByTestId('recent-activity-section')).toBeInTheDocument()

    const entries = screen.getAllByTestId('recent-session-entry')
    expect(entries.length).toBeGreaterThanOrEqual(2)

    // Titres
    const titles = screen.getAllByTestId('recent-title')
    expect(titles[0]).toHaveTextContent('Full Body Récupération A')
    expect(titles[1]).toHaveTextContent('Lower Force')

    // Week labels
    const weekLabels = screen.getAllByTestId('recent-week-label')
    expect(weekLabels[0]).toHaveTextContent('OFF_S03')
    expect(weekLabels[1]).toHaveTextContent('S2')
  })

  it('sections existantes (sessions tab) non cassées — état vide', () => {
    useHistoryMock.mockReturnValue({
      logs: [],
      clearLogs: vi.fn(),
    })

    renderWithRouter(<ProgressPage />, { initialEntries: ['/progress'] })

    // Pas d'adhérence ni activité récente quand vide
    expect(screen.queryByTestId('adherence-section')).toBeNull()
    expect(screen.queryByTestId('recent-activity-section')).toBeNull()

    // L'empty state des progress rows est toujours là
    expect(screen.getByText('Données insuffisantes')).toBeInTheDocument()
  })
})

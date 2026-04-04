// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { MOTHER_SESSIONS_BY_ID } from '../../data/motherSessions.generated'
import type { ResolveMotherSessionsForWeekResult } from '../../services/motherSession/resolveMotherSessionsForWeek'
import type { WeeklyProgramSurfaceResult } from '../../services/program/resolveWeeklyProgramSurface'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { SchedulingMode, SchedulingModeResult, WeekPresentation, SequentialSession, BlockProgressionState } from '../../types/scheduling'
import { HomePage } from '../HomePage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'

// ── Helpers ────────────────────────────────────────────────────────────────

function makePlanningContext(cycle: AnnualPlanningContext['cycle'] = 'off_season'): AnnualPlanningContext {
  return {
    cycle,
    offSeasonPhase: cycle === 'off_season' ? 1 : undefined,
    weekNumber: 1,
    weekLabel: `${cycle} — S1`,
    isDeloadWeek: false,
    isMatchWeek: false,
    firstMatchDate: null,
    lastMatchDate: null,
    offSeasonStartAt: null,
    daysUntilNextMatch: null,
    daysSinceLastMatch: null,
    fatigueLevel: 'normal',
    weeklyFrequency: 3,
    positionGroup: 'back_three',
    planningTrace: {
      resolutionMode: 'backfilled',
      rulesApplied: [],
      warnings: [],
    },
  }
}

function makeSchedulingModeResult(mode: SchedulingMode = 'calendar'): SchedulingModeResult {
  return {
    mode,
    confidence: 'high',
    reason: mode === 'calendar' ? 'future_matches_detected' : 'no_data',
    calendarSignalStrength: mode === 'calendar' ? 2 : 0,
  }
}

const DEFAULT_BLOCK_PROGRESSION: BlockProgressionState = {
  currentBlockIndex: 1,
  sessionsCompletedInBlock: 5,
  totalSessionsInBlock: 12,
  consecutiveIncompleteBlocks: 0,
  currentBlockLabel: 'Inter-saison · Force',
  lastAdvancedAt: '2026-04-01',
}

function makeSurface(
  mode: SchedulingMode,
  cycle: AnnualPlanningContext['cycle'] = 'off_season',
): WeeklyProgramSurfaceResult {
  const session = MOTHER_SESSIONS_BY_ID['FULL_OFFSEASON_RECOVERY_A_V1']
  if (!session) throw new Error('Missing FULL_OFFSEASON_RECOVERY_A_V1')

  const planningContext = makePlanningContext(cycle)
  const msResult: ResolveMotherSessionsForWeekResult = {
    status: 'resolved',
    planningContext,
    sessions: [
      { sessionId: 'FULL_OFFSEASON_RECOVERY_A_V1', session, role: 'primary', dayPreference: 'early_week' },
    ],
    warnings: [],
    companionRecommendations: [],
  }

  return {
    primarySource: 'mother_session',
    planningContext,
    planningInputWarnings: [],
    warnings: [],
    decisionReason: `Cycle ${cycle}`,
    motherSession: msResult,
    schedulingMode: mode,
    schedulingModeResult: makeSchedulingModeResult(mode),
  }
}

function hookResult(surface: WeeklyProgramSurfaceResult) {
  const isSequential = surface.schedulingMode === 'sequential'
  const sessions = surface.motherSession?.sessions ?? []

  const weekPresentation: WeekPresentation = isSequential
    ? {
        mode: 'sequential',
        sessions: sessions.map((slot, i): SequentialSession => ({
          kind: 'sequential',
          sessionSlot: slot,
          sequenceIndex: i + 1,
          totalInWeek: sessions.length,
          completionStatus: 'pending',
        })),
        matchEvents: [],
        unavailableDays: [],
        clubDays: [],
        corrections: [],
      }
    : {
        mode: 'calendar',
        sessions: [],
        matchEvents: [],
        unavailableDays: [],
        clubDays: [],
        corrections: [],
      }

  return {
    isReady: true,
    surface,
    schedulingMode: surface.schedulingMode,
    weekPresentation,
    blockProgression: isSequential ? DEFAULT_BLOCK_PROGRESSION : undefined,
  }
}

// ── Mocks ──────────────────────────────────────────────────────────────────

const useWeeklyProgramSurfaceMock = vi.fn()
const useProfileMock = vi.fn()

vi.mock('../../services/analytics/posthog', () => ({
  posthog: { capture: vi.fn() },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    authState: { status: 'authenticated', user: { id: 'u1', avatarUrl: null } },
    isInitializing: false,
    signOut: vi.fn(),
  }),
}))

vi.mock('../../hooks/useProfile', () => ({
  useProfile: (...args: unknown[]) => useProfileMock(...args),
}))

vi.mock('../../hooks/useWeek', () => ({
  useWeek: () => ({ week: 'W1', setWeek: vi.fn(), lastNonDeloadWeek: 'W1' }),
}))

vi.mock('../../hooks/useFatigue', () => ({
  useFatigue: () => ({ fatigue: 'OK', setFatigue: vi.fn() }),
}))

vi.mock('../../hooks/useHistory', () => ({
  useHistory: () => ({ logs: [] }),
}))

vi.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => ({ events: [], nextMatch: null, isMatchDay: false }),
}))

vi.mock('../../hooks/useAdaptiveSchedule', () => ({
  useAdaptiveSchedule: () => undefined,
}))

vi.mock('../../hooks/useACWR', () => ({
  useACWR: () => ({ acwr: null, zone: null, hasSufficientData: false, weeksOfData: 0 }),
  ACWR_ZONE_CONFIG: {},
}))

vi.mock('../../hooks/useProgramFeatureFlags', () => ({
  useProgramFeatureFlags: () => ({ featureFlags: {}, rollout: { enabled: true } }),
}))

vi.mock('../../hooks/useWeeklyProgramSurface', () => ({
  useWeeklyProgramSurface: (params: unknown) => useWeeklyProgramSurfaceMock(params),
}))

vi.mock('../../hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => ({ isPremium: false, loading: false }),
}))

vi.mock('../../hooks/useAthleteTests', () => ({
  useAthleteTests: () => ({ getHistoryFor: () => [] }),
}))

vi.mock('../../hooks/useBlockLogs', () => ({
  useBlockLogs: () => ({ logs: [] }),
}))

vi.mock('../../hooks/useReadinessScore', () => ({
  useReadinessScore: () => ({
    score: 70,
    zone: 'good',
    label: 'Bonne',
    color: 'green',
    components: {
      acwr: { score: 25, weight: 0.4, raw: 1.0, label: 'Optimal' },
      fatigue: { score: 25, weight: 0.3, raw: 'OK', label: 'OK' },
      recovery: { score: 20, weight: 0.3, raw: 48, label: '48h' },
    },
  }),
}))

vi.mock('../../hooks/useWeeklySummary', () => ({
  useWeeklySummary: () => ({ adherence: 0, loadTrend: 'stable', sessionsCompleted: 0, sessionsPlanned: 3 }),
}))

const mockSchedulingTransition = vi.fn()

vi.mock('../../hooks/useSchedulingTransition', () => ({
  useSchedulingTransition: (...args: unknown[]) => mockSchedulingTransition(...args),
}))

vi.mock('../../hooks/useSeasonTransitions', () => ({
  useSeasonTransitions: () => ({ transition: null, dismiss: vi.fn() }),
}))

vi.mock('../../hooks/useUpsellTiming', () => ({
  markWeekViewed: vi.fn(),
  useUpsellTiming: () => ({ canShowUpsell: false }),
  isDismissed: () => true,
  dismissUpsell: vi.fn(),
}))

vi.mock('../../services/program', () => ({
  validateSession: () => ({ isValid: true, warnings: [] }),
}))

const BASE_PROFILE = {
  level: 'intermediate',
  equipment: ['barbell', 'dumbbell', 'bench'],
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
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('HomePage · S6 — dual-mode scheduling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE }, updateProfile: vi.fn() })
    mockSchedulingTransition.mockReturnValue({ transition: null, dismiss: vi.fn() })
  })

  afterEach(() => {
    cleanup()
  })

  // ── Calendar mode ──

  it('calendar mode: shows "Pas de séance aujourd\'hui" when no today session', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('calendar', 'in_season')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByText("Pas de séance aujourd'hui")).toBeInTheDocument()
  })

  it('calendar mode: week badge shows cycle week (W1)', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('calendar')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByTestId('home-stats-cycle')).toHaveTextContent('W1')
  })

  it('calendar mode: sessions stat shows weekly count', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('calendar')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByTestId('home-stats-sessions')).toHaveTextContent('0/3')
  })

  it('calendar mode: CTA says "Voir ma semaine" when no today session', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('calendar')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByTestId('home-cta-primary')).toHaveTextContent('Voir ma semaine')
  })

  // ── Sequential mode ──

  it('sequential mode: shows "Ta prochaine séance" framing', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('sequential')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByTestId('home-hero-label')).toHaveTextContent('Ta prochaine séance')
  })

  it('sequential mode: shows block label badge instead of cycle week', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('sequential')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByText('Inter-saison · Force')).toBeInTheDocument()
  })

  it('sequential mode: shows "Séance N sur M" in hero subtitle', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('sequential')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByTestId('home-hero-sequence')).toHaveTextContent('Séance 1 sur 1')
  })

  it('sequential mode: stats show block progression counts', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('sequential')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByTestId('home-stats-sessions')).toHaveTextContent('5/12')
    expect(screen.getByTestId('home-stats-cycle')).toHaveTextContent('B2')
  })

  it('sequential mode: CTA says "Commencer la séance" when session available', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('sequential')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByTestId('home-cta-primary')).toHaveTextContent('Commencer la séance')
  })

  // ── No internal jargon ──

  it('no internal engine terminology appears in UI copy', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('sequential')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    const text = document.body.textContent ?? ''
    const jargon = ['mode calendrier', 'mode bloc', 'mésocycle', 'DUP', 'W1-W8', 'DELOAD', 'backfilled']
    for (const term of jargon) {
      expect(text.toLowerCase()).not.toContain(term.toLowerCase())
    }
  })

  // ── S4 Slice 3 — summaryLine + transitions ──

  it('renders summaryLine in hero card', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('calendar', 'in_season')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByTestId('home-summary-line')).toBeInTheDocument()
  })

  it('does NOT render PlanningContextCard', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('calendar', 'in_season')))
    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.queryByTestId('planning-context-card')).toBeNull()
    expect(screen.queryByTestId('planning-context-toggle')).toBeNull()
  })

  it('renders scheduling transition banner when present', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue(hookResult(makeSurface('calendar')))
    mockSchedulingTransition.mockReturnValue({
      transition: {
        type: 'calendar_mode_activated',
        message: 'Match détecté — ton programme s\'adapte à ton calendrier.',
        cta: 'OK',
      },
      dismiss: vi.fn(),
    })

    renderWithRouter(<HomePage />, { initialEntries: ['/home'] })

    expect(screen.getByTestId('transition-banner')).toBeInTheDocument()
    expect(screen.getByTestId('transition-banner-cta')).toBeInTheDocument()
  })
})

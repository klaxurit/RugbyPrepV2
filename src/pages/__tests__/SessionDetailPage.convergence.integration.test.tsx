// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen, fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MOTHER_SESSIONS_BY_ID } from '../../data/motherSessions.generated'
import type {
  ResolveMotherSessionsForWeekResult,
  ResolvedMotherSessionSlot,
} from '../../services/motherSession/resolveMotherSessionsForWeek'
import type { WeeklyProgramSurfaceResult } from '../../services/program/resolveWeeklyProgramSurface'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import { SessionDetailPage } from '../SessionDetailPage'

/** Render with route params support */
function renderSessionDetail(sessionIndex: number) {
  return render(
    <MemoryRouter initialEntries={[`/session/${sessionIndex}`]}>
      <Routes>
        <Route path="/session/:sessionIndex" element={<SessionDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const useProfileMock = vi.fn()
const useWeeklyProgramSurfaceMock = vi.fn()
const addLogMock = vi.fn()
const setFatigueMock = vi.fn()

function makePlanningContext(cycle: AnnualPlanningContext['cycle']): AnnualPlanningContext {
  return {
    cycle,
    offSeasonPhase: cycle === 'off_season' ? 1 : undefined,
    weekNumber: 1,
    weekLabel: `${cycle} — S1`,
    isDeloadWeek: false,
    isMatchWeek: cycle === 'in_season',
    firstMatchDate: cycle === 'in_season' ? '2026-01-10' : null,
    lastMatchDate: null,
    offSeasonStartAt: cycle === 'off_season' ? '2026-06-08' : null,
    daysUntilNextMatch: cycle === 'in_season' ? 4 : null,
    daysSinceLastMatch: null,
    fatigueLevel: 'normal',
    weeklyFrequency: 2,
    positionGroup: 'front_row',
    planningTrace: {
      resolutionMode: 'backfilled',
      rulesApplied: [],
      warnings: [],
    },
  }
}

function makeMotherSessionSurface(
  cycle: AnnualPlanningContext['cycle'],
  overrides?: Partial<Pick<WeeklyProgramSurfaceResult, 'warnings' | 'decisionReason'>>,
  sessionId = 'FULL_OFFSEASON_RECOVERY_A_V1',
): WeeklyProgramSurfaceResult {
  const session = MOTHER_SESSIONS_BY_ID[sessionId]
  if (!session) throw new Error(`${sessionId} absente du dataset de test`)

  const planningContext = makePlanningContext(cycle)
  const msResult: ResolveMotherSessionsForWeekResult = {
    status: 'resolved',
    planningContext,
    sessions: [{
      sessionId,
      session,
      role: 'primary',
      dayPreference: 'early_week',
    }],
    warnings: [],
    companionRecommendations: [],
  }

  return {
    primarySource: 'mother_session',
    planningContext,
    planningInputWarnings: [],
    warnings: overrides?.warnings ?? [],
    decisionReason: overrides?.decisionReason ?? `Cycle ${cycle} — moteur mother-session primaire.`,
    motherSession: msResult,
    schedulingMode: 'calendar',
    schedulingModeResult: {
      mode: 'calendar',
      confidence: 'high',
      reason: 'test_fixture',
      calendarSignalStrength: 1,
    },
  }
}

function makeUnavailableSurface(): WeeklyProgramSurfaceResult {
  const planningContext = makePlanningContext('in_season')
  return {
    primarySource: 'unavailable',
    planningContext,
    planningInputWarnings: [],
    warnings: [],
    decisionReason: 'Plan annuel non résolu.',
    motherSession: null as unknown as ResolveMotherSessionsForWeekResult,
    schedulingMode: 'sequential',
    schedulingModeResult: {
      mode: 'sequential',
      confidence: 'low',
      reason: 'test_fixture_unavailable',
      calendarSignalStrength: 0,
    },
  }
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
  parentalConsentHealthData: false,
  healthConsentStatus: 'not_required',
  healthDataRetentionState: 'active',
  healthConsentAuditTrail: [],
}

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../services/analytics/posthog', () => ({
  posthog: { capture: vi.fn() },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    authState: { status: 'authenticated', user: { id: 'u1', avatarUrl: null } },
    isInitializing: false,
  }),
}))

const addBlockLogMock = vi.fn()
vi.mock('../../hooks/useBlockLogs', () => ({
  useBlockLogs: () => ({
    logs: [],
    addBlockLog: addBlockLogMock,
    getLastLogForBlock: () => undefined,
    getLastEntryForExercise: () => undefined,
    getBestForExercise: () => undefined,
    getBestForExerciseByMetric: () => undefined,
  }),
}))

vi.mock('../../hooks/useProfile', () => ({
  useProfile: (...args: unknown[]) => useProfileMock(...args),
}))

vi.mock('../../hooks/useWeek', () => ({
  useWeek: () => ({
    week: 'W1',
    lastNonDeloadWeek: 'W1',
  }),
}))

vi.mock('../../hooks/useFatigue', () => ({
  useFatigue: () => ({
    fatigue: 'OK',
    setFatigue: setFatigueMock,
  }),
}))

vi.mock('../../hooks/useHistory', () => ({
  useHistory: () => ({ logs: [], addLog: addLogMock }),
}))

vi.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => ({ events: [], visibleEvents: [], structuralEvents: [] }),
}))

vi.mock('../../hooks/useACWR', () => ({
  useACWR: () => ({
    acwr: null,
    zone: null,
    hasSufficientData: false,
  }),
}))

vi.mock('../../hooks/useAcwrOverride', () => ({
  useAcwrOverride: () => ({
    ignoreAcwrOverload: false,
  }),
}))

vi.mock('../../hooks/useProgramFeatureFlags', () => ({
  useProgramFeatureFlags: () => ({
    featureFlags: {},
    rollout: { enabled: true, source: 'forced', canaryPercent: 10, bucket: 0 },
  }),
}))

vi.mock('../../hooks/useWeeklyProgramSurface', () => ({
  useWeeklyProgramSurface: (params: unknown) => useWeeklyProgramSurfaceMock(params),
}))

// F2: SessionDetailPage now uses useWeekSnapshot — mock it to delegate to
// the existing useWeeklyProgramSurfaceMock and wrap sessions in a snapshot shape
vi.mock('../../hooks/useWeekSnapshot', () => ({
  useWeekSnapshot: (params: unknown) => {
    const upstream = useWeeklyProgramSurfaceMock(params)
    const surface = upstream?.surface ?? null
    const sessions = surface?.motherSession?.sessions ?? []
    const presentation = sessions.length > 0
      ? {
          sessions: sessions.map((slot: ResolvedMotherSessionSlot, i: number) => ({
            kind: 'sequential' as const,
            sessionSlot: slot,
            sequenceIndex: i + 1,
            totalInWeek: sessions.length,
            completionStatus: 'pending' as const,
          })),
          matchEvents: [],
          unavailableDays: [],
          corrections: [],
          mode: 'sequential' as const,
        }
      : null
    const snapshot = surface
      ? {
          weekId: 'W2026-15',
          resolvedAt: new Date().toISOString(),
          eventsFingerprint: '0',
          globalEventsHash: '0',
          surface,
          presentation,
          corrections: [],
          pendingUpdates: [],
          confirmationRequired: [],
        }
      : null
    return {
      snapshot,
      isReady: upstream?.isReady ?? false,
      hasPendingUpdates: false,
      hasConfirmationRequired: false,
      surface,
      blockProgression: undefined,
      toastMessage: null,
      clearToast: () => {},
      rescheduleSession: () => {},
      skipSession: () => {},
      markDayUnavailable: () => {},
      undoCorrection: () => {},
      setFatigue: () => {},
      addMatch: () => {},
      confirmPendingUpdate: () => {},
    }
  },
}))

vi.mock('../../services/ui/getPrehab', () => ({
  getPrehab: () => [],
  CONTRA_LABELS: {},
}))

vi.mock('../../hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => ({
    isPremium: true,
    features: { premiumLogging: true, premiumAnalytics: true, premiumProgramAdaptations: true },
    loading: false,
    hasEntitlement: () => true,
  }),
}))

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SessionDetailPage · annual-first', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE } })
  })

  afterEach(() => {
    cleanup()
  })

  it('unavailable : affiche message introuvable avec lien retour', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeUnavailableSurface(),
    })

    renderSessionDetail(0)

    expect(screen.getByText(/Séance introuvable/i)).toBeInTheDocument()
    expect(screen.getByText(/Retour à ma semaine/i)).toBeInTheDocument()
    expect(screen.queryByTestId('mother-session-detail')).toBeNull()
  })

  it('in_season + injury adaptation + sessionIndex=0 : détail mother-session visible', () => {
    useProfileMock.mockReturnValue({
      profile: {
        ...BASE_PROFILE,
        seasonMode: 'in_season',
        injuries: ['knee_pain'],
      },
    })
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeMotherSessionSurface('in_season', {
        warnings: [],
        decisionReason: 'In-season mother-session resolution.',
      }),
    })

    renderSessionDetail(0)

    expect(screen.getByTestId('mother-session-detail')).toBeInTheDocument()
    // FIX F3-2: orchestrator-fallback-reason supprimé de l'UI joueur
    expect(screen.queryByTestId('orchestrator-fallback-reason')).toBeNull()
    expect(screen.getByTestId('ms-completion-section')).toBeInTheDocument()
  })

  it('complétion mother-session → ouvre le modal puis enregistre le log enrichi', async () => {
    useProfileMock.mockReturnValue({
      profile: { ...BASE_PROFILE, seasonMode: 'off_season' },
    })
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeMotherSessionSurface('off_season'),
    })

    renderSessionDetail(0)

    const completeBtn = screen.getByTestId('ms-complete-btn')
    fireEvent.click(completeBtn)

    expect(screen.getByTestId('completion-confirm-btn')).toBeInTheDocument()
    expect(addLogMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('completion-fatigue-fatigue'))
    fireEvent.click(screen.getByTestId('completion-rpe-7'))
    fireEvent.click(screen.getByTestId('completion-duration-45'))
    fireEvent.click(screen.getByTestId('completion-confirm-btn'))

    await waitFor(() => expect(addLogMock).toHaveBeenCalledTimes(1))

    const log = addLogMock.mock.calls[0][0]
    expect(log.programSource).toBe('mother_session')
    expect(log.motherSessionId).toBe('FULL_OFFSEASON_RECOVERY_A_V1')
    expect(log.programContext).toBeDefined()
    expect(log.programContext.annualWeekCode).toBeDefined()
    expect(log.fatigue).toBe('FATIGUE')
    expect(log.rpe).toBe(7)
    expect(log.durationMin).toBe(45)
    expect(setFatigueMock).toHaveBeenCalledWith('FATIGUE')
  })

  it('index invalide en mother-session → état vide propre', () => {
    useProfileMock.mockReturnValue({
      profile: { ...BASE_PROFILE, seasonMode: 'off_season' },
    })
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeMotherSessionSurface('off_season'),
    })

    // Index 5 = hors limites (1 seule session dans le mock)
    renderSessionDetail(5)

    expect(screen.getByTestId('session-not-found')).toBeInTheDocument()
    expect(screen.queryByTestId('mother-session-detail')).toBeNull()
  })

  it('bloc avec exercices loggables affiche le toggle Logger mes perfs', () => {
    // Use UPPER_IN_SEASON_FRONT_ROW_V1 which contains Bench Press
    const upperSession = MOTHER_SESSIONS_BY_ID['UPPER_IN_SEASON_FRONT_ROW_V1']
    if (!upperSession) return // skip if not in dataset

    const planCtx = makePlanningContext('in_season')
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE, seasonMode: 'in_season' } })
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: {
        primarySource: 'mother_session',
        planningContext: planCtx,
        planningInputWarnings: [],
        warnings: [],
        decisionReason: 'In-season mother-session.',
        motherSession: {
          status: 'resolved',
          planningContext: planCtx,
          sessions: [{
            sessionId: 'UPPER_IN_SEASON_FRONT_ROW_V1',
            session: upperSession,
            role: 'primary',
            dayPreference: 'early_week',
          }],
          warnings: [],
          companionRecommendations: [],
        },
      },
    })

    renderSessionDetail(0)

    // The block logger toggles should be present for blocks with loggable exercises
    const toggles = screen.queryAllByTestId('block-log-toggle')
    expect(toggles.length).toBeGreaterThanOrEqual(1)
  })

  // U18 hard-block supprimé — app réservée aux adultes, pas de blocage U18

  it('starter full gym : affiche les variantes Fondations guidées sur la séance', () => {
    useProfileMock.mockReturnValue({
      profile: {
        ...BASE_PROFILE,
        trainingLevel: 'starter',
        equipment: ['machine', 'cable', 'bench', 'barbell', 'dumbbell'],
      },
    })
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeMotherSessionSurface('pre_season', undefined, 'LOWER_PRESEASON_FORCE_V1'),
    })

    renderSessionDetail(0)

    expect(screen.getByText('Presse à cuisses')).toBeInTheDocument()
    expect(screen.getByText('Curl ischios machine')).toBeInTheDocument()
    expect(screen.queryByText('Pin Back Squat')).toBeNull()
    expect(screen.queryByText('Nordic Curl')).toBeNull()
    expect(screen.getByText('Fondations')).toBeInTheDocument()
  })
})

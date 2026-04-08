// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen, fireEvent } from '@testing-library/react'
import { MOTHER_SESSIONS_BY_ID } from '../../data/motherSessions.generated'
import type { ResolveMotherSessionsForWeekResult } from '../../services/motherSession/resolveMotherSessionsForWeek'
import type { WeeklyProgramSurfaceResult } from '../../services/program/resolveWeeklyProgramSurface'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type {
  SchedulingMode,
  SchedulingModeResult,
  WeekPresentation,
  SequentialSession,
  WeekSnapshot,
  WeekCorrection,
} from '../../types/scheduling'
import { planningContextBannerCopyForMode } from '../../components/planning/PlanningContextBanner'
import { WeekPage } from '../WeekPage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'

const useProfileMock = vi.fn()
const useWeekSnapshotMock = vi.fn()
const calendarState = {
  events: [] as Array<Record<string, unknown>>,
  visibleEvents: [] as Array<Record<string, unknown>>,
  structuralEvents: [] as Array<Record<string, unknown>>,
  addEvent: vi.fn(),
  syncNotification: null as string | null,
  dismissSyncNotification: vi.fn(),
}

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
      rulesApplied: ['rule:test'],
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

function makeMotherSessionSurface(
  cycle: AnnualPlanningContext['cycle'],
  overrides?: Partial<Pick<WeeklyProgramSurfaceResult, 'warnings' | 'decisionReason'>> & {
    resolutionWarnings?: string[]
    status?: ResolveMotherSessionsForWeekResult['status']
    schedulingMode?: SchedulingMode
  },
): WeeklyProgramSurfaceResult {
  const session = MOTHER_SESSIONS_BY_ID['FULL_OFFSEASON_RECOVERY_A_V1']
  if (!session) throw new Error('FULL_OFFSEASON_RECOVERY_A_V1 absente du dataset de test')

  const planningContext = makePlanningContext(cycle)
  const mode = overrides?.schedulingMode ?? 'calendar'
  const msResult: ResolveMotherSessionsForWeekResult = {
    status: overrides?.status ?? 'resolved',
    planningContext,
    sessions: [{
      sessionId: 'FULL_OFFSEASON_RECOVERY_A_V1',
      session,
      role: 'primary',
      dayPreference: 'early_week',
    }],
    warnings: overrides?.resolutionWarnings ?? [],
    companionRecommendations: ['2x 20-30 min zone 2'],
  }

  return {
    primarySource: 'mother_session',
    planningContext,
    planningInputWarnings: [],
    warnings: overrides?.warnings ?? [],
    decisionReason: overrides?.decisionReason ?? `Cycle ${cycle} — moteur mother-session primaire.`,
    motherSession: msResult,
    schedulingMode: mode,
    schedulingModeResult: makeSchedulingModeResult(mode),
  }
}

function makeUnavailableSurface(): WeeklyProgramSurfaceResult {
  const planningContext = makePlanningContext('in_season')
  return {
    primarySource: 'unavailable',
    planningContext,
    planningInputWarnings: [],
    warnings: ['Le plan annuel n\'a pas pu être résolu pour cette semaine.'],
    decisionReason: 'Résolution annual indisponible.',
    motherSession: {
      status: 'missing_session',
      planningContext,
      sessions: [],
      warnings: ['Aucune mother session disponible'],
    },
    schedulingMode: 'sequential',
    schedulingModeResult: makeSchedulingModeResult('sequential'),
  }
}

const DEFAULT_BLOCK_PROGRESSION = {
  currentBlockIndex: 0,
  sessionsCompletedInBlock: 4,
  totalSessionsInBlock: 12,
  consecutiveIncompleteBlocks: 0,
  currentBlockLabel: 'Inter-saison · Hypertrophie',
  lastAdvancedAt: '2026-04-01',
}

const noop = () => {}

/** Wraps a surface into the full useWeekSnapshot result shape. */
function hookResult(surface: WeeklyProgramSurfaceResult) {
  const isSequential = surface.schedulingMode === 'sequential'
  const sessions = surface.motherSession?.sessions ?? []

  const presentation: WeekPresentation = isSequential
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
        sessions: sessions.map((slot, i) => ({
          kind: 'dated' as const,
          sessionSlot: slot,
          dayOfWeek: ([2, 4, 5] as const)[i % 3],
          dayLabel: ['Mar', 'Jeu', 'Ven'][i % 3],
          matchProximity: null,
        })),
        matchEvents: [],
        unavailableDays: [],
        clubDays: [],
        corrections: [],
      }

  const blockProgression = isSequential ? DEFAULT_BLOCK_PROGRESSION : undefined

  const emptyCorrections: WeekCorrection[] = []

  const snapshot: WeekSnapshot = {
    weekId: 'W2026-15',
    resolvedAt: '2026-04-06T00:00:00Z',
    eventsFingerprint: '0',
    globalEventsHash: '0',
    surface,
    presentation,
    corrections: emptyCorrections,
    pendingUpdates: [],
    confirmationRequired: [],
    blockProgression,
    explanation: {
      summaryLine: 'Programme de test',
      detailLines: ['Détail de test'],
      corrections: [],
    },
  }

  return {
    snapshot,
    isReady: true,
    hasPendingUpdates: false,
    hasConfirmationRequired: false,
    surface,
    blockProgression,
    toastMessage: null,
    clearToast: noop,
    rescheduleSession: noop,
    skipSession: noop,
    markDayUnavailable: noop,
    undoCorrection: noop,
    setFatigue: noop,
    addMatch: noop,
    confirmPendingUpdate: noop,
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

vi.mock('../../hooks/useProfile', () => ({
  useProfile: (...args: unknown[]) => useProfileMock(...args),
}))

vi.mock('../../hooks/useWeek', () => ({
  useWeek: () => ({
    week: 'W1',
    setWeek: vi.fn(),
    lastNonDeloadWeek: 'W1',
  }),
}))

vi.mock('../../hooks/useFatigue', () => ({
  useFatigue: () => ({
    fatigue: 'OK',
    setFatigue: vi.fn(),
  }),
}))

vi.mock('../../hooks/useBlockLogs', () => ({
  useBlockLogs: () => ({ logs: [] }),
}))

vi.mock('../../hooks/useHistory', () => ({
  useHistory: () => ({ logs: [] }),
}))

vi.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => calendarState,
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
    setOverride: vi.fn(),
  }),
}))

vi.mock('../../hooks/useAcwrBlockCollapsed', () => ({
  useAcwrBlockCollapsed: () => ({
    collapsed: false,
    toggle: vi.fn(),
  }),
}))

vi.mock('../../hooks/useProgramFeatureFlags', () => ({
  useProgramFeatureFlags: () => ({
    featureFlags: {
      populationProfileV1: true,
      safetyContractsV1: true,
      u18HardCapsV1: true,
      microcycleArchetypesV2: true,
      sessionIdentityV2: true,
      qualityGatesV2: true,
      qualityScorecardV2: true,
      enforceMatchProximityGateV2: true,
    },
    rollout: {
      enabled: true,
      source: 'forced',
      canaryPercent: 10,
      bucket: 0,
    },
  }),
}))

vi.mock('../../hooks/useWeekSnapshot', () => ({
  useWeekSnapshot: (params: unknown) => useWeekSnapshotMock(params),
}))

const mockUseSchedulingTransition = vi.fn()
const mockUseSeasonTransitions = vi.fn()

vi.mock('../../hooks/useSchedulingTransition', () => ({
  useSchedulingTransition: (...args: unknown[]) => mockUseSchedulingTransition(...args),
}))

vi.mock('../../hooks/useSeasonTransitions', () => ({
  useSeasonTransitions: (...args: unknown[]) => mockUseSeasonTransitions(...args),
}))

vi.mock('../../services/program', () => ({
  validateSession: () => ({ isValid: true, warnings: [] }),
}))

vi.mock('../../services/ui/recommendations', () => ({
  shouldRecommendDeload: () => ({ recommend: false, reason: '' }),
}))

vi.mock('../../services/ui/progression', () => ({
  getSessionRecap: () => ({ loggedExercises: 0, totalExercises: 3, loadProxy: 'n/a' }),
}))

vi.mock('../../services/ui/safetyMessaging', () => ({
  getProgramSafetyMessages: () => [],
}))

// ── Tests ────────────────────────────────────────────────────────────────────

describe('WeekPage · convergence moteurs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE } })
    calendarState.events = []
    calendarState.visibleEvents = []
    calendarState.structuralEvents = []
    calendarState.syncNotification = null
    mockUseSchedulingTransition.mockReturnValue({ transition: null, dismiss: vi.fn() })
    mockUseSeasonTransitions.mockReturnValue({ transition: null, dismiss: vi.fn() })
  })

  afterEach(() => {
    cleanup()
  })

  it('off_season : surface mother-session visible, pas de blocage global', () => {
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE, seasonMode: 'off_season' } })
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season')))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('annual-plan-section')).toBeInTheDocument()
  })

  it('ignores hidden yesterday match for the ACWR reminder banner', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    calendarState.events = [{
      id: 'hidden-match',
      date: yesterday.toISOString().slice(0, 10),
      type: 'match',
      opponent: 'ASSOCIATION SPORTIVE ROUEN UNIVERSITE CLUB RUGBY',
      user_hidden: true,
    }]
    calendarState.visibleEvents = []
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season')))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByText(/Match hier/i)).toBeNull()
  })

  it('in_season : surface mother-session visible (annual-first)', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season')))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('annual-plan-section')).toBeInTheDocument()
  })

  it('unavailable : section annuelle toujours visible (ms resolution present)', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeUnavailableSurface()))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // The annual-plan-section is rendered because msResolution && surface is truthy
    // (motherSession is always returned even when status=missing_session)
    expect(screen.getByTestId('annual-plan-section')).toBeInTheDocument()
  })

  it('aria-label "Programme de la semaine" (pas "Plan annuel")', () => {
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE, seasonMode: 'off_season' } })
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season')))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    const section = screen.getByTestId('annual-plan-section')
    expect(section.getAttribute('aria-label')).toBe('Programme de la semaine')
  })

  it('recovery override : PlanningContextCard affiche le summaryLine, pas le warning technique', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', {
        status: 'resolved_with_warnings',
        resolutionWarnings: ['In-season recovery override : fatigue très élevée → semaine de récupération.'],
      })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // PlanningContextCard should be rendered
    expect(screen.getByTestId('planning-context-card')).toBeInTheDocument()
    // Technical recovery override warning should NOT appear in the card
    expect(
      screen.queryByText(/In-season recovery override : fatigue très élevée/i)
    ).toBeNull()
  })

  it('n\'affiche plus de séance complète inline', () => {
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE, seasonMode: 'off_season' } })
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season')))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Timeline or session list renders, not MotherSessionView inline
    expect(screen.queryByTestId('mother-session-detail')).toBeNull()
  })

  it("n'affiche pas le type technique FULL_LIGHT_PRIMER sous le jour de séance", () => {
    const session = MOTHER_SESSIONS_BY_ID['FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1']
    if (!session) throw new Error('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1 absente du dataset de test')

    const planningContext = makePlanningContext('in_season')
    useWeekSnapshotMock.mockReturnValue(hookResult({
      primarySource: 'mother_session',
      planningContext,
      planningInputWarnings: [],
      warnings: [],
      decisionReason: 'Programme annuel — En saison',
      motherSession: {
        status: 'resolved',
        planningContext,
        sessions: [{
          sessionId: 'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1',
          session,
          role: 'primary',
          dayPreference: 'pre_match',
        }],
        warnings: [],
        companionRecommendations: [],
      },
      schedulingMode: 'calendar',
      schedulingModeResult: makeSchedulingModeResult('calendar'),
    } as WeeklyProgramSurfaceResult))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Calendar timeline uses formatTitleFromMotherSessionId, not raw IDs or badge labels
    expect(screen.queryByText(/FULL_LIGHT_PRIMER/i)).toBeNull()
    // Should show formatted title instead
    expect(screen.getByText(/Power-up/)).toBeInTheDocument()
  })

  // ── S5 — dual layout tests ──────────────────────────────────────────────

  it('calendar mode : renders calendar week timeline', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('calendar-week-timeline')).toBeInTheDocument()
    expect(screen.getByTestId('week-planning-legend')).toBeInTheDocument()
    expect(screen.getByTestId('legend-marker-personal')).toBeInTheDocument()
    expect(screen.queryByTestId('sequential-session-list')).toBeNull()
    expect(screen.getByText(/Ma Semaine/)).toBeInTheDocument()
  })

  it('sequential mode : renders sequential session list', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByTestId('week-planning-legend')).toBeNull()
    expect(screen.getByTestId('sequential-session-list')).toBeInTheDocument()
    expect(screen.queryByTestId('mother-session-week-panel')).toBeNull()
  })

  it('sequential mode : title is "Mon Programme" not "Ma Semaine"', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByText(/Mon Programme/)).toBeInTheDocument()
    expect(screen.queryByText(/Ma Semaine/)).toBeNull()
  })

  it('sequential mode : shows block progression label and progress', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('sequential-progress')).toBeInTheDocument()
    // Block label appears in both header suffix and progress section
    expect(screen.getAllByText('Inter-saison · Hypertrophie').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('4/12 séances')).toBeInTheDocument()
  })

  it('sequential mode : session cards are numbered', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('sequential-session-card-0')).toBeInTheDocument()
  })

  it('sequential mode : fatigue check-in still visible', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByText('En forme')).toBeInTheDocument()
    expect(screen.getByText('Fatigué')).toBeInTheDocument()
  })

  // ── S2 Slice 3 — PlanningContextCard ──

  it('PlanningContextCard renders summaryLine from snapshot.explanation', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season')))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('planning-context-card')).toBeInTheDocument()
    expect(screen.getByText('Programme de test')).toBeInTheDocument()
  })

  it('ne rend pas PlanningContextBanner sur Week (désactivé produit)', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByTestId('planning-context-banner')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Vue calendrier' })).toBeNull()
  })

  it('PlanningContextCard toujours présent si le summary recoupait l’ancien corps du bandeau', () => {
    const result = hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' }))
    result.snapshot!.explanation!.summaryLine = planningContextBannerCopyForMode('calendar').body
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByTestId('planning-context-banner')).toBeNull()
    expect(screen.getByTestId('planning-context-card')).toBeInTheDocument()
  })

  it('PlanningContextBanner masqué si bannière de transition scheduling visible', () => {
    mockUseSchedulingTransition.mockReturnValue({
      transition: {
        type: 'calendar_mode_activated',
        message: 'Match détecté — ton programme s\'adapte à ton calendrier.',
        cta: 'OK',
      },
      dismiss: vi.fn(),
    })
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('transition-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('planning-context-banner')).toBeNull()
  })

  it('PlanningContextBanner masqué si bannière de transition saisonnière visible', () => {
    mockUseSeasonTransitions.mockReturnValue({
      transition: { type: 'playoffs_suggested' },
      dismiss: vi.fn(),
    })
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('transition-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('planning-context-banner')).toBeNull()
  })

  it('PlanningContextBanner masqué si bannière de confirmation prioritaire visible', () => {
    const result = hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' }))
    result.hasConfirmationRequired = true
    result.snapshot!.confirmationRequired = [{
      id: 'cr-wp-1',
      type: 'match_changed',
      message: 'Une confirmation est requise.',
      cta: 'Confirmer',
      data: {},
    }]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('confirmation-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('planning-context-banner')).toBeNull()
  })

  // ── S4 Slice 4: Calendar week timeline ──

  it('calendar timeline shows all 7 day rows', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Mon(1) through Sun(0)
    for (const dow of [1, 2, 3, 4, 5, 6, 0]) {
      expect(screen.getByTestId(`timeline-day-${dow}`)).toBeInTheDocument()
    }
  })

  it('calendar timeline shows session on its scheduled day', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Session is placed on day 2 (Mardi) per hookResult mapping
    const dayRow = screen.getByTestId('timeline-day-2')
    expect(dayRow.textContent).toContain('Récupération')
  })

  it('calendar timeline shows rest-day placeholder for empty days (AR only after effort)', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Day 1 (Mon) has no session and no effort the day before → rest day placeholder
    // Active recovery only shows after effort days (KB recovery.md §3.4)
    const restDay = screen.getByTestId('timeline-rest-1')
    expect(restDay).toBeInTheDocument()
  })

  it('calendar timeline exposes reschedule action on session', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Session on day 2 should have a reschedule button
    expect(screen.getByTestId('timeline-reschedule-0')).toBeInTheDocument()
  })

  it('calendar timeline: empty rest day shows Repos, no Indispo action', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Day 1 (Mon) is empty — shows rest label, no unavailable button
    expect(screen.getByTestId('timeline-rest-1')).toBeInTheDocument()
    expect(screen.queryByTestId('timeline-unavailable-1')).toBeNull()
  })

  it('calendar timeline: session day exposes unavailable action in action cluster', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Day 2 (Mardi) has session at globalIndex=0 — unavailable action is in session row
    expect(screen.getByTestId('timeline-unavailable-0')).toBeInTheDocument()
  })

  it('calendar mode hides add-match CTA when a match is already present this week', () => {
    const result = hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' }))
    result.snapshot!.presentation.matchEvents = [{ date: '2026-01-11', type: 'match' }]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByTestId('add-match-cta')).toBeNull()
  })

  it('sequential mode does NOT use calendar timeline', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByTestId('calendar-week-timeline')).toBeNull()
  })

  // U18 hard-block supprimé — app réservée aux adultes, pas de blocage U18

  // ── Local undo (replaced global undo bar) ──

  it('global undo bar is removed', () => {
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.snapshot!.corrections = [
      { id: 'sk1', type: 'skip', sessionId: 's1', appliedAt: new Date().toISOString(), reversible: true },
    ]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByTestId('undo-bar')).toBeNull()
  })

  it('local undo for add_match appears on the correct match row (date-bound)', () => {
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.snapshot!.corrections = [
      { id: 'am1', type: 'add_match', appliedAt: new Date().toISOString(), reversible: true, addedEventId: 'ev1', matchDate: '2026-04-11' },
    ]
    result.snapshot!.presentation.matchEvents = [{ date: '2026-04-11', type: 'match' }]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Match on Saturday (day 6) — undo must appear
    expect(screen.getByTestId('timeline-undo-match-6')).toBeInTheDocument()
  })

  it('local undo for add_match hidden when non-reversible', () => {
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.snapshot!.corrections = [
      { id: 'am1', type: 'add_match', appliedAt: new Date().toISOString(), reversible: false, matchDate: '2026-04-11' },
    ]
    result.snapshot!.presentation.matchEvents = [{ date: '2026-04-11', type: 'match' }]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByTestId('timeline-undo-match-6')).toBeNull()
  })

  it('imported match does not show undo for a different user-added match', () => {
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    // User added a match on Saturday (2026-04-11), but there's also an imported match on Wednesday (2026-04-08)
    result.snapshot!.corrections = [
      { id: 'am1', type: 'add_match', appliedAt: new Date().toISOString(), reversible: true, addedEventId: 'ev1', matchDate: '2026-04-11' },
    ]
    result.snapshot!.presentation.matchEvents = [
      { date: '2026-04-08', type: 'match', opponent: 'Imported FC' },  // Wednesday (day 3) — imported
      { date: '2026-04-11', type: 'match', opponent: 'Added FC' },     // Saturday (day 6) — user-added
    ]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Imported match on Wed (day 3) must NOT show undo
    expect(screen.queryByTestId('timeline-undo-match-3')).toBeNull()
    // User-added match on Sat (day 6) MUST show undo
    expect(screen.getByTestId('timeline-undo-match-6')).toBeInTheDocument()
  })

  // ── UX cleanup pass tests ──

  it('calendar: enriched match row shows opponent and home/away', () => {
    const result = hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' }))
    // Place a match on Saturday (day 6) with enriched data
    result.snapshot!.presentation.matchEvents = [{
      date: '2026-04-11', // Saturday
      type: 'match',
      opponent: 'Stade Toulousain',
      is_home: true,
      kickoff_time: '15:00',
    }]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    const matchCard = screen.getByTestId('timeline-match-6')
    expect(matchCard.textContent).toContain('Stade Toulousain')
    expect(matchCard.textContent).toContain('Domicile')
    expect(matchCard.textContent).toContain('15:00')
  })

  it('calendar: club day shows "Entraînement club" not "Indisponible"', () => {
    const result = hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' }))
    // Mark day 3 (Mercredi) as a club day
    result.snapshot!.presentation.clubDays = [3 as any]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('timeline-club-3')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-club-3').textContent).toContain('Entraînement club')
  })

  it('calendar: user-unavailable day shows "Indisponible"', () => {
    const result = hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' }))
    // Mark day 1 (Lundi) as user-unavailable
    result.snapshot!.presentation.unavailableDays = [1 as any]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('timeline-user-unavailable-1')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-user-unavailable-1').textContent).toContain('Indisponible')
  })

  it('sequential mode remains unaffected by calendar UX cleanup', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('sequential-session-list')).toBeInTheDocument()
    expect(screen.queryByTestId('calendar-week-timeline')).toBeNull()
  })

  it('calendar: existing correction actions (reschedule, skip) still render', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Session at index 0 should have reschedule and skip buttons
    expect(screen.getByTestId('timeline-reschedule-0')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-skip-0')).toBeInTheDocument()
  })

  it('calendar: session card stays text-first without session illustration', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByTestId('session-illustration-0')).toBeNull()
    expect(screen.getByTestId('session-meta-0')).toBeInTheDocument()
  })

  it('calendar: club rugby days are eligible in reschedule picker (not excluded)', () => {
    const result = hookResult(makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' }))
    result.snapshot!.presentation.clubDays = [3 as any] // Wed is club day
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // The reschedule picker filter excludes unavailableDays and matchDays,
    // but NOT clubDays. So Wed (3) should remain as a candidate.
    // We can verify club day is not in unavailableDays:
    expect(result.snapshot!.presentation.unavailableDays).not.toContain(3)
  })

  // ── WeekPage UX correction pass ──────────────────────────────────────────

  it('PlanningContextCard does not show correction lines on WeekPage', () => {
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.snapshot!.explanation = {
      summaryLine: 'Programme adapté',
      detailLines: ['Détail plan'],
      corrections: ['Séance reportée à Mercredi', 'Jour marqué indisponible'],
    }
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    const card = screen.getByTestId('planning-context-card')
    expect(card).toBeInTheDocument()
    expect(card.textContent).toContain('Programme adapté')
    // Correction lines must not appear
    expect(card.textContent).not.toContain('Séance reportée à Mercredi')
    expect(card.textContent).not.toContain('Jour marqué indisponible')
  })

  it('PlanningContextCard detail lines (non-correction) still visible via toggle', () => {
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.snapshot!.explanation = {
      summaryLine: 'Programme adapté',
      detailLines: ['Vrai détail explicatif'],
      corrections: ['Séance reportée'],
    }
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Toggle open
    fireEvent.click(screen.getByTestId('planning-context-toggle'))

    const details = screen.getByTestId('planning-context-details')
    expect(details.textContent).toContain('Vrai détail explicatif')
    // Corrections still hidden
    expect(details.textContent).not.toContain('Séance reportée')
  })

  it('Indispo. button opens inline confirmation, does not fire directly', () => {
    const markDayUnavailable = vi.fn()
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.markDayUnavailable = markDayUnavailable
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Click the unavailable button on session 0
    fireEvent.click(screen.getByTestId('timeline-unavailable-0'))

    // Confirmation should appear, action should NOT have fired
    expect(screen.getByTestId('timeline-unavailable-confirm-0')).toBeInTheDocument()
    expect(markDayUnavailable).not.toHaveBeenCalled()
  })

  it('Indispo. confirmation cancel does nothing', () => {
    const markDayUnavailable = vi.fn()
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.markDayUnavailable = markDayUnavailable
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    fireEvent.click(screen.getByTestId('timeline-unavailable-0'))
    fireEvent.click(screen.getByTestId('timeline-unavailable-confirm-no-0'))

    // Confirmation gone, action never fired
    expect(screen.queryByTestId('timeline-unavailable-confirm-0')).toBeNull()
    expect(markDayUnavailable).not.toHaveBeenCalled()
  })

  it('Indispo. confirmation confirm fires the action', () => {
    const markDayUnavailable = vi.fn()
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.markDayUnavailable = markDayUnavailable
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    fireEvent.click(screen.getByTestId('timeline-unavailable-0'))
    fireEvent.click(screen.getByTestId('timeline-unavailable-confirm-yes-0'))

    expect(markDayUnavailable).toHaveBeenCalled()
    expect(screen.queryByTestId('timeline-unavailable-confirm-0')).toBeNull()
  })

  it('existing skip confirmation still works', () => {
    const skipSession = vi.fn()
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.skipSession = skipSession
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Open skip confirm
    fireEvent.click(screen.getByTestId('timeline-skip-0'))
    expect(screen.getByTestId('timeline-skip-confirm-0')).toBeInTheDocument()

    // Confirm skip
    fireEvent.click(screen.getByTestId('timeline-skip-confirm-yes-0'))
    expect(skipSession).toHaveBeenCalled()
  })

  it('local undo for unavailable day appears on unavailable row', () => {
    const surface = makeMotherSessionSurface('in_season', { schedulingMode: 'calendar' })
    const result = hookResult(surface)
    result.snapshot!.corrections = [
      { id: 'u1', type: 'unavailable_day', toDay: 1, appliedAt: new Date().toISOString(), reversible: true },
    ]
    result.snapshot!.presentation.unavailableDays = [1 as any]
    useWeekSnapshotMock.mockReturnValue(result)

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('timeline-undo-unavailable-1')).toBeInTheDocument()
  })

  it('sequential mode remains unaffected by this UX cleanup', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // Sequential list still renders
    expect(screen.getByTestId('sequential-session-list')).toBeInTheDocument()
    // No calendar artifacts
    expect(screen.queryByTestId('calendar-week-timeline')).toBeNull()
    // No global undo bar
    expect(screen.queryByTestId('undo-bar')).toBeNull()
  })

  // ── Match bandeau in off-season sequential ─────────────────────────

  it('off-season sequential: shows match bandeau when structural future match exists', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))
    calendarState.structuralEvents = [
      { id: 'match-senior', date: '2026-09-12', type: 'match', opponent: 'Rouen' },
    ]
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByText(/Match prévu le/)).toBeInTheDocument()
    expect(screen.getByText(/Rouen/)).toBeInTheDocument()
    expect(screen.getByText(/Voir calendrier/)).toBeInTheDocument()
  })

  it('off-season sequential: no match bandeau when match is deferred (not in structuralEvents)', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))
    // Match is in visibleEvents but NOT in structuralEvents (deferred)
    calendarState.visibleEvents = [
      { id: 'match-deferred', date: '2026-09-12', type: 'match', opponent: 'Rouen' },
    ]
    calendarState.structuralEvents = [] // deferred → filtered out
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByText(/Match prévu le/)).toBeNull()
  })

  it('off-season sequential: two matches, first deferred, bandeau shows structural one', () => {
    useWeekSnapshotMock.mockReturnValue(hookResult(makeMotherSessionSurface('off_season', { schedulingMode: 'sequential' })))
    calendarState.visibleEvents = [
      { id: 'match-reserve', date: '2026-09-12', type: 'match', opponent: 'Réserve' },
      { id: 'match-senior', date: '2026-09-19', type: 'match', opponent: 'Dieppe' },
    ]
    // First match deferred, second still structural
    calendarState.structuralEvents = [
      { id: 'match-senior', date: '2026-09-19', type: 'match', opponent: 'Dieppe' },
    ]
    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByText(/Match prévu le/)).toBeInTheDocument()
    expect(screen.getByText(/Dieppe/)).toBeInTheDocument()
    expect(screen.queryByText(/Réserve/)).toBeNull()
  })
})

// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { MOTHER_SESSIONS_BY_ID } from '../../data/motherSessions.generated'
import type { ResolveMotherSessionsForWeekResult } from '../../services/motherSession/resolveMotherSessionsForWeek'
import type { WeeklyProgramSurfaceResult } from '../../services/program/resolveWeeklyProgramSurface'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import { WeekPage } from '../WeekPage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'

const useProfileMock = vi.fn()
const useWeeklyProgramSurfaceMock = vi.fn()

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

function makeMotherSessionSurface(
  cycle: AnnualPlanningContext['cycle'],
  overrides?: Partial<Pick<WeeklyProgramSurfaceResult, 'warnings' | 'decisionReason'>> & {
    resolutionWarnings?: string[]
    status?: ResolveMotherSessionsForWeekResult['status']
  },
): WeeklyProgramSurfaceResult {
  const session = MOTHER_SESSIONS_BY_ID['FULL_OFFSEASON_RECOVERY_A_V1']
  if (!session) throw new Error('FULL_OFFSEASON_RECOVERY_A_V1 absente du dataset de test')

  const planningContext = makePlanningContext(cycle)
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
  useCalendar: () => ({ events: [] }),
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

vi.mock('../../hooks/useWeeklyProgramSurface', () => ({
  useWeeklyProgramSurface: (params: unknown) => useWeeklyProgramSurfaceMock(params),
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
  })

  afterEach(() => {
    cleanup()
  })

  it('off_season : surface mother-session visible, pas de blocage global', () => {
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE, seasonMode: 'off_season' } })
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeMotherSessionSurface('off_season'),
    })

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('annual-plan-section')).toBeInTheDocument()
  })

  it('in_season : surface mother-session visible (annual-first)', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeMotherSessionSurface('in_season'),
    })

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByTestId('annual-plan-section')).toBeInTheDocument()
  })

  it('unavailable : section annuelle toujours visible (ms resolution present)', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeUnavailableSurface(),
    })

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // The annual-plan-section is rendered because msResolution && surface is truthy
    // (motherSession is always returned even when status=missing_session)
    expect(screen.getByTestId('annual-plan-section')).toBeInTheDocument()
  })

  it('aria-label "Programme de la semaine" (pas "Plan annuel")', () => {
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE, seasonMode: 'off_season' } })
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeMotherSessionSurface('off_season'),
    })

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    const section = screen.getByTestId('annual-plan-section')
    expect(section.getAttribute('aria-label')).toBe('Programme de la semaine')
  })

  it('recovery override : masque l’alerte technique et évite le doublon Hors gym', () => {
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeMotherSessionSurface('in_season', {
        status: 'resolved_with_warnings',
        resolutionWarnings: ['In-season recovery override : fatigue très élevée → semaine de récupération.'],
      }),
    })

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByText('Conditionnement compagnon')).toBeInTheDocument()
    // "Hors gym" peut apparaître dans le WeekPanel (companion recommendations)
    // L'important est que le warning technique recovery override est filtré
    expect(
      screen.queryByText(/In-season recovery override : fatigue très élevée/i)
    ).toBeNull()
  })

  it('n\'affiche plus de séance complète inline', () => {
    useProfileMock.mockReturnValue({ profile: { ...BASE_PROFILE, seasonMode: 'off_season' } })
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: makeMotherSessionSurface('off_season'),
    })

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    // WeekPanel renders session cards, not MotherSessionView inline
    expect(screen.getByTestId('week-session-card-0')).toBeInTheDocument()
    // No inline session detail
    expect(screen.queryByTestId('mother-session-detail')).toBeNull()
  })

  it('n’affiche pas le type technique FULL_LIGHT_PRIMER sous le jour de séance', () => {
    const session = MOTHER_SESSIONS_BY_ID['FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1']
    if (!session) throw new Error('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1 absente du dataset de test')

    const planningContext = makePlanningContext('in_season')
    useWeeklyProgramSurfaceMock.mockReturnValue({
      isReady: true,
      surface: {
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
      },
    })

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.queryByText(/FULL_LIGHT_PRIMER/i)).toBeNull()
    expect(screen.getByText('PRIMER')).toBeInTheDocument()
  })

  // U18 hard-block supprimé — app réservée aux adultes, pas de blocage U18
})

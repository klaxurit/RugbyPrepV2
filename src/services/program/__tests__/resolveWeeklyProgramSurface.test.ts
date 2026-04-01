import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { UserProfile, CalendarEvent, SessionLog } from '../../../types/training'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import type { ResolveMotherSessionsForWeekResult } from '../../motherSession/resolveMotherSessionsForWeek'
import { resolveWeeklyProgramSurface } from '../resolveWeeklyProgramSurface'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockBuildAthletePlanningInputs = vi.fn()
const mockResolveMotherSessions = vi.fn()

vi.mock('../../annualPlanning/buildAthletePlanningInputs', () => ({
  buildAthletePlanningInputs: (...args: unknown[]) => mockBuildAthletePlanningInputs(...args),
}))

vi.mock('../../motherSession/resolveMotherSessionsForWeek', () => ({
  resolveMotherSessionsForWeek: (...args: unknown[]) => mockResolveMotherSessions(...args),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePlanningContext(overrides: Partial<AnnualPlanningContext> = {}): AnnualPlanningContext {
  return {
    cycle: 'in_season',
    weekNumber: 5,
    weekLabel: 'In-season S5',
    isDeloadWeek: false,
    isMatchWeek: true,
    firstMatchDate: '2026-01-10',
    lastMatchDate: null,
    offSeasonStartAt: null,
    daysUntilNextMatch: 3,
    daysSinceLastMatch: null,
    fatigueLevel: 'normal',
    weeklyFrequency: 3,
    positionGroup: 'back_three',
    planningTrace: {
      resolutionMode: 'calendar_inferred',
      rulesApplied: [],
      warnings: [],
    },
    ...overrides,
  }
}

function makeMsResult(ctx: AnnualPlanningContext, resolved = true): ResolveMotherSessionsForWeekResult {
  if (!resolved) {
    return {
      status: 'missing_session',
      planningContext: ctx,
      sessions: [],
      warnings: ['Aucune mother session disponible'],
    }
  }
  return {
    status: 'resolved',
    planningContext: ctx,
    sessions: [{
      sessionId: 'FULL_OFFSEASON_RECOVERY_A_V1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: {} as any,
      role: 'primary',
      dayPreference: 'early_week',
    }],
    warnings: [],
  }
}

const BASE_PROFILE: UserProfile = {
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
} as UserProfile

function setupMocks(cycle: AnnualPlanningContext['cycle'], msResolved = true) {
  const ctx = makePlanningContext({ cycle, weekLabel: `${cycle} — S1` })
  mockBuildAthletePlanningInputs.mockReturnValue({
    inputs: { events: [], today: '2026-03-21', weeklyFrequency: 3, positionGroup: 'back_three' },
    warnings: [],
    derived: { resolvedPositionGroup: 'back_three', fatigueLevel: 'normal' },
  })
  mockResolveMotherSessions.mockReturnValue(makeMsResult(ctx, msResolved))
}

const BASE_PARAMS = {
  profile: BASE_PROFILE,
  events: [] as CalendarEvent[],
  logs: [] as SessionLog[],
  today: '2026-03-21',
  fatigue: 'OK' as const,
  week: 'W1' as const,
  lastNonDeloadWeek: 'W1' as const,
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('resolveWeeklyProgramSurface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('off_season → mother_session', () => {
    setupMocks('off_season')
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.primarySource).toBe('mother_session')
    expect(result.motherSession).toBeDefined()
    expect(result.planningContext).toBeDefined()
    expect(result.decisionReason).toContain('off_season')
  })

  it('pre_season → mother_session', () => {
    setupMocks('pre_season')
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.primarySource).toBe('mother_session')
    expect(result.motherSession).toBeDefined()
    expect(result.decisionReason).toContain('pre_season')
  })

  it('playoffs → mother_session', () => {
    setupMocks('playoffs')
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.primarySource).toBe('mother_session')
    expect(result.motherSession).toBeDefined()
    expect(result.decisionReason).toContain('playoffs')
  })

  it('in_season → mother_session (annual-first)', () => {
    setupMocks('in_season', true)
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.primarySource).toBe('mother_session')
    expect(result.motherSession).toBeDefined()
    expect(result.decisionReason).toContain('in_season')
  })

  it('résolution échouée → unavailable', () => {
    setupMocks('in_season', false)
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.primarySource).toBe('unavailable')
    expect(result.motherSession).toBeDefined()
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('decisionReason est toujours non vide', () => {
    for (const cycle of ['off_season', 'pre_season', 'in_season', 'playoffs'] as const) {
      setupMocks(cycle)
      const result = resolveWeeklyProgramSurface(BASE_PARAMS)
      expect(result.decisionReason.length).toBeGreaterThan(0)
    }
  })

  it('planningContext est toujours présent', () => {
    for (const cycle of ['off_season', 'pre_season', 'in_season', 'playoffs'] as const) {
      setupMocks(cycle)
      const result = resolveWeeklyProgramSurface(BASE_PARAMS)
      expect(result.planningContext).toBeDefined()
      expect(result.planningContext.cycle).toBe(cycle)
    }
  })

  it('planningInputWarnings remontent depuis buildAthletePlanningInputs', () => {
    setupMocks('off_season')
    mockBuildAthletePlanningInputs.mockReturnValue({
      inputs: { events: [], today: '2026-03-21', weeklyFrequency: 3, positionGroup: 'back_three' },
      warnings: ['Poste non renseigné'],
      derived: { resolvedPositionGroup: 'back_three', fatigueLevel: 'normal' },
    })
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.planningInputWarnings).toContain('Poste non renseigné')
  })
})

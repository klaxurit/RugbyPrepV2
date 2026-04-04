import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { UserProfile, CalendarEvent, SessionLog } from '../../../types/training'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import type { ResolveMotherSessionsForWeekResult } from '../../motherSession/resolveMotherSessionsForWeek'
import { resolveWeeklyProgramSurface } from '../resolveWeeklyProgramSurface'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockBuildAthletePlanningInputs = vi.fn()
const mockResolveMotherSessions = vi.fn()
const mockResolveSchedulingMode = vi.fn()
const mockBuildSafeSequentialFallback = vi.fn()

vi.mock('../../annualPlanning/buildAthletePlanningInputs', () => ({
  buildAthletePlanningInputs: (...args: unknown[]) => mockBuildAthletePlanningInputs(...args),
}))

vi.mock('../../motherSession/resolveMotherSessionsForWeek', () => ({
  resolveMotherSessionsForWeek: (...args: unknown[]) => mockResolveMotherSessions(...args),
}))

vi.mock('../../scheduling/resolveSchedulingMode', () => ({
  resolveSchedulingMode: (...args: unknown[]) => mockResolveSchedulingMode(...args),
}))

vi.mock('../../scheduling/buildSafeSequentialFallback', () => ({
  buildSafeSequentialFallback: (...args: unknown[]) => mockBuildSafeSequentialFallback(...args),
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

function makeFallbackResult(ctx: AnnualPlanningContext): ResolveMotherSessionsForWeekResult {
  return {
    status: 'resolved_with_warnings',
    planningContext: ctx,
    sessions: [
      {
        sessionId: 'FULL_OFFSEASON_RECOVERY_A_V1',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session: { metadata: { id: 'FULL_OFFSEASON_RECOVERY_A_V1' } } as any,
        role: 'primary',
        dayPreference: 'early_week',
        variant: 'light',
      },
      {
        sessionId: 'FULL_OFFSEASON_RECOVERY_B_V1',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session: { metadata: { id: 'FULL_OFFSEASON_RECOVERY_B_V1' } } as any,
        role: 'primary',
        dayPreference: 'late_week',
        variant: 'light',
      },
    ],
    warnings: ['Programme adapté — complète ton profil pour un programme optimal.'],
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
    inputs: {
      events: [],
      today: '2026-03-21',
      weeklyFrequency: 3,
      positionGroup: 'back_three',
      planningAnchors: undefined,
    },
    warnings: [],
    derived: { resolvedPositionGroup: 'back_three', fatigueLevel: 'normal' },
  })
  mockResolveMotherSessions.mockReturnValue(makeMsResult(ctx, msResolved))
  mockResolveSchedulingMode.mockReturnValue({
    mode: 'calendar',
    confidence: 'high',
    reason: 'future_matches_detected',
    calendarSignalStrength: 2,
  })
  mockBuildSafeSequentialFallback.mockReturnValue(makeFallbackResult(ctx))
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

  it('résolution échouée → fallback safe (never unavailable)', () => {
    setupMocks('in_season', false)
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    // Primary source is now mother_session (fallback), never unavailable
    expect(result.primarySource).toBe('mother_session')
    expect(result.primarySource).not.toBe('unavailable')
    expect(result.motherSession).toBeDefined()
    expect(result.motherSession!.sessions.length).toBeGreaterThan(0)
    expect(result.schedulingMode).toBe('sequential')
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
      inputs: {
        events: [],
        today: '2026-03-21',
        weeklyFrequency: 3,
        positionGroup: 'back_three',
        planningAnchors: undefined,
      },
      warnings: ['Poste non renseigné'],
      derived: { resolvedPositionGroup: 'back_three', fatigueLevel: 'normal' },
    })
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.planningInputWarnings).toContain('Poste non renseigné')
  })

  // ── S3-specific tests ──

  it('schedulingMode and schedulingModeResult are always present', () => {
    setupMocks('in_season')
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.schedulingMode).toBeDefined()
    expect(result.schedulingModeResult).toBeDefined()
    expect(result.schedulingModeResult.mode).toBe(result.schedulingMode)
    expect(result.schedulingModeResult.confidence).toBeDefined()
    expect(result.schedulingModeResult.reason).toBeDefined()
  })

  it('resolveSchedulingMode is called with events, today, and anchors', () => {
    setupMocks('off_season')
    const testEvents = [{ id: '1', date: '2026-04-10', type: 'match' as const }] as CalendarEvent[]
    resolveWeeklyProgramSurface({ ...BASE_PARAMS, events: testEvents })

    expect(mockResolveSchedulingMode).toHaveBeenCalledTimes(1)
    const call = mockResolveSchedulingMode.mock.calls[0][0]
    expect(call.events).toBe(testEvents)
    expect(call.today).toBe('2026-03-21')
  })

  it('fallback preserves original engine warnings', () => {
    setupMocks('in_season', false)
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    // Original engine warning from makeMsResult(resolved=false)
    expect(result.warnings).toContain('Aucune mother session disponible')
    // Fallback warning
    expect(result.warnings.some(w => w.includes('Programme adapté'))).toBe(true)
    // Resolution failure warning
    expect(result.warnings.some(w => w.includes('plan annuel'))).toBe(true)
  })

  it('fallback produces a fully coherent schedulingModeResult (no stale resolver metadata)', () => {
    setupMocks('in_season', false)
    // Mock returns calendar with high confidence, but fallback must override entirely
    mockResolveSchedulingMode.mockReturnValue({
      mode: 'calendar',
      confidence: 'high',
      reason: 'future_matches_detected',
      calendarSignalStrength: 3,
    })
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.schedulingMode).toBe('sequential')
    expect(result.schedulingModeResult).toEqual({
      mode: 'sequential',
      confidence: 'high',
      reason: 'engine_fallback_no_sessions',
      calendarSignalStrength: 0,
    })
  })

  it('normal resolution passes through schedulingMode from resolveSchedulingMode', () => {
    setupMocks('in_season', true)
    mockResolveSchedulingMode.mockReturnValue({
      mode: 'sequential',
      confidence: 'low',
      reason: 'no_data',
      calendarSignalStrength: 0,
    })
    const result = resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(result.schedulingMode).toBe('sequential')
    expect(result.schedulingModeResult.reason).toBe('no_data')
  })

  it('buildSafeSequentialFallback is called only when engine fails', () => {
    setupMocks('in_season', true)
    resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(mockBuildSafeSequentialFallback).not.toHaveBeenCalled()

    vi.clearAllMocks()
    setupMocks('in_season', false)
    resolveWeeklyProgramSurface(BASE_PARAMS)
    expect(mockBuildSafeSequentialFallback).toHaveBeenCalledTimes(1)
  })
})

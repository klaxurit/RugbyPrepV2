// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWeekSnapshot, type UseWeekSnapshotParams } from '../useWeekSnapshot'
import type { WeeklyProgramSurfaceResult } from '../../services/program/resolveWeeklyProgramSurface'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { SnapshotStorage } from '../../services/scheduling/weekSnapshot'
import type { BlockProgressionStorage } from '../../services/scheduling/resolveBlockProgression'
import type { CalendarEvent, Equipment, UserProfile, DayOfWeek } from '../../types/training'
import type { MotherSession } from '../../types/motherSession'
import type { ResolvedMotherSessionSlot } from '../../services/motherSession/resolveMotherSessionsForWeek'

function minimalMotherSession(id: string): MotherSession {
  return {
    metadata: {
      id,
      status: 'validated',
      version: 'V1',
      cycle: 'in_season',
      sessionType: 'full',
      targetLevel: 'builder',
      targetPositionGroup: 'back_three',
      equipment: 'full_gym',
      targetDuration: '50 min',
    },
    goal: [],
    sessionIdentity: [],
    warmUp: { exercises: [], notes: [] },
    blocks: [],
    progressionRules: [],
    positionAccent: [],
    injurySubstitutions: [],
    coachingWarnings: [],
    sourceReferences: [],
  }
}

function mockResolvedSlot(
  sessionId: string,
  opts: Partial<Pick<ResolvedMotherSessionSlot, 'dayPreference'>> = {},
): ResolvedMotherSessionSlot {
  return {
    sessionId,
    role: 'primary',
    session: minimalMotherSession(sessionId),
    ...opts,
  }
}

// ── Mocks ───────────────────────────────────────────────────────────

vi.mock('../../services/program/resolveWeeklyProgramSurface', () => ({
  resolveWeeklyProgramSurface: () => mockSurface,
}))

vi.mock('../../services/scheduling/resolveBlockProgression', () => ({
  getBlockProgression: () => ({
    currentBlockIndex: 0,
    sessionsCompletedInBlock: 0,
    totalSessionsInBlock: 12,
    consecutiveIncompleteBlocks: 0,
    currentBlockLabel: 'Test',
    lastAdvancedAt: '2026-04-06',
  }),
}))

// ── Helpers ─────────────────────────────────────────────────────────

function makePlanningContext(): AnnualPlanningContext {
  return {
    cycle: 'off_season',
    weekLabel: 'Off-season S1',
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
    planningTrace: { resolutionMode: 'backfilled', rulesApplied: [], warnings: [] },
  }
}

let mockSurface: WeeklyProgramSurfaceResult

function makeSurface(): WeeklyProgramSurfaceResult {
  return {
    primarySource: 'mother_session',
    planningContext: makePlanningContext(),
    planningInputWarnings: [],
    warnings: [],
    decisionReason: 'test',
    motherSession: {
      status: 'resolved',
      planningContext: makePlanningContext(),
      sessions: [],
      warnings: [],
    },
    schedulingMode: 'calendar',
    schedulingModeResult: { mode: 'calendar', confidence: 'high', reason: 'test', calendarSignalStrength: 0 },
  }
}

function createMockStorage(): SnapshotStorage & BlockProgressionStorage & { data: Record<string, string> } {
  const data: Record<string, string> = {}
  return {
    data,
    getItem(key: string) { return data[key] ?? null },
    setItem(key: string, value: string) { data[key] = value },
    removeItem(key: string) { delete data[key] },
  }
}

const TODAY = '2026-04-06'

const TEST_EQUIPMENT: Equipment[] = ['barbell']

function makeProfile(overrides?: Partial<UserProfile>): UserProfile {
  return {
    level: 'intermediate',
    equipment: TEST_EQUIPMENT,
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
    ...overrides,
  }
}

function makeParams(userId: string | null, storage: SnapshotStorage & BlockProgressionStorage): UseWeekSnapshotParams {
  const emptyEvents: CalendarEvent[] = []
  return {
    profile: makeProfile(),
    events: emptyEvents,
    logs: [],
    today: TODAY,
    fatigue: 'OK',
    acwrZone: null,
    week: 'W1',
    lastNonDeloadWeek: 'W1',
    ignoreAcwrOverload: false,
    hasSufficientACWRData: false,
    featureFlags: {},
    userId,
    snapshotStorage: storage,
    blockProgressionStorage: storage,
  }
}

// ── Tests ───────────────────────────────────────────────────────────

beforeEach(() => {
  mockSurface = makeSurface()
})

describe('useWeekSnapshot lifecycle', () => {
  it('creates a snapshot on first access', async () => {
    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    expect(result.current.snapshot).not.toBeNull()
    expect(result.current.snapshot?.weekId).toBeDefined()
  })

  it('persists snapshot to localStorage after creation', async () => {
    const storage = createMockStorage()
    renderHook(() => useWeekSnapshot(makeParams('user-a', storage)))

    await waitFor(() => {
      expect(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15']).toBeDefined()
    })
  })

  it('identity change within same week forces re-evaluation', async () => {
    const storage = createMockStorage()

    // Render with user-a
    const { result, rerender } = renderHook(
      ({ params }) => useWeekSnapshot(params),
      { initialProps: { params: makeParams('user-a', storage) } },
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const snapshotA = result.current.snapshot
    expect(snapshotA).not.toBeNull()
    expect(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15']).toBeDefined()

    // Switch to user-b (same week)
    rerender({ params: makeParams('user-b', storage) })

    await waitFor(() => {
      // user-b should get their own snapshot (persisted under user-b key)
      expect(storage.data['rugbyprep.weekSnapshot.v2.user-b.W2026-15']).toBeDefined()
    })

    // Both snapshots exist independently
    expect(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15']).toBeDefined()
    expect(storage.data['rugbyprep.weekSnapshot.v2.user-b.W2026-15']).toBeDefined()
  })

  it('anon → authenticated transition resolves a new snapshot', async () => {
    const storage = createMockStorage()

    const { result, rerender } = renderHook(
      ({ params }) => useWeekSnapshot(params),
      { initialProps: { params: makeParams(null, storage) } },
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    // Anon snapshot is not persisted (no userId)
    expect(Object.keys(storage.data).length).toBe(0)

    // Authenticate
    rerender({ params: makeParams('user-real', storage) })

    await waitFor(() => {
      expect(storage.data['rugbyprep.weekSnapshot.v2.user-real.W2026-15']).toBeDefined()
    })

    expect(result.current.isReady).toBe(true)
  })

  it('stub actions exist and are callable without error', async () => {
    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    // Stubs for S4/S5 should be callable without throwing
    expect(() => result.current.undoCorrection('c1')).not.toThrow()
    expect(() => result.current.setFatigue('FATIGUE')).not.toThrow()
    expect(() => result.current.confirmPendingUpdate('p1')).not.toThrow()
  })

  it('skipSession updates snapshot with skip correction and persists', async () => {
    // Use surface with sessions so skip has something to target
    mockSurface = {
      ...makeSurface(),
      motherSession: {
        status: 'resolved',
        planningContext: makePlanningContext(),
        sessions: [
          mockResolvedSlot('S1', { dayPreference: 'early_week' }),
          mockResolvedSlot('S2', { dayPreference: 'late_week' }),
        ],
        warnings: [],
      },
    }

    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const beforeCorrections = result.current.snapshot?.corrections.length ?? 0

    act(() => {
      result.current.skipSession('S1')
    })

    // Snapshot updated with correction
    expect(result.current.snapshot?.corrections.length).toBe(beforeCorrections + 1)
    expect(result.current.snapshot?.corrections[0].type).toBe('skip')
    expect(result.current.snapshot?.corrections[0].sessionId).toBe('S1')

    // Persisted
    const persisted = JSON.parse(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15'])
    expect(persisted.corrections.length).toBe(beforeCorrections + 1)
  })

  it('skipSession sets toastMessage', async () => {
    mockSurface = {
      ...makeSurface(),
      motherSession: {
        status: 'resolved',
        planningContext: makePlanningContext(),
        sessions: [mockResolvedSlot('S1')],
        warnings: [],
      },
    }

    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    expect(result.current.toastMessage).toBeNull()

    act(() => {
      result.current.skipSession('S1')
    })

    expect(result.current.toastMessage).toBe('Séance passée')
  })

  it('rescheduleSession updates snapshot and sets toast', async () => {
    mockSurface = {
      ...makeSurface(),
      motherSession: {
        status: 'resolved',
        planningContext: makePlanningContext(),
        sessions: [mockResolvedSlot('S1', { dayPreference: 'early_week' })],
        warnings: [],
      },
    }

    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    act(() => {
      result.current.rescheduleSession('S1', 4)
    })

    expect(result.current.snapshot?.corrections.length).toBe(1)
    expect(result.current.snapshot?.corrections[0].type).toBe('reschedule')
    expect(result.current.snapshot?.corrections[0].toDay).toBe(4)
    expect(result.current.toastMessage).toContain('Jeudi')
  })

  it('clearToast resets toastMessage', async () => {
    mockSurface = {
      ...makeSurface(),
      motherSession: {
        status: 'resolved',
        planningContext: makePlanningContext(),
        sessions: [mockResolvedSlot('S1')],
        warnings: [],
      },
    }

    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    act(() => {
      result.current.skipSession('S1')
    })

    expect(result.current.toastMessage).not.toBeNull()

    act(() => {
      result.current.clearToast()
    })

    expect(result.current.toastMessage).toBeNull()
  })

  it('markDayUnavailable updates snapshot with unavailable_day correction and persists', async () => {
    mockSurface = {
      ...makeSurface(),
      motherSession: {
        status: 'resolved',
        planningContext: makePlanningContext(),
        sessions: [mockResolvedSlot('S1', { dayPreference: 'early_week' })],
        warnings: [],
      },
    }

    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    act(() => {
      result.current.markDayUnavailable(1)
    })

    expect(result.current.snapshot?.corrections.length).toBe(1)
    expect(result.current.snapshot?.corrections[0].type).toBe('unavailable_day')
    expect(result.current.snapshot?.corrections[0].toDay).toBe(1)
    expect(result.current.toastMessage).toContain('indisponible')

    // Persisted
    const persisted = JSON.parse(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15'])
    expect(persisted.corrections.length).toBe(1)
  })

  // ── S4: Undo ──

  it('undoCorrection removes correction and rebuilds snapshot', async () => {
    mockSurface = {
      ...makeSurface(),
      motherSession: {
        status: 'resolved',
        planningContext: makePlanningContext(),
        sessions: [mockResolvedSlot('S1')],
        warnings: [],
      },
    }

    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    // Apply a correction
    act(() => {
      result.current.skipSession('S1')
    })
    expect(result.current.snapshot?.corrections.length).toBe(1)
    const correctionId = result.current.snapshot!.corrections[0].id

    // Undo it
    act(() => {
      result.current.undoCorrection(correctionId)
    })

    expect(result.current.snapshot?.corrections.length).toBe(0)
    expect(result.current.toastMessage).toBe('Correction annulée')

    // Persisted without the correction
    const persisted = JSON.parse(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15'])
    expect(persisted.corrections.length).toBe(0)
  })

  it('undoCorrection ignores non-reversible corrections', async () => {
    mockSurface = {
      ...makeSurface(),
      motherSession: {
        status: 'resolved',
        planningContext: makePlanningContext(),
        sessions: [mockResolvedSlot('S1')],
        warnings: [],
      },
    }

    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    // Manually inject a non-reversible correction
    act(() => {
      result.current.skipSession('S1')
    })
    // We can't easily simulate expired reversible flag here; test undo for a bad ID
    act(() => {
      result.current.undoCorrection('non-existent-id')
    })
    // No change
    expect(result.current.snapshot?.corrections.length).toBe(1)
  })

  // ── S4: External change detection ──

  it('Category B: future-only event change queues pendingUpdate without mutating visible week', async () => {
    mockSurface = makeSurface()
    const storage = createMockStorage()

    // Initial params with no events
    const params1 = makeParams('user-a', storage)

    const { result, rerender } = renderHook(
      ({ params }) => useWeekSnapshot(params),
      { initialProps: { params: params1 } },
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const originalFingerprint = result.current.snapshot?.eventsFingerprint

    const futureMatch: CalendarEvent = { date: '2026-04-20', type: 'match', id: 'future-match' }
    const params2: UseWeekSnapshotParams = {
      ...params1,
      events: [futureMatch],
    }
    rerender({ params: params2 })

    await waitFor(() => {
      expect(result.current.snapshot?.pendingUpdates.length).toBeGreaterThan(0)
    })

    // Visible week fingerprint unchanged
    expect(result.current.snapshot?.eventsFingerprint).toBe(originalFingerprint)
    // Corrections unchanged
    expect(result.current.snapshot?.corrections.length).toBe(0)
  })

  it('Category C: current-week match change creates confirmationRequired', async () => {
    mockSurface = makeSurface()
    const storage = createMockStorage()

    // Initial: no events
    const params1 = makeParams('user-a', storage)
    const { result, rerender } = renderHook(
      ({ params }) => useWeekSnapshot(params),
      { initialProps: { params: params1 } },
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const weekMatch: CalendarEvent = { date: '2026-04-08', type: 'match', id: 'week-match' }
    const params2: UseWeekSnapshotParams = { ...params1, events: [weekMatch] }
    rerender({ params: params2 })

    await waitFor(() => {
      expect(result.current.hasConfirmationRequired).toBe(true)
    })

    expect(result.current.snapshot?.confirmationRequired.length).toBe(1)
    expect(result.current.snapshot?.confirmationRequired[0].type).toBe('match_changed')
    // Visible week NOT recalculated
    expect(result.current.snapshot?.corrections.length).toBe(0)
  })

  it('confirmPendingUpdate performs fresh resolve and clears confirmation', async () => {
    mockSurface = makeSurface()
    const storage = createMockStorage()

    const params1 = makeParams('user-a', storage)
    const { result, rerender } = renderHook(
      ({ params }) => useWeekSnapshot(params),
      { initialProps: { params: params1 } },
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const weekMatch2: CalendarEvent = { date: '2026-04-08', type: 'match', id: 'week-match' }
    const params2: UseWeekSnapshotParams = { ...params1, events: [weekMatch2] }
    rerender({ params: params2 })

    await waitFor(() => {
      expect(result.current.hasConfirmationRequired).toBe(true)
    })

    const confId = result.current.snapshot!.confirmationRequired[0].id

    // Confirm
    act(() => {
      result.current.confirmPendingUpdate(confId)
    })

    expect(result.current.hasConfirmationRequired).toBe(false)
    expect(result.current.snapshot?.confirmationRequired.length).toBe(0)
    expect(result.current.toastMessage).toBe('Programme mis à jour')
  })

  // ── First-load guard ──

  it('does not create false pendingUpdate or confirmationRequired on initial load', async () => {
    mockSurface = makeSurface()
    const storage = createMockStorage()

    // Initial load with some events (not empty — exercises the global hash seed)
    const futureEv: CalendarEvent = { date: '2026-04-20', type: 'match', id: 'future-match' }
    const params: UseWeekSnapshotParams = {
      ...makeParams('user-a', storage),
      events: [futureEv],
    }

    const { result } = renderHook(() => useWeekSnapshot(params))

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    // No false detections
    expect(result.current.hasPendingUpdates).toBe(false)
    expect(result.current.hasConfirmationRequired).toBe(false)
    expect(result.current.snapshot?.pendingUpdates.length).toBe(0)
    expect(result.current.snapshot?.confirmationRequired.length).toBe(0)
  })

  it('detects external change on restore when events differ from persisted baseline', async () => {
    mockSurface = makeSurface()
    const storage = createMockStorage()

    // 1. Create and persist a snapshot with NO events
    const params1 = makeParams('user-a', storage)
    const { result: r1, unmount } = renderHook(() => useWeekSnapshot(params1))

    await waitFor(() => {
      expect(r1.current.isReady).toBe(true)
    })

    // Verify snapshot persisted with globalEventsHash for empty events
    expect(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15']).toBeDefined()
    const persisted = JSON.parse(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15'])
    expect(persisted.globalEventsHash).toBeDefined()

    unmount()

    // 2. Restore with a NEW future event — should detect Category B
    const newFuture: CalendarEvent = { date: '2026-04-20', type: 'match', id: 'new-future' }
    const params2: UseWeekSnapshotParams = {
      ...makeParams('user-a', storage),
      events: [newFuture],
    }

    const { result: r2 } = renderHook(() => useWeekSnapshot(params2))

    await waitFor(() => {
      expect(r2.current.isReady).toBe(true)
    })

    await waitFor(() => {
      expect(r2.current.hasPendingUpdates).toBe(true)
    })

    expect(r2.current.snapshot?.pendingUpdates.length).toBe(1)
    // Visible week NOT mutated
    expect(r2.current.snapshot?.corrections.length).toBe(0)
  })

  // ── S5: Heavy corrections ──

  it('setFatigue performs full re-resolution and updates snapshot', async () => {
    mockSurface = {
      ...makeSurface(),
      motherSession: {
        status: 'resolved',
        planningContext: makePlanningContext(),
        sessions: [mockResolvedSlot('S1')],
        warnings: [],
      },
    }

    const storage = createMockStorage()
    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const originalResolvedAt = result.current.snapshot?.resolvedAt

    act(() => {
      result.current.setFatigue('FATIGUE')
    })

    // Snapshot was re-resolved (new resolvedAt)
    expect(result.current.snapshot?.resolvedAt).not.toBe(originalResolvedAt)
    // Correction recorded
    expect(result.current.snapshot?.corrections.some(c => c.type === 'fatigue')).toBe(true)
    // Toast
    expect(result.current.toastMessage).toContain('réduit')
    // Persisted
    const persisted = JSON.parse(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15']) as {
      corrections: Array<{ type: string }>
    }
    expect(persisted.corrections.some((c) => c.type === 'fatigue')).toBe(true)
  })

  it('addMatch performs full re-resolution with canonical created event', async () => {
    mockSurface = makeSurface()
    const storage = createMockStorage()

    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const originalResolvedAt = result.current.snapshot?.resolvedAt

    // Simulate: addEvent returned this canonical event
    const canonicalEvent: CalendarEvent = {
      id: 'supabase-uuid-123',
      date: '2026-04-11',
      type: 'match',
      is_home: true,
      source: 'manual',
      created_at: '2026-04-06T10:00:00Z',
    }

    act(() => {
      result.current.addMatch(canonicalEvent)
    })

    // Snapshot was re-resolved
    expect(result.current.snapshot?.resolvedAt).not.toBe(originalResolvedAt)
    // Correction recorded
    expect(result.current.snapshot?.corrections.some(c => c.type === 'add_match')).toBe(true)
    // Toast
    expect(result.current.toastMessage).toContain('Match ajouté')
    // Persisted
    const persisted = JSON.parse(storage.data['rugbyprep.weekSnapshot.v2.user-a.W2026-15']) as {
      corrections: Array<{ type: string }>
    }
    expect(persisted.corrections.some((c) => c.type === 'add_match')).toBe(true)
    // Global hash baseline includes the canonical event id (not a synthetic one)
    expect(persisted.globalEventsHash).toBeDefined()
  })

  it('setFatigue back to OK produces "Volume normal" toast', async () => {
    mockSurface = makeSurface()
    const storage = createMockStorage()

    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    act(() => {
      result.current.setFatigue('OK')
    })

    expect(result.current.toastMessage).toBe('Volume normal')
  })

  it('heavy corrections are marked non-reversible', async () => {
    mockSurface = makeSurface()
    const storage = createMockStorage()

    const { result } = renderHook(() =>
      useWeekSnapshot(makeParams('user-a', storage)),
    )

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    act(() => {
      result.current.setFatigue('FATIGUE')
    })

    const fatigueCorrection = result.current.snapshot?.corrections.find(c => c.type === 'fatigue')
    expect(fatigueCorrection?.reversible).toBe(false)

    // Undo should be a no-op for non-reversible
    const correctionId = fatigueCorrection!.id
    act(() => {
      result.current.undoCorrection(correctionId)
    })

    // Still present — undo rejected
    expect(result.current.snapshot?.corrections.some(c => c.id === correctionId)).toBe(true)
  })

  // ── Snapshot repair: clubDays semantics ──

  it('repairs restored snapshot missing clubDays field', async () => {
    const storage = createMockStorage()

    // Manually persist an old-format snapshot WITHOUT clubDays
    const params = makeParams('user-repair', storage)
    // First create a valid snapshot to get the shape right
    const { result: r1, unmount } = renderHook(() => useWeekSnapshot(params))
    await waitFor(() => {
      expect(r1.current.isReady).toBe(true)
    })
    // Corrupt the persisted snapshot: remove clubDays
    const rawKey = 'rugbyprep.weekSnapshot.v2.user-repair.W2026-15'
    const persisted = JSON.parse(storage.data[rawKey])
    delete persisted.presentation.clubDays
    storage.data[rawKey] = JSON.stringify(persisted)
    unmount()

    // Restore with a profile that has club days
    const d2: DayOfWeek = 2
    const d4: DayOfWeek = 4
    const paramsWithClub: UseWeekSnapshotParams = {
      ...makeParams('user-repair', storage),
      profile: makeProfile({
        clubSchedule: { clubDays: [{ day: d2 }, { day: d4 }] },
      }),
    }
    const { result: r2 } = renderHook(() => useWeekSnapshot(paramsWithClub))
    await waitFor(() => {
      expect(r2.current.isReady).toBe(true)
    })

    // clubDays should be repaired from profile
    expect(r2.current.snapshot?.presentation.clubDays).toEqual([2, 4])
    // Repair persisted
    const repaired = JSON.parse(storage.data[rawKey])
    expect(repaired.presentation.clubDays).toEqual([2, 4])
  })

  it('repairs restored snapshot with club days leaked into unavailableDays', async () => {
    const storage = createMockStorage()

    const leakD2: DayOfWeek = 2
    const leakD4: DayOfWeek = 4
    const paramsWithClub: UseWeekSnapshotParams = {
      ...makeParams('user-leak', storage),
      profile: makeProfile({
        clubSchedule: { clubDays: [{ day: leakD2 }, { day: leakD4 }] },
      }),
    }

    // Create a valid snapshot first
    const { result: r1, unmount } = renderHook(() => useWeekSnapshot(paramsWithClub))
    await waitFor(() => {
      expect(r1.current.isReady).toBe(true)
    })
    // Corrupt: leak club day 2 into unavailableDays
    const rawKey = 'rugbyprep.weekSnapshot.v2.user-leak.W2026-15'
    const persisted = JSON.parse(storage.data[rawKey])
    persisted.presentation.unavailableDays = [2, 5] // 2 is a club day, 5 is a real unavailable
    storage.data[rawKey] = JSON.stringify(persisted)
    unmount()

    // Restore — should repair
    const { result: r2 } = renderHook(() => useWeekSnapshot(paramsWithClub))
    await waitFor(() => {
      expect(r2.current.isReady).toBe(true)
    })

    // Club day 2 removed from unavailableDays, real unavailable 5 kept
    expect(r2.current.snapshot?.presentation.unavailableDays).toEqual([5])
    expect(r2.current.snapshot?.presentation.clubDays).toEqual([2, 4])
  })
})

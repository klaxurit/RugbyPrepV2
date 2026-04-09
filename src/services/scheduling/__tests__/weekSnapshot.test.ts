import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  resolveWeek,
  patchWeek,
  toISOWeekId,
  computeEventsFingerprint,
  computeGlobalEventsHash,
  saveSnapshot,
  loadSnapshot,
  classifyExternalChange,
  rebuildWithoutCorrection,
  rebuildWithRemainingCorrections,
  expireCorrections,
  migrateSnapshot,
  CURRENT_SCHEMA_VERSION,
  type SnapshotStorage,
} from '../weekSnapshot'
import type { WeeklyProgramSurfaceResult } from '../../program/resolveWeeklyProgramSurface'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import type { BlockProgressionState, DayOfWeek, WeekCorrection, WeekSnapshot } from '../../../types/scheduling'

// ── Mocks ───────────────────────────────────────────────────────────

const mockResolveWeekPresentation = vi.fn()
const mockResolveWeeklyProgramSurface = vi.fn()

vi.mock('../resolveWeekPresentation', () => ({
  resolveWeekPresentation: (...args: unknown[]) => mockResolveWeekPresentation(...args),
}))

vi.mock('../../program/resolveWeeklyProgramSurface', () => ({
  resolveWeeklyProgramSurface: (...args: unknown[]) => mockResolveWeeklyProgramSurface(...args),
}))

// ── Helpers ─────────────────────────────────────────────────────────

function makePlanningContext(cycle: AnnualPlanningContext['cycle'] = 'off_season'): AnnualPlanningContext {
  return {
    cycle,
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

function makeSurface(mode: 'calendar' | 'sequential' = 'calendar'): WeeklyProgramSurfaceResult {
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
    schedulingMode: mode,
    schedulingModeResult: {
      mode,
      confidence: 'high',
      reason: 'test',
      calendarSignalStrength: 0,
    },
  }
}

function makeCorrection(
  type: WeekCorrection['type'] = 'reschedule',
  overrides?: Partial<WeekCorrection>,
): WeekCorrection {
  return {
    id: `c-${Date.now()}`,
    type,
    appliedAt: new Date().toISOString(),
    reversible: true,
    ...overrides,
  }
}

function makePresentation() {
  return {
    sessions: [],
    matchEvents: [],
    unavailableDays: [],
    clubDays: [],
    corrections: [],
    mode: 'calendar' as const,
  }
}

function makeBlockProgression(): BlockProgressionState {
  return {
    currentBlockIndex: 0,
    sessionsCompletedInBlock: 2,
    totalSessionsInBlock: 12,
    consecutiveIncompleteBlocks: 0,
    currentBlockLabel: 'Inter-saison · Hypertrophie',
    lastAdvancedAt: '2026-04-06',
  }
}

function createMockStorage(): SnapshotStorage & { data: Record<string, string> } {
  const data: Record<string, string> = {}
  return {
    data,
    getItem(key: string) { return data[key] ?? null },
    setItem(key: string, value: string) { data[key] = value },
    removeItem(key: string) { delete data[key] },
  }
}

const TODAY = '2026-04-06' // Monday

// ── Setup ───────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockResolveWeekPresentation.mockReturnValue(makePresentation())
})

// ── toISOWeekId ─────────────────────────────────────────────────────

describe('toISOWeekId', () => {
  it('produces W{year}-{week} format', () => {
    const id = toISOWeekId('2026-04-06')
    expect(id).toMatch(/^W\d{4}-\d+$/)
  })

  it('same week, different days → same weekId', () => {
    // Monday and Friday of the same week
    expect(toISOWeekId('2026-04-06')).toBe(toISOWeekId('2026-04-10'))
  })

  it('Monday and Sunday of same ISO week → same weekId', () => {
    // 2026-04-06 is Monday, 2026-04-12 is Sunday of the same ISO week
    expect(toISOWeekId('2026-04-06')).toBe(toISOWeekId('2026-04-12'))
  })

  it('Sunday and next Monday → different weekId', () => {
    // 2026-04-12 is Sunday, 2026-04-13 is next Monday
    expect(toISOWeekId('2026-04-12')).not.toBe(toISOWeekId('2026-04-13'))
  })

  it('different weeks → different weekId', () => {
    expect(toISOWeekId('2026-04-06')).not.toBe(toISOWeekId('2026-04-13'))
  })

  it('year boundary: Dec 28-31 2026 and Jan 1-3 2027 → same W2026-53', () => {
    // Jan 4 2027 is a Monday → ISO week 1 of 2027 starts Jan 4.
    // Dec 28 2026 (Mon) through Jan 3 2027 (Sun) = week 53 of 2026.
    expect(toISOWeekId('2026-12-28')).toBe('W2026-53')
    expect(toISOWeekId('2026-12-31')).toBe('W2026-53')
    expect(toISOWeekId('2027-01-01')).toBe('W2026-53')
    expect(toISOWeekId('2027-01-03')).toBe('W2026-53')
  })

  it('year boundary: Jan 4 2027 (Monday) → W2027-1', () => {
    expect(toISOWeekId('2027-01-04')).toBe('W2027-1')
  })

  it('known reference: 2026-01-01 (Thursday) → W2026-1', () => {
    // Jan 1 2026 is a Thursday. Week 1 contains Jan 4 (which is Sunday of that week).
    // Jan 1 Thu → its week's Thursday is Jan 1 → year 2026 → W2026-1
    expect(toISOWeekId('2026-01-01')).toBe('W2026-1')
  })
})

// ── computeEventsFingerprint ────────────────────────────────────────

describe('computeEventsFingerprint', () => {
  const weekId = toISOWeekId(TODAY)

  it('is deterministic for same events', () => {
    const events = [
      { date: '2026-04-07', type: 'match' as const, id: 'm1' },
      { date: '2026-04-10', type: 'rest' as const, id: 'r1' },
    ]
    expect(computeEventsFingerprint(events, weekId))
      .toBe(computeEventsFingerprint(events, weekId))
  })

  it('is order-independent (sorted internally)', () => {
    const a = [
      { date: '2026-04-10', type: 'rest' as const, id: 'r1' },
      { date: '2026-04-07', type: 'match' as const, id: 'm1' },
    ]
    const b = [
      { date: '2026-04-07', type: 'match' as const, id: 'm1' },
      { date: '2026-04-10', type: 'rest' as const, id: 'r1' },
    ]
    expect(computeEventsFingerprint(a, weekId))
      .toBe(computeEventsFingerprint(b, weekId))
  })

  it('is order-independent for same-date same-type events with different ids', () => {
    const a = [
      { date: '2026-04-07', type: 'match' as const, id: 'z9' },
      { date: '2026-04-07', type: 'match' as const, id: 'a1' },
    ]
    const b = [
      { date: '2026-04-07', type: 'match' as const, id: 'a1' },
      { date: '2026-04-07', type: 'match' as const, id: 'z9' },
    ]
    expect(computeEventsFingerprint(a, weekId))
      .toBe(computeEventsFingerprint(b, weekId))
  })

  it('changes when events differ', () => {
    const a = [{ date: '2026-04-07', type: 'match' as const }]
    const b = [{ date: '2026-04-08', type: 'match' as const }]
    expect(computeEventsFingerprint(a, weekId))
      .not.toBe(computeEventsFingerprint(b, weekId))
  })

  it('ignores events outside the ISO week', () => {
    const inside = [{ date: '2026-04-07', type: 'match' as const }]
    const withOutside = [
      { date: '2026-04-07', type: 'match' as const },
      { date: '2026-04-20', type: 'match' as const }, // different week
    ]
    expect(computeEventsFingerprint(inside, weekId))
      .toBe(computeEventsFingerprint(withOutside, weekId))
  })

  it('returns "0" for no events in week', () => {
    expect(computeEventsFingerprint([], weekId)).toBe('0')
  })

  it('includes Monday of the ISO week', () => {
    // 2026-04-06 is Monday of the week
    const mondayEvent = [{ date: '2026-04-06', type: 'match' as const }]
    expect(computeEventsFingerprint(mondayEvent, weekId)).not.toBe('0')
  })

  it('includes Sunday of the ISO week', () => {
    // 2026-04-12 is Sunday of the week starting 2026-04-06
    const sundayEvent = [{ date: '2026-04-12', type: 'match' as const }]
    expect(computeEventsFingerprint(sundayEvent, weekId)).not.toBe('0')
  })

  it('excludes next Monday (start of next ISO week)', () => {
    // 2026-04-13 is the Monday of the next week
    const nextMondayEvent = [{ date: '2026-04-13', type: 'match' as const }]
    expect(computeEventsFingerprint(nextMondayEvent, weekId)).toBe('0')
  })
})

// ── resolveWeek ─────────────────────────────────────────────────────

describe('resolveWeek', () => {
  it('creates a complete snapshot', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    expect(snapshot.weekId).toBe(toISOWeekId(TODAY))
    expect(snapshot.resolvedAt).toBeDefined()
    expect(snapshot.eventsFingerprint).toBeDefined()
    expect(snapshot.surface).toBeDefined()
    expect(snapshot.presentation).toBeDefined()
    expect(snapshot.corrections).toEqual([])
    expect(snapshot.pendingUpdates).toEqual([])
    expect(snapshot.confirmationRequired).toEqual([])
  })

  it('calls resolveWeekPresentation with empty corrections', () => {
    resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    expect(mockResolveWeekPresentation).toHaveBeenCalledTimes(1)
    const call = mockResolveWeekPresentation.mock.calls[0][0]
    expect(call.corrections).toEqual([])
  })

  it('does NOT call resolveWeeklyProgramSurface (layering)', () => {
    resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    expect(mockResolveWeeklyProgramSurface).not.toHaveBeenCalled()
  })

  it('is pure — does not call getBlockProgression or any localStorage', () => {
    // resolveWeek receives blockProgression as input, doesn't compute it
    const bp = makeBlockProgression()
    const snapshot = resolveWeek({
      surface: makeSurface('sequential'),
      events: [],
      today: TODAY,
      blockProgression: bp,
    })

    expect(snapshot.blockProgression).toBe(bp)
  })

  it('includes blockProgression when provided', () => {
    const bp = makeBlockProgression()
    const snapshot = resolveWeek({
      surface: makeSurface('sequential'),
      events: [],
      today: TODAY,
      blockProgression: bp,
    })

    expect(snapshot.blockProgression).toBeDefined()
    expect(snapshot.blockProgression?.currentBlockLabel).toBe('Inter-saison · Hypertrophie')
  })

  it('includes explanation in resolved snapshot', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    expect(snapshot.explanation).toBeDefined()
    expect(snapshot.explanation?.summaryLine).toBeDefined()
    expect(snapshot.explanation?.detailLines).toBeDefined()
    expect(snapshot.explanation?.corrections).toEqual([])
  })

  it('omits blockProgression when not provided', () => {
    const snapshot = resolveWeek({
      surface: makeSurface('calendar'),
      events: [],
      today: TODAY,
    })

    expect(snapshot.blockProgression).toBeUndefined()
  })

  it('clears pendingUpdates from previous snapshot', () => {
    const previousSnapshot = {
      ...resolveWeek({ surface: makeSurface(), events: [], today: TODAY }),
      pendingUpdates: [
        { id: 'p1', source: 'ffr_sync' as const, description: 'test', affectsCurrentWeek: false, data: null, detectedAt: TODAY },
      ],
    }

    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
      previousSnapshot,
    })

    expect(snapshot.pendingUpdates).toEqual([])
  })
})

// ── patchWeek ───────────────────────────────────────────────────────

describe('patchWeek', () => {
  it('reschedule: preserves surface and resolvedAt', () => {
    const original = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const correction = makeCorrection('reschedule', { sessionId: 's1', toDay: 4 })

    const patched = patchWeek(original, correction, {
      events: [],
      today: TODAY,
    })

    expect(patched.surface).toBe(original.surface)
    expect(patched.resolvedAt).toBe(original.resolvedAt)
    expect(patched.corrections).toHaveLength(1)
    expect(patched.corrections[0].type).toBe('reschedule')
  })

  it('skip: preserves surface and resolvedAt', () => {
    const original = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const patched = patchWeek(original, makeCorrection('skip'), {
      events: [],
      today: TODAY,
    })

    expect(patched.surface).toBe(original.surface)
    expect(patched.resolvedAt).toBe(original.resolvedAt)
  })

  it('unavailable_day: preserves surface and resolvedAt', () => {
    const original = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const patched = patchWeek(original, makeCorrection('unavailable_day'), {
      events: [],
      today: TODAY,
    })

    expect(patched.surface).toBe(original.surface)
    expect(patched.resolvedAt).toBe(original.resolvedAt)
  })

  it('fatigue: uses newSurface when provided', () => {
    const original = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const freshSurface = makeSurface('calendar')
    const patched = patchWeek(original, makeCorrection('fatigue'), {
      events: [],
      today: TODAY,
      newSurface: freshSurface,
    })

    expect(patched.surface).toBe(freshSurface)
    expect(patched.resolvedAt).toBe(original.resolvedAt)
  })

  it('add_match: uses newSurface when provided', () => {
    const original = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const freshSurface = makeSurface('calendar')
    const patched = patchWeek(original, makeCorrection('add_match'), {
      events: [{ date: '2026-04-11', type: 'match' as const }],
      today: TODAY,
      newSurface: freshSurface,
    })

    expect(patched.surface).toBe(freshSurface)
    expect(patched.corrections).toHaveLength(1)
    expect(patched.corrections[0].type).toBe('add_match')
  })

  it('fatigue: recomputes eventsFingerprint', () => {
    const original = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const patched = patchWeek(original, makeCorrection('fatigue'), {
      events: [{ date: '2026-04-07', type: 'match' as const }],
      today: TODAY,
      newSurface: makeSurface(),
    })

    expect(patched.eventsFingerprint).not.toBe(original.eventsFingerprint)
  })

  it('reschedule: does NOT recompute eventsFingerprint', () => {
    const original = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const patched = patchWeek(original, makeCorrection('reschedule'), {
      events: [{ date: '2026-04-07', type: 'match' as const }],
      today: TODAY,
    })

    expect(patched.eventsFingerprint).toBe(original.eventsFingerprint)
  })

  it('accumulates corrections across patches', () => {
    let snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    snapshot = patchWeek(snapshot, makeCorrection('reschedule', { id: 'c1' }), {
      events: [],
      today: TODAY,
    })
    snapshot = patchWeek(snapshot, makeCorrection('skip', { id: 'c2' }), {
      events: [],
      today: TODAY,
    })

    expect(snapshot.corrections).toHaveLength(2)
    expect(snapshot.corrections[0].id).toBe('c1')
    expect(snapshot.corrections[1].id).toBe('c2')
  })

  it('recalculates presentation on every patch', () => {
    const original = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    vi.clearAllMocks()
    mockResolveWeekPresentation.mockReturnValue(makePresentation())

    patchWeek(original, makeCorrection('skip'), {
      events: [],
      today: TODAY,
    })

    expect(mockResolveWeekPresentation).toHaveBeenCalledTimes(1)
    const call = mockResolveWeekPresentation.mock.calls[0][0]
    expect(call.corrections).toHaveLength(1)
  })

  it('patchWeek regenerates explanation with corrections', () => {
    const original = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    expect(original.explanation?.corrections).toEqual([])

    const patched = patchWeek(original, makeCorrection('skip', { id: 'c1', sessionId: 's1' }), {
      events: [],
      today: TODAY,
    })

    expect(patched.explanation).toBeDefined()
    expect(patched.explanation?.corrections.length).toBeGreaterThan(0)
  })

  it('heavy patch updates blockProgression when provided', () => {
    const original = resolveWeek({
      surface: makeSurface('sequential'),
      events: [],
      today: TODAY,
      blockProgression: makeBlockProgression(),
    })

    const updatedBp: BlockProgressionState = {
      ...makeBlockProgression(),
      currentBlockLabel: 'Updated Label',
    }

    const patched = patchWeek(original, makeCorrection('fatigue'), {
      events: [],
      today: TODAY,
      newSurface: makeSurface('sequential'),
      blockProgression: updatedBp,
    })

    expect(patched.blockProgression?.currentBlockLabel).toBe('Updated Label')
  })
})

// ── Persistence ─────────────────────────────────────────────────────

describe('saveSnapshot / loadSnapshot', () => {
  it('saves and loads a snapshot', () => {
    const storage = createMockStorage()
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    saveSnapshot('user-1', snapshot, storage)
    const loaded = loadSnapshot('user-1', TODAY, storage)

    expect(loaded).not.toBeNull()
    expect(loaded?.weekId).toBe(snapshot.weekId)
  })

  it('returns null for missing snapshot', () => {
    const storage = createMockStorage()
    expect(loadSnapshot('user-1', TODAY, storage)).toBeNull()
  })

  it('returns null for corrupted JSON (v2 key)', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.weekSnapshot.v2.user-1.W2026-15'] = 'not-json!!!'
    expect(loadSnapshot('user-1', TODAY, storage)).toBeNull()
  })

  it('returns null for corrupted JSON (v1 legacy key)', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.weekSnapshot.v1.user-1'] = 'not-json!!!'
    expect(loadSnapshot('user-1', TODAY, storage)).toBeNull()
  })

  it('returns null for expired snapshot (different weekId)', () => {
    const storage = createMockStorage()
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    saveSnapshot('user-1', snapshot, storage)
    const loaded = loadSnapshot('user-1', '2026-04-13', storage)
    expect(loaded).toBeNull()
  })

  it('returns snapshot when weekId matches', () => {
    const storage = createMockStorage()
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    saveSnapshot('user-1', snapshot, storage)
    const loaded = loadSnapshot('user-1', '2026-04-08', storage)
    expect(loaded).not.toBeNull()
    expect(loaded?.weekId).toBe(snapshot.weekId)
  })

  it('loads without expiry check when today is omitted (v1 legacy path)', () => {
    const storage = createMockStorage()
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    // Simulate a v1 legacy snapshot (today=undefined can only find v1 keys)
    storage.data['rugbyprep.weekSnapshot.v1.user-1'] = JSON.stringify(snapshot)
    const loaded = loadSnapshot('user-1', undefined, storage)
    expect(loaded).not.toBeNull()
  })

  it('scopes by userId', () => {
    const storage = createMockStorage()
    const s1 = resolveWeek({ surface: makeSurface(), events: [], today: TODAY })
    const s2 = resolveWeek({ surface: makeSurface(), events: [], today: TODAY })

    saveSnapshot('user-a', s1, storage)
    saveSnapshot('user-b', s2, storage)

    expect(loadSnapshot('user-a', TODAY, storage)?.resolvedAt).toBe(s1.resolvedAt)
    expect(loadSnapshot('user-b', TODAY, storage)?.resolvedAt).toBe(s2.resolvedAt)
  })

  it('returns null for structurally invalid parsed object (missing weekId)', () => {
    const storage = createMockStorage()
    // Load without today so we can test the v1 fallback path for invalid shapes
    storage.data['rugbyprep.weekSnapshot.v1.user-1'] = JSON.stringify({ foo: 'bar' })
    expect(loadSnapshot('user-1', undefined, storage)).toBeNull()
  })

  it('returns null for object missing core arrays (v2 key)', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.weekSnapshot.v2.user-1.W2026-15'] = JSON.stringify({
      weekId: 'W2026-15',
      resolvedAt: '2026-04-06T00:00:00Z',
      eventsFingerprint: '0',
      surface: {},
      presentation: {},
      // missing corrections, pendingUpdates, confirmationRequired
    })
    expect(loadSnapshot('user-1', TODAY, storage)).toBeNull()
  })

  it('returns null for object with non-array corrections (v2 key)', () => {
    const storage = createMockStorage()
    storage.data['rugbyprep.weekSnapshot.v2.user-1.W2026-15'] = JSON.stringify({
      weekId: 'W2026-15',
      resolvedAt: '2026-04-06T00:00:00Z',
      eventsFingerprint: '0',
      surface: {},
      presentation: {},
      corrections: 'not-array',
      pendingUpdates: [],
      confirmationRequired: [],
    })
    expect(loadSnapshot('user-1', TODAY, storage)).toBeNull()
  })

  it('F11: saveSnapshot does not throw when storage.setItem throws', () => {
    const throwingStorage: SnapshotStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError') },
    }
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    // Should not throw — degrades gracefully
    expect(() => saveSnapshot('user-1', snapshot, throwingStorage)).not.toThrow()
  })

  // ── F12: Week-scoped storage ──

  it('F12: different weeks for same user persist distinct snapshots', () => {
    const storage = createMockStorage()

    const week15 = resolveWeek({ surface: makeSurface(), events: [], today: '2026-04-06' })
    const week16 = resolveWeek({ surface: makeSurface(), events: [], today: '2026-04-13' })

    saveSnapshot('user-1', week15, storage)
    saveSnapshot('user-1', week16, storage)

    // Both snapshots exist under different keys
    const loaded15 = loadSnapshot('user-1', '2026-04-06', storage)
    const loaded16 = loadSnapshot('user-1', '2026-04-13', storage)

    expect(loaded15).not.toBeNull()
    expect(loaded16).not.toBeNull()
    expect(loaded15?.weekId).toBe(week15.weekId)
    expect(loaded16?.weekId).toBe(week16.weekId)
    expect(loaded15?.weekId).not.toBe(loaded16?.weekId)
  })

  it('F12: saving week B does not overwrite week A', () => {
    const storage = createMockStorage()

    const weekA = resolveWeek({ surface: makeSurface(), events: [], today: '2026-04-06' })
    saveSnapshot('user-1', weekA, storage)

    const weekB = resolveWeek({ surface: makeSurface(), events: [], today: '2026-04-13' })
    saveSnapshot('user-1', weekB, storage)

    // Week A is still loadable
    const loadedA = loadSnapshot('user-1', '2026-04-06', storage)
    expect(loadedA).not.toBeNull()
    expect(loadedA?.weekId).toBe(weekA.weekId)
    expect(loadedA?.resolvedAt).toBe(weekA.resolvedAt)
  })

  it('F12: v1 legacy key is read as fallback and migrated to v2', () => {
    const storage = createMockStorage()

    // Simulate a snapshot stored under the old v1 key
    const snapshot = resolveWeek({ surface: makeSurface(), events: [], today: TODAY })
    storage.data['rugbyprep.weekSnapshot.v1.user-1'] = JSON.stringify(snapshot)

    // Load should find it via legacy fallback
    const loaded = loadSnapshot('user-1', TODAY, storage)
    expect(loaded).not.toBeNull()
    expect(loaded?.weekId).toBe(snapshot.weekId)

    // Legacy key should be cleaned up
    expect(storage.data['rugbyprep.weekSnapshot.v1.user-1']).toBeUndefined()
    // v2 key should now exist
    expect(storage.data[`rugbyprep.weekSnapshot.v2.user-1.${snapshot.weekId}`]).toBeDefined()
  })

  it('F12: v2 key takes precedence over v1 legacy key', () => {
    const storage = createMockStorage()

    const snapshotV1 = resolveWeek({ surface: makeSurface(), events: [], today: TODAY })
    const snapshotV2 = resolveWeek({ surface: makeSurface(), events: [], today: TODAY })

    // Store both under v1 and v2 keys (v2 is newer)
    storage.data['rugbyprep.weekSnapshot.v1.user-1'] = JSON.stringify(snapshotV1)
    storage.data[`rugbyprep.weekSnapshot.v2.user-1.${snapshotV2.weekId}`] = JSON.stringify(snapshotV2)

    const loaded = loadSnapshot('user-1', TODAY, storage)
    expect(loaded).not.toBeNull()
    // Should get v2, not v1
    expect(loaded?.resolvedAt).toBe(snapshotV2.resolvedAt)
  })

  it('F12: v1 legacy key with wrong weekId is not loaded', () => {
    const storage = createMockStorage()

    // Snapshot for a different week stored under v1 key
    const snapshot = resolveWeek({ surface: makeSurface(), events: [], today: '2026-03-30' })
    storage.data['rugbyprep.weekSnapshot.v1.user-1'] = JSON.stringify(snapshot)

    // Asking for current week should not load the old-week snapshot
    const loaded = loadSnapshot('user-1', TODAY, storage)
    expect(loaded).toBeNull()
  })
})

// ── classifyExternalChange ──────────────────────────────────────────

describe('classifyExternalChange', () => {
  it('Category B: future-only match does not affect current week', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const result = classifyExternalChange(snapshot, [
      { date: '2026-04-20', type: 'match', id: 'future' },
    ])

    expect(result.changed).toBe(true)
    expect(result.category).toBe('B')
  })

  it('Category C: current-week match added', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const result = classifyExternalChange(snapshot, [
      { date: '2026-04-11', type: 'match', id: 'sat-match' },
    ])

    expect(result.changed).toBe(true)
    expect(result.category).toBe('C')
  })
})

describe('computeGlobalEventsHash', () => {
  it('is deterministic', () => {
    const events = [{ date: '2026-04-20', type: 'match' as const, id: 'a' }]
    expect(computeGlobalEventsHash(events)).toBe(computeGlobalEventsHash(events))
  })

  it('changes when events differ', () => {
    const a = [{ date: '2026-04-20', type: 'match' as const }]
    const b = [{ date: '2026-04-21', type: 'match' as const }]
    expect(computeGlobalEventsHash(a)).not.toBe(computeGlobalEventsHash(b))
  })

  it('returns "0" for empty events', () => {
    expect(computeGlobalEventsHash([])).toBe('0')
  })

  it('is order-independent for same-date same-type events with different ids', () => {
    const a = [
      { date: '2026-04-20', type: 'match' as const, id: 'z9' },
      { date: '2026-04-20', type: 'match' as const, id: 'a1' },
    ]
    const b = [
      { date: '2026-04-20', type: 'match' as const, id: 'a1' },
      { date: '2026-04-20', type: 'match' as const, id: 'z9' },
    ]
    expect(computeGlobalEventsHash(a)).toBe(computeGlobalEventsHash(b))
  })
})

// ── rebuildWithoutCorrection ────────────────────────────────────────

describe('rebuildWithoutCorrection', () => {
  it('removes a correction by id and rebuilds presentation', () => {
    let snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    snapshot = patchWeek(snapshot, makeCorrection('skip', { id: 'c1' }), {
      events: [],
      today: TODAY,
    })
    snapshot = patchWeek(snapshot, makeCorrection('skip', { id: 'c2' }), {
      events: [],
      today: TODAY,
    })

    expect(snapshot.corrections).toHaveLength(2)

    const rebuilt = rebuildWithoutCorrection(snapshot, 'c1', {
      events: [],
      today: TODAY,
    })

    expect(rebuilt.corrections).toHaveLength(1)
    expect(rebuilt.corrections[0].id).toBe('c2')
  })

  it('preserves surface and resolvedAt', () => {
    let snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    snapshot = patchWeek(snapshot, makeCorrection('skip', { id: 'c1' }), {
      events: [],
      today: TODAY,
    })

    const rebuilt = rebuildWithoutCorrection(snapshot, 'c1', {
      events: [],
      today: TODAY,
    })

    expect(rebuilt.surface).toBe(snapshot.surface)
    expect(rebuilt.resolvedAt).toBe(snapshot.resolvedAt)
  })

  it('regenerates explanation after removing a correction', () => {
    let snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    snapshot = patchWeek(snapshot, makeCorrection('skip', { id: 'c1', sessionId: 's1' }), {
      events: [],
      today: TODAY,
    })

    expect(snapshot.explanation?.corrections.length).toBeGreaterThan(0)

    const rebuilt = rebuildWithoutCorrection(snapshot, 'c1', {
      events: [],
      today: TODAY,
    })

    expect(rebuilt.explanation).toBeDefined()
    expect(rebuilt.explanation?.corrections).toEqual([])
  })
})

// ── F8: expireCorrections ──────────────────────────────────────────

describe('expireCorrections (F8)', () => {
  it('returns same array when no corrections are reversible', () => {
    const corrections = [
      makeCorrection('fatigue', { reversible: false }),
    ]
    const result = expireCorrections(corrections)
    expect(result).toBe(corrections) // referential equality — no change
  })

  it('returns same array when all reversible corrections are within 24h', () => {
    const corrections = [
      makeCorrection('skip', { reversible: true, appliedAt: new Date().toISOString() }),
    ]
    const result = expireCorrections(corrections)
    expect(result).toBe(corrections)
  })

  it('marks reversible corrections older than 24h as non-reversible', () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const corrections = [
      makeCorrection('skip', { id: 'old', reversible: true, appliedAt: old }),
      makeCorrection('reschedule', { id: 'new', reversible: true, appliedAt: new Date().toISOString() }),
    ]
    const result = expireCorrections(corrections)
    expect(result).not.toBe(corrections)
    expect(result[0].reversible).toBe(false) // expired
    expect(result[1].reversible).toBe(true) // still valid
  })

  it('does not modify already non-reversible corrections', () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const corrections = [
      makeCorrection('fatigue', { id: 'f1', reversible: false, appliedAt: old }),
    ]
    const result = expireCorrections(corrections)
    expect(result).toBe(corrections)
    expect(result[0].reversible).toBe(false)
  })

  it('F9: add_match reversible within 24h is preserved', () => {
    const corrections = [
      makeCorrection('add_match', { id: 'am1', reversible: true, appliedAt: new Date().toISOString() }),
    ]
    const result = expireCorrections(corrections)
    expect(result).toBe(corrections)
    expect(result[0].reversible).toBe(true)
  })

  it('F9: add_match reversible after 24h is expired', () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const corrections = [
      makeCorrection('add_match', { id: 'am1', reversible: true, appliedAt: old }),
    ]
    const result = expireCorrections(corrections)
    expect(result[0].reversible).toBe(false)
  })
})

// ── F8: loadSnapshot applies expiry ────────────────────────────────

describe('loadSnapshot — correction expiry (F8)', () => {
  it('expires old corrections on load', () => {
    const storage = createMockStorage()
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    // Inject an old reversible correction
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const withOldCorrection = {
      ...snapshot,
      corrections: [
        makeCorrection('skip', { id: 'old-skip', reversible: true, appliedAt: old }),
      ],
    }
    saveSnapshot('user-1', withOldCorrection, storage)

    const loaded = loadSnapshot('user-1', TODAY, storage)
    expect(loaded).not.toBeNull()
    expect(loaded!.corrections[0].reversible).toBe(false)
  })
})

// ── rebuildWithRemainingCorrections ────────────────────────────────

describe('rebuildWithRemainingCorrections', () => {
  it('returns same snapshot when no remaining corrections', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const result = rebuildWithRemainingCorrections(snapshot, [], {
      events: [],
      today: TODAY,
    })

    expect(result).toBe(snapshot) // referential equality
  })

  it('reapplies remaining corrections to presentation and explanation', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const skipCorrection = makeCorrection('skip', { id: 'skip-1', sessionId: 's1' })
    const result = rebuildWithRemainingCorrections(snapshot, [skipCorrection], {
      events: [],
      today: TODAY,
    })

    expect(result.corrections).toHaveLength(1)
    expect(result.corrections[0].id).toBe('skip-1')
    expect(result.explanation?.corrections.length).toBeGreaterThan(0)
    // Presentation was recalculated (mock returns default but the function was called with corrections)
    expect(mockResolveWeekPresentation).toHaveBeenCalled()
    const lastCall = mockResolveWeekPresentation.mock.calls[mockResolveWeekPresentation.mock.calls.length - 1][0]
    expect(lastCall.corrections).toHaveLength(1)
    expect(lastCall.corrections[0].id).toBe('skip-1')
  })
})

// ── Active-snapshot expiry scenario ────────────────────────────────

describe('expireCorrections — active-snapshot scenario', () => {
  it('an already-loaded snapshot loses undo after 24h expiry is applied', () => {
    // Simulate: snapshot was loaded 23h ago, correction was applied 23h ago
    const appliedAt = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
    const corrections = [
      makeCorrection('reschedule', { id: 'r1', reversible: true, appliedAt }),
    ]

    // At load time (23h) — still reversible
    const result1 = expireCorrections(corrections, Date.now())
    expect(result1[0].reversible).toBe(true)

    // After 2 more hours (25h total) — no longer reversible
    const twoHoursLater = Date.now() + 2 * 60 * 60 * 1000
    const result2 = expireCorrections(corrections, twoHoursLater)
    expect(result2[0].reversible).toBe(false)
  })
})

// ── migrateSnapshot ───────────────────────────────────────────────

describe('migrateSnapshot', () => {
  it('new snapshots have schemaVersion and are not changed by migration', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    expect(snapshot.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)

    const { snapshot: migrated, changed } = migrateSnapshot(snapshot, { profileClubDays: [] })
    expect(changed).toBe(false)
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('migrates missing explanation', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })
    // Simulate pre-Slice 3 snapshot without explanation
    const old = { ...snapshot, explanation: undefined, schemaVersion: undefined } as unknown as WeekSnapshot

    const { snapshot: migrated, changed } = migrateSnapshot(old, { profileClubDays: [] })
    expect(changed).toBe(true)
    expect(migrated.explanation).toBeDefined()
    expect(migrated.explanation?.summaryLine).toBeDefined()
  })

  it('migrates missing clubDays in presentation', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })
    // Remove clubDays to simulate old format
    const old = {
      ...snapshot,
      presentation: { ...snapshot.presentation, clubDays: undefined },
      schemaVersion: undefined,
    } as unknown as WeekSnapshot

    const clubDaysProfile: DayOfWeek[] = [2, 4]
    const { snapshot: migrated, changed } = migrateSnapshot(old, { profileClubDays: clubDaysProfile })
    expect(changed).toBe(true)
    expect(migrated.presentation.clubDays).toEqual([2, 4])
  })

  it('repairs club days leaked into unavailableDays', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })
    // Simulate club days leaked into unavailableDays
    const old = {
      ...snapshot,
      presentation: {
        ...snapshot.presentation,
        clubDays: undefined,
        unavailableDays: [2, 4, 1], // 2 and 4 are club days, 1 is legit unavailable
      },
      schemaVersion: undefined,
    } as unknown as WeekSnapshot

    const clubDaysProfile2: DayOfWeek[] = [2, 4]
    const { snapshot: migrated, changed } = migrateSnapshot(old, { profileClubDays: clubDaysProfile2 })
    expect(changed).toBe(true)
    expect(migrated.presentation.clubDays).toEqual([2, 4])
    expect(migrated.presentation.unavailableDays).toEqual([1])
  })

  it('stamps schemaVersion on old snapshots', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })
    const old = { ...snapshot, schemaVersion: undefined } as unknown as WeekSnapshot

    const { snapshot: migrated, changed } = migrateSnapshot(old, { profileClubDays: [] })
    expect(changed).toBe(true)
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('returns changed=false when snapshot is already current', () => {
    const snapshot = resolveWeek({
      surface: makeSurface(),
      events: [],
      today: TODAY,
    })

    const { changed } = migrateSnapshot(snapshot, { profileClubDays: [] })
    expect(changed).toBe(false)
  })
})

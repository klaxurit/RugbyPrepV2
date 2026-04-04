import { describe, expect, it } from 'vitest'
import {
  getBlockProgression,
  previewBlockProgression,
  recordSessionCompletion,
  deriveBlockLabel,
} from '../resolveBlockProgression'
import type { BlockProgressionStorage } from '../resolveBlockProgression'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'

// ── In-memory storage mock ──────────────────────────────────────────

function createMockStorage(): BlockProgressionStorage & { data: Record<string, string> } {
  const data: Record<string, string> = {}
  return {
    data,
    getItem(key: string) { return data[key] ?? null },
    setItem(key: string, value: string) { data[key] = value },
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<AnnualPlanningContext> = {}): AnnualPlanningContext {
  return {
    cycle: 'off_season',
    offSeasonPhase: 1,
    weekLabel: 'Off-season Phase 1 - S1',
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
    ...overrides,
  }
}

const USER_A = 'user-aaa'
const USER_B = 'user-bbb'
const TODAY = '2026-04-06'

// ── Init ────────────────────────────────────────────────────────────

describe('resolveBlockProgression — init', () => {
  it('previewBlockProgression computes initial state without persisting during read-only preview', () => {
    const storage = createMockStorage()

    const state = previewBlockProgression(USER_A, TODAY, makeCtx(), storage)

    expect(state.currentBlockIndex).toBe(0)
    expect(state.currentBlockLabel).toBe('Inter-saison · Hypertrophie')
    expect(storage.data[`rugbyprep.blockProgression.v1.${USER_A}`]).toBeUndefined()
  })

  it('previewBlockProgression matches the state later persisted by getBlockProgression', () => {
    const storage = createMockStorage()

    const preview = previewBlockProgression(USER_A, TODAY, makeCtx(), storage)
    const persisted = getBlockProgression(USER_A, TODAY, makeCtx(), storage)

    expect(preview).toEqual(persisted)
  })

  it('initializes state when absent from storage', () => {
    const storage = createMockStorage()
    const state = getBlockProgression(USER_A, TODAY, makeCtx(), storage)

    expect(state.currentBlockIndex).toBe(0)
    expect(state.sessionsCompletedInBlock).toBe(0)
    expect(state.consecutiveIncompleteBlocks).toBe(0)
    expect(state.totalSessionsInBlock).toBe(12) // 3 sessions/week × 4 weeks
    expect(state.currentBlockLabel).toBe('Inter-saison · Hypertrophie')
    expect(state.lastAdvancedAt).toBe(TODAY)
  })

  it('persists initial state to storage', () => {
    const storage = createMockStorage()
    getBlockProgression(USER_A, TODAY, makeCtx(), storage)
    expect(storage.data[`rugbyprep.blockProgression.v1.${USER_A}`]).toBeDefined()
  })

  it('handles corrupted storage gracefully (re-inits)', () => {
    const storage = createMockStorage()
    storage.data[`rugbyprep.blockProgression.v1.${USER_A}`] = 'not-json!!!'
    const state = getBlockProgression(USER_A, TODAY, makeCtx(), storage)
    expect(state.currentBlockIndex).toBe(0)
  })
})

// ── User scoping ────────────────────────────────────────────────────

describe('resolveBlockProgression — user scoping', () => {
  it('uses separate keys per userId', () => {
    const storage = createMockStorage()
    getBlockProgression(USER_A, TODAY, makeCtx(), storage)
    getBlockProgression(USER_B, TODAY, makeCtx(), storage)

    const keyA = `rugbyprep.blockProgression.v1.${USER_A}`
    const keyB = `rugbyprep.blockProgression.v1.${USER_B}`
    expect(storage.data[keyA]).toBeDefined()
    expect(storage.data[keyB]).toBeDefined()
    // Both keys exist and are distinct keys
    expect(keyA).not.toBe(keyB)

    // Mutating one doesn't affect the other
    recordSessionCompletion(USER_A, 'x', storage)
    const stateA = JSON.parse(storage.data[keyA])
    const stateB = JSON.parse(storage.data[keyB])
    expect(stateA.sessionsCompletedInBlock).toBe(1)
    expect(stateB.sessionsCompletedInBlock).toBe(0)
  })
})

// ── Advancement by completion threshold ─────────────────────────────

describe('resolveBlockProgression — advance by completion', () => {
  it('does not advance at 74% completion', () => {
    const storage = createMockStorage()
    const ctx = makeCtx({ weeklyFrequency: 3 }) // totalSessions = 12
    getBlockProgression(USER_A, TODAY, ctx, storage)

    // Record 8 completions (8/12 = 66%)
    for (let i = 0; i < 8; i++) {
      recordSessionCompletion(USER_A, `s${i}`, storage)
    }

    const state = getBlockProgression(USER_A, TODAY, ctx, storage)
    expect(state.currentBlockIndex).toBe(0)
  })

  it('advances at 75% completion', () => {
    const storage = createMockStorage()
    const ctx = makeCtx({ weeklyFrequency: 3 }) // totalSessions = 12
    getBlockProgression(USER_A, TODAY, ctx, storage)

    // Record 9 completions (9/12 = 75%)
    for (let i = 0; i < 9; i++) {
      recordSessionCompletion(USER_A, `s${i}`, storage)
    }

    const state = getBlockProgression(USER_A, TODAY, ctx, storage)
    expect(state.currentBlockIndex).toBe(1)
    expect(state.sessionsCompletedInBlock).toBe(0)
    expect(state.consecutiveIncompleteBlocks).toBe(0)
    expect(state.lastAdvancedAt).toBe(TODAY)
  })
})

// ── Advancement by elapsed time ─────────────────────────────────────

describe('resolveBlockProgression — advance by elapsed time', () => {
  it('does not advance at 6 days elapsed', () => {
    const storage = createMockStorage()
    const ctx = makeCtx()

    // Init with lastAdvancedAt set
    const initDate = '2026-04-01'
    storage.data[`rugbyprep.blockProgression.v1.${USER_A}`] = JSON.stringify({
      currentBlockIndex: 0,
      sessionsCompletedInBlock: 1,
      totalSessionsInBlock: 12,
      consecutiveIncompleteBlocks: 0,
      currentBlockLabel: 'Inter-saison · Hypertrophie',
      lastAdvancedAt: initDate,
      blockIdentity: 'off_season:1::::',
    })

    // 6 days later
    const state = getBlockProgression(USER_A, '2026-04-07', ctx, storage)
    expect(state.currentBlockIndex).toBe(0)
  })

  it('advances at 7 days elapsed', () => {
    const storage = createMockStorage()
    const ctx = makeCtx()

    const initDate = '2026-04-01'
    storage.data[`rugbyprep.blockProgression.v1.${USER_A}`] = JSON.stringify({
      currentBlockIndex: 0,
      sessionsCompletedInBlock: 1,
      totalSessionsInBlock: 12,
      consecutiveIncompleteBlocks: 0,
      currentBlockLabel: 'Inter-saison · Hypertrophie',
      lastAdvancedAt: initDate,
      blockIdentity: 'off_season:1::::',
    })

    // 7 days later
    const state = getBlockProgression(USER_A, '2026-04-08', ctx, storage)
    expect(state.currentBlockIndex).toBe(1)
    expect(state.lastAdvancedAt).toBe('2026-04-08')
  })

  it('increments consecutiveIncompleteBlocks when advancing by time without completion threshold', () => {
    const storage = createMockStorage()
    const ctx = makeCtx()

    storage.data[`rugbyprep.blockProgression.v1.${USER_A}`] = JSON.stringify({
      currentBlockIndex: 0,
      sessionsCompletedInBlock: 1, // 1/12 < 75%
      totalSessionsInBlock: 12,
      consecutiveIncompleteBlocks: 0,
      currentBlockLabel: 'Inter-saison · Hypertrophie',
      lastAdvancedAt: '2026-04-01',
      blockIdentity: 'off_season:1::::',
    })

    const state = getBlockProgression(USER_A, '2026-04-08', ctx, storage)
    expect(state.consecutiveIncompleteBlocks).toBe(1)
  })

  it('advances initial block by elapsed time alone (no manual lastAdvancedAt setup)', () => {
    const storage = createMockStorage()
    const ctx = makeCtx()

    // Init on day 0
    const initDay = '2026-04-01'
    getBlockProgression(USER_A, initDay, ctx, storage)

    // 7 days later, no completions recorded
    const state = getBlockProgression(USER_A, '2026-04-08', ctx, storage)
    expect(state.currentBlockIndex).toBe(1)
    expect(state.lastAdvancedAt).toBe('2026-04-08')
  })
})

// ── recordSessionCompletion ─────────────────────────────────────────

describe('recordSessionCompletion', () => {
  it('increments sessionsCompletedInBlock', () => {
    const storage = createMockStorage()
    getBlockProgression(USER_A, TODAY, makeCtx(), storage)

    recordSessionCompletion(USER_A, 'session-1', storage)
    recordSessionCompletion(USER_A, 'session-2', storage)

    const raw = JSON.parse(storage.data[`rugbyprep.blockProgression.v1.${USER_A}`])
    expect(raw.sessionsCompletedInBlock).toBe(2)
  })

  it('does nothing if user has no state', () => {
    const storage = createMockStorage()
    // No init — should not throw
    expect(() => recordSessionCompletion(USER_A, 'session-1', storage)).not.toThrow()
  })
})

// ── deriveBlockLabel ────────────────────────────────────────────────

describe('deriveBlockLabel', () => {
  it('off_season phase 1 → Inter-saison · Hypertrophie', () => {
    expect(deriveBlockLabel(makeCtx({ cycle: 'off_season', offSeasonPhase: 1 })))
      .toBe('Inter-saison · Hypertrophie')
  })

  it('off_season phase 3 → Inter-saison · Force', () => {
    expect(deriveBlockLabel(makeCtx({ cycle: 'off_season', offSeasonPhase: 3 })))
      .toBe('Inter-saison · Force')
  })

  it('off_season phase 4 → Inter-saison · Force-Puissance', () => {
    expect(deriveBlockLabel(makeCtx({ cycle: 'off_season', offSeasonPhase: 4 })))
      .toBe('Inter-saison · Force-Puissance')
  })

  it('pre_season phase 1 → Pré-saison · Force', () => {
    expect(deriveBlockLabel(makeCtx({ cycle: 'pre_season', preSeasonPhase: 1 })))
      .toBe('Pré-saison · Force')
  })

  it('pre_season phase 2 → Pré-saison · Puissance', () => {
    expect(deriveBlockLabel(makeCtx({ cycle: 'pre_season', preSeasonPhase: 2 })))
      .toBe('Pré-saison · Puissance')
  })

  it('in_season with mesocycleBlock → Saison · Bloc N', () => {
    expect(deriveBlockLabel(makeCtx({ cycle: 'in_season', mesocycleBlock: 2 })))
      .toBe('Saison · Bloc 2')
  })

  it('playoffs with taper → Playoffs · Taper', () => {
    expect(deriveBlockLabel(makeCtx({ cycle: 'playoffs', playoffTaperPhase: 'taper_1' })))
      .toBe('Playoffs · Taper')
  })

  it('cycle with no phase info → just cycle name', () => {
    expect(deriveBlockLabel(makeCtx({ cycle: 'in_season', mesocycleBlock: undefined })))
      .toBe('Saison')
  })
})

// ── F11: Graceful storage failure ──────────────────────────────────

describe('getBlockProgression — graceful storage failure (F11)', () => {
  it('does not throw when storage.setItem throws on init', () => {
    const throwingStorage: BlockProgressionStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError') },
    }

    expect(() => getBlockProgression(USER_A, TODAY, makeCtx(), throwingStorage)).not.toThrow()
    const state = getBlockProgression(USER_A, TODAY, makeCtx(), throwingStorage)
    expect(state.currentBlockIndex).toBe(0)
  })

  it('does not throw when storage.setItem throws on advancement', () => {
    // Pre-seed with state that should advance
    const data: Record<string, string> = {}
    let throwOnWrite = false
    const storage: BlockProgressionStorage = {
      getItem: (k) => data[k] ?? null,
      setItem: (k, v) => {
        if (throwOnWrite) throw new Error('QuotaExceededError')
        data[k] = v
      },
    }

    // Init normally
    getBlockProgression(USER_A, '2026-03-01', makeCtx(), storage)
    // Now make writes fail
    throwOnWrite = true

    // Advance trigger (>7 days)
    expect(() => getBlockProgression(USER_A, '2026-03-10', makeCtx(), storage)).not.toThrow()
  })
})

// ── F17: Block identity reset on planning transition ─────────────

describe('getBlockProgression — F17 block identity reset', () => {
  it('off_season → pre_season resets block progress', () => {
    const storage = createMockStorage()
    const offCtx = makeCtx({ cycle: 'off_season', offSeasonPhase: 3 })

    // Establish off-season state with 5 completed sessions
    getBlockProgression(USER_A, TODAY, offCtx, storage)
    for (let i = 0; i < 5; i++) recordSessionCompletion(USER_A, `s${i}`, storage)

    const before = getBlockProgression(USER_A, TODAY, offCtx, storage)
    expect(before.sessionsCompletedInBlock).toBe(5)

    // Transition to pre-season
    const preCtx = makeCtx({ cycle: 'pre_season', preSeasonPhase: 1, offSeasonPhase: undefined })
    const after = getBlockProgression(USER_A, TODAY, preCtx, storage)

    expect(after.sessionsCompletedInBlock).toBe(0)
    expect(after.totalSessionsInBlock).toBe(12)
    expect(after.currentBlockLabel).toBe('Pré-saison · Force')
    expect(after.currentBlockIndex).toBe(before.currentBlockIndex) // reset, not advancement
  })

  it('changing offSeasonPhase resets block progress', () => {
    const storage = createMockStorage()
    const phase1 = makeCtx({ cycle: 'off_season', offSeasonPhase: 1 })

    getBlockProgression(USER_A, TODAY, phase1, storage)
    for (let i = 0; i < 3; i++) recordSessionCompletion(USER_A, `s${i}`, storage)

    const before = getBlockProgression(USER_A, TODAY, phase1, storage)
    expect(before.sessionsCompletedInBlock).toBe(3)

    // Phase change: hypertrophy → force
    const phase3 = makeCtx({ cycle: 'off_season', offSeasonPhase: 3 })
    const after = getBlockProgression(USER_A, TODAY, phase3, storage)

    expect(after.sessionsCompletedInBlock).toBe(0)
    expect(after.currentBlockLabel).toBe('Inter-saison · Force')
  })

  it('changing preSeasonPhase resets block progress', () => {
    const storage = createMockStorage()
    const phase1 = makeCtx({ cycle: 'pre_season', preSeasonPhase: 1, offSeasonPhase: undefined })

    getBlockProgression(USER_A, TODAY, phase1, storage)
    for (let i = 0; i < 4; i++) recordSessionCompletion(USER_A, `s${i}`, storage)

    const before = getBlockProgression(USER_A, TODAY, phase1, storage)
    expect(before.sessionsCompletedInBlock).toBe(4)

    // Phase change: force → puissance
    const phase2 = makeCtx({ cycle: 'pre_season', preSeasonPhase: 2, offSeasonPhase: undefined })
    const after = getBlockProgression(USER_A, TODAY, phase2, storage)

    expect(after.sessionsCompletedInBlock).toBe(0)
    expect(after.currentBlockLabel).toBe('Pré-saison · Puissance')
  })

  it('unchanged identity does NOT reset progress', () => {
    const storage = createMockStorage()
    const ctx = makeCtx({ cycle: 'off_season', offSeasonPhase: 1 })

    getBlockProgression(USER_A, TODAY, ctx, storage)
    for (let i = 0; i < 5; i++) recordSessionCompletion(USER_A, `s${i}`, storage)

    // Same context — no reset
    const state = getBlockProgression(USER_A, TODAY, ctx, storage)
    expect(state.sessionsCompletedInBlock).toBe(5)
    expect(state.currentBlockIndex).toBe(0)
  })

  it('persisted state after reset is coherent', () => {
    const storage = createMockStorage()
    const offCtx = makeCtx({ cycle: 'off_season', offSeasonPhase: 2 })

    getBlockProgression(USER_A, TODAY, offCtx, storage)
    for (let i = 0; i < 6; i++) recordSessionCompletion(USER_A, `s${i}`, storage)

    // Transition
    const preCtx = makeCtx({ cycle: 'pre_season', preSeasonPhase: 1, offSeasonPhase: undefined })
    getBlockProgression(USER_A, TODAY, preCtx, storage)

    // Verify persisted state directly
    const raw = JSON.parse(storage.data[`rugbyprep.blockProgression.v1.${USER_A}`])
    expect(raw.sessionsCompletedInBlock).toBe(0)
    expect(raw.totalSessionsInBlock).toBe(12)
    expect(raw.currentBlockLabel).toBe('Pré-saison · Force')
    expect(raw.blockIdentity).toBe('pre_season::1:::')
    expect(raw.consecutiveIncompleteBlocks).toBe(0)
    expect(raw.lastAdvancedAt).toBe(TODAY)
  })

  it('old persisted state without blockIdentity triggers reset (compat)', () => {
    const storage = createMockStorage()
    const ctx = makeCtx({ cycle: 'off_season', offSeasonPhase: 1 })

    // Simulate old persisted state without blockIdentity
    storage.data[`rugbyprep.blockProgression.v1.${USER_A}`] = JSON.stringify({
      currentBlockIndex: 2,
      sessionsCompletedInBlock: 7,
      totalSessionsInBlock: 12,
      consecutiveIncompleteBlocks: 1,
      currentBlockLabel: 'Inter-saison · Hypertrophie',
      lastAdvancedAt: '2026-04-01',
      // no blockIdentity field
    })

    const state = getBlockProgression(USER_A, TODAY, ctx, storage)

    // Reset triggered because undefined !== computed identity
    expect(state.sessionsCompletedInBlock).toBe(0)
    expect(state.blockIdentity).toBe('off_season:1::::')
    expect(state.currentBlockIndex).toBe(2) // preserved, not incremented
  })

  it('previewBlockProgression also detects identity change', () => {
    const storage = createMockStorage()
    const offCtx = makeCtx({ cycle: 'off_season', offSeasonPhase: 1 })
    getBlockProgression(USER_A, TODAY, offCtx, storage)
    for (let i = 0; i < 5; i++) recordSessionCompletion(USER_A, `s${i}`, storage)

    const preCtx = makeCtx({ cycle: 'pre_season', preSeasonPhase: 1, offSeasonPhase: undefined })
    const preview = previewBlockProgression(USER_A, TODAY, preCtx, storage)

    expect(preview.sessionsCompletedInBlock).toBe(0)
    expect(preview.currentBlockLabel).toBe('Pré-saison · Force')
  })
})

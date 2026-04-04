/**
 * MVP-light block progression for sequential mode.
 *
 * Manages a simple localStorage-backed state that tracks which training block
 * the athlete is in and how many sessions they've completed.
 *
 * Advancement rule (Slice 1): block advances if
 *   - >= 75% of sessions completed, OR
 *   - >= 7 days elapsed since last advancement
 *
 * No adaptive heuristics, no cross-device sync, no Supabase.
 */
import type { AnnualPlanningContext, AnnualCycle, OffSeasonPhase, PreSeasonPhase } from '../../types/annualPlanning'
import type { BlockProgressionState } from '../../types/scheduling'
import { parseLocalDate } from './parseLocalDate'

// ── Constants ───────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'rugbyprep.blockProgression.v1'
const ADVANCE_COMPLETION_THRESHOLD = 0.75
const ADVANCE_ELAPSED_DAYS = 7

// ── Public API ──────────────────────────────────────────────────────

export interface BlockProgressionStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * Compute the current block progression state without persisting it.
 * Safe to use during render when a coherent first pass is needed.
 */
export function previewBlockProgression(
  userId: string,
  today: string,
  planningContext: AnnualPlanningContext,
  storage: BlockProgressionStorage = localStorage,
): BlockProgressionState {
  const key = storageKey(userId)
  const raw = storage.getItem(key)
  return resolveBlockProgressionState(raw, today, planningContext).state
}

/**
 * Read the current block progression state, advancing the block if needed.
 * Reads from storage and persists the normalized state when needed.
 */
export function getBlockProgression(
  userId: string,
  today: string,
  planningContext: AnnualPlanningContext,
  storage: BlockProgressionStorage = localStorage,
): BlockProgressionState {
  const key = storageKey(userId)
  const raw = storage.getItem(key)
  const { state, shouldPersist } = resolveBlockProgressionState(raw, today, planningContext)
  if (shouldPersist) {
    safePersist(storage, key, state)
  }
  return state
}

/**
 * Record that a session was completed. Increments the completion counter.
 */
export function recordSessionCompletion(
  userId: string,
  _sessionId: string,
  storage: BlockProgressionStorage = localStorage,
): void {
  const key = storageKey(userId)
  const raw = storage.getItem(key)
  if (!raw) return

  const state = parseState(raw)
  if (!state) return

  const updated: BlockProgressionState = {
    ...state,
    sessionsCompletedInBlock: state.sessionsCompletedInBlock + 1,
  }
  safePersist(storage, key, updated)
}

// ── Internals ───────────────────────────────────────────────────────

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}.${userId}`
}

function safePersist(storage: BlockProgressionStorage, key: string, state: BlockProgressionState): void {
  try {
    storage.setItem(key, JSON.stringify(state))
  } catch {
    // Quota exceeded or security error — degrade gracefully.
  }
}

function initState(planningContext: AnnualPlanningContext, today: string): BlockProgressionState {
  return {
    currentBlockIndex: 0,
    sessionsCompletedInBlock: 0,
    totalSessionsInBlock: planningContext.weeklyFrequency * 4, // 4-week mesocycle
    consecutiveIncompleteBlocks: 0,
    currentBlockLabel: deriveBlockLabel(planningContext),
    lastAdvancedAt: today,
    blockIdentity: deriveBlockIdentity(planningContext),
  }
}

/**
 * F17: Compact identity string for the current planning block.
 * Changes when the athlete transitions to a materially different block
 * (e.g. off_season phase 1 → phase 3, or off_season → pre_season).
 */
function deriveBlockIdentity(ctx: AnnualPlanningContext): string {
  return `${ctx.cycle}:${ctx.offSeasonPhase ?? ''}:${ctx.preSeasonPhase ?? ''}:${ctx.mesocycleBlock ?? ''}:${ctx.playoffTaperPhase ?? ''}:${ctx.inSeasonSubMode ?? ''}`
}

function resolveBlockProgressionState(
  raw: string | null,
  today: string,
  planningContext: AnnualPlanningContext,
): { state: BlockProgressionState; shouldPersist: boolean } {
  let state = raw ? parseState(raw) : null
  if (!state) {
    return {
      state: initState(planningContext, today),
      shouldPersist: true,
    }
  }

  let shouldPersist = false

  // F17: Detect planning block transition (cycle/phase change) and reset progress.
  // Old persisted states without blockIdentity are treated as mismatched (safe reset).
  const currentIdentity = deriveBlockIdentity(planningContext)
  if (state.blockIdentity !== currentIdentity) {
    state = {
      currentBlockIndex: state.currentBlockIndex,
      sessionsCompletedInBlock: 0,
      totalSessionsInBlock: planningContext.weeklyFrequency * 4,
      consecutiveIncompleteBlocks: 0,
      currentBlockLabel: deriveBlockLabel(planningContext),
      lastAdvancedAt: today,
      blockIdentity: currentIdentity,
    }
    return { state, shouldPersist: true }
  }

  if (checkAdvancement(state, today)) {
    state = advanceBlock(state, today, planningContext)
    shouldPersist = true
  }

  const label = deriveBlockLabel(planningContext)
  if (state.currentBlockLabel !== label) {
    state = { ...state, currentBlockLabel: label }
    shouldPersist = true
  }

  return { state, shouldPersist }
}

function parseState(raw: string): BlockProgressionState | null {
  try {
    const parsed = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.currentBlockIndex === 'number'
    ) {
      return parsed as BlockProgressionState
    }
    return null
  } catch {
    return null
  }
}

function checkAdvancement(state: BlockProgressionState, today: string): boolean {
  // Threshold: >= 75% completed
  if (
    state.totalSessionsInBlock > 0 &&
    state.sessionsCompletedInBlock / state.totalSessionsInBlock >= ADVANCE_COMPLETION_THRESHOLD
  ) {
    return true
  }

  // Elapsed time: >= 7 days since last advancement
  if (state.lastAdvancedAt) {
    const elapsed = daysBetween(state.lastAdvancedAt, today)
    if (elapsed >= ADVANCE_ELAPSED_DAYS) return true
  }

  return false
}

function advanceBlock(
  state: BlockProgressionState,
  today: string,
  planningContext: AnnualPlanningContext,
): BlockProgressionState {
  const wasComplete =
    state.totalSessionsInBlock > 0 &&
    state.sessionsCompletedInBlock / state.totalSessionsInBlock >= ADVANCE_COMPLETION_THRESHOLD

  return {
    currentBlockIndex: state.currentBlockIndex + 1,
    sessionsCompletedInBlock: 0,
    totalSessionsInBlock: planningContext.weeklyFrequency * 4,
    consecutiveIncompleteBlocks: wasComplete
      ? 0
      : state.consecutiveIncompleteBlocks + 1,
    currentBlockLabel: deriveBlockLabel(planningContext),
    lastAdvancedAt: today,
    blockIdentity: deriveBlockIdentity(planningContext),
  }
}

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const a = parseLocalDate(dateA).getTime()
  const b = parseLocalDate(dateB).getTime()
  return Math.floor((b - a) / msPerDay)
}

// ── Block label derivation ──────────────────────────────────────────

const CYCLE_LABELS: Record<AnnualCycle, string> = {
  off_season: 'Inter-saison',
  pre_season: 'Pré-saison',
  in_season: 'Saison',
  playoffs: 'Playoffs',
}

const OFF_SEASON_PHASE_LABELS: Record<OffSeasonPhase, string> = {
  1: 'Hypertrophie',
  2: 'Hypertrophie',
  3: 'Force',
  4: 'Force-Puissance',
}

const PRE_SEASON_PHASE_LABELS: Record<PreSeasonPhase, string> = {
  1: 'Force',
  2: 'Puissance',
  3: 'Puissance-Vitesse',
}

/**
 * Derive a human-readable block label from the planning context.
 * Mechanical mapping — no smart logic.
 */
export function deriveBlockLabel(ctx: AnnualPlanningContext): string {
  const cycleName = CYCLE_LABELS[ctx.cycle] ?? ctx.cycle

  if (ctx.cycle === 'off_season' && ctx.offSeasonPhase) {
    const phaseLabel = OFF_SEASON_PHASE_LABELS[ctx.offSeasonPhase]
    return `${cycleName} · ${phaseLabel}`
  }

  if (ctx.cycle === 'pre_season' && ctx.preSeasonPhase) {
    const phaseLabel = PRE_SEASON_PHASE_LABELS[ctx.preSeasonPhase]
    return `${cycleName} · ${phaseLabel}`
  }

  if (ctx.cycle === 'in_season' && ctx.mesocycleBlock) {
    return `${cycleName} · Bloc ${ctx.mesocycleBlock}`
  }

  if (ctx.cycle === 'playoffs' && ctx.playoffTaperPhase) {
    return `${cycleName} · Taper`
  }

  return cycleName
}

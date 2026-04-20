import type { AnnualCycle } from './annualPlanning'
import type { ResolvedMotherSessionSlot } from '../services/motherSession/resolveMotherSessionsForWeek'
import type { CalendarEvent, DayOfWeek } from './training'

// Re-export the canonical DayOfWeek from training.ts (F13: single source of truth)
export type { DayOfWeek }

// ─── Scheduling Mode ───────────────────────────────────────────────

export type SchedulingMode = 'calendar' | 'sequential'

export interface SchedulingModeResult {
  mode: SchedulingMode
  confidence: 'high' | 'medium' | 'low'
  /** Internal trace key (e.g. 'future_matches_detected') */
  reason: string
  /** Number of future matches in the 42-day window, capped at 100 */
  calendarSignalStrength: number
}

export interface ResolveSchedulingModeParams {
  events: Array<Pick<CalendarEvent, 'date' | 'type'> & { user_hidden?: boolean }>
  today: string
  planningAnchors?: {
    seasonEndedAt?: string
    onboardingCycleHint?: AnnualCycle
  }
  onboardingCycleHint?: AnnualCycle
  /** If the user has configured club training days, calendar mode is preferred. */
  hasClubDays?: boolean
  /** Resolved annual cycle — when off_season, future matches don't force calendar. */
  resolvedCycle?: AnnualCycle
}

// ─── Week Presentation (used by S4/S5) ─────────────────────────────

export interface DatedSession {
  kind: 'dated'
  sessionSlot: ResolvedMotherSessionSlot
  dayOfWeek: DayOfWeek
  dayLabel: string
  matchProximity?: string | null
  /** Skip = correction ; completed = dérivé des logs (UI calendrier). Absent = à faire. */
  completionStatus?: 'skipped' | 'completed'
}

export interface SequentialSession {
  kind: 'sequential'
  sessionSlot: ResolvedMotherSessionSlot
  sequenceIndex: number
  totalInWeek: number
  completionStatus: 'pending' | 'completed' | 'skipped'
}

export type PresentedSession = DatedSession | SequentialSession

/** Rich match event for timeline display. */
export interface PresentedMatchEvent {
  date: string
  type: 'match'
  opponent?: string
  opponent_code?: string
  is_home?: boolean
  kickoff_time?: string
}

export interface WeekPresentation {
  sessions: PresentedSession[]
  matchEvents: PresentedMatchEvent[]
  /** Days the user explicitly marked unavailable (via corrections). */
  unavailableDays: DayOfWeek[]
  /** Days structurally blocked by club schedule (entraînement club). */
  clubDays: DayOfWeek[]
  corrections: WeekCorrection[]
  mode: SchedulingMode
}

export type CorrectionType = 'reschedule' | 'skip' | 'unavailable_day' | 'fatigue' | 'add_match'

export interface WeekCorrection {
  id: string
  type: CorrectionType
  sessionId?: string
  fromDay?: DayOfWeek
  toDay?: DayOfWeek
  appliedAt: string
  reversible: boolean
  /** For add_match: the event ID of the added match (enables undo). */
  addedEventId?: string
  /** For add_match: the date of the added match (enables precise local undo binding). */
  matchDate?: string
}

// ─── Week Snapshot (Slice 2) ───────────────────────────────────────

export interface WeekSnapshot {
  weekId: string
  resolvedAt: string
  eventsFingerprint: string
  /** Hash of all events (not just current week) at resolve time. Used for external change detection across sessions. */
  globalEventsHash: string
  surface: import('../services/program/resolveWeeklyProgramSurface').WeeklyProgramSurfaceResult
  presentation: WeekPresentation
  corrections: WeekCorrection[]
  pendingUpdates: PendingUpdate[]
  confirmationRequired: ConfirmationRequired[]
  blockProgression?: BlockProgressionState
  /** Athlete-facing explanation. May be absent in old persisted snapshots (pre-v1). */
  explanation?: WeekExplanation
  /** Schema version for migration. Absent in pre-versioned snapshots. */
  schemaVersion?: number
  /** Hash of profile fields that affect the programme. Used to invalidate cache on profile change. */
  profileHash?: string
}

export interface PendingUpdate {
  id: string
  source: 'ffr_sync' | 'transition_detection'
  description: string
  affectsCurrentWeek: boolean
  data: unknown
  detectedAt: string
}

export interface ConfirmationRequired {
  id: string
  type: 'match_changed' | 'season_ended' | 'playoffs_suggested'
  message: string
  cta: string
  data: unknown
}

// ─── Block Progression (used by S4) ────────────────────────────────

// ─── Scheduling Transitions (Slice 3) ──────────────────────────────

export type SchedulingTransitionType =
  | 'calendar_mode_activated'
  | 'block_mode_activated'
  | 'return_after_break'

export interface SchedulingTransition {
  type: SchedulingTransitionType
  message: string
  cta: string | null
}

// ─── Week Explanation (Slice 3) ────────────────────────────────────

export interface WeekExplanation {
  /** Always visible — 1 line, dominant reason. */
  summaryLine: string
  /** 2-3 lines in disclosure ("Pourquoi ce plan ?"). */
  detailLines: string[]
  /** Human descriptions of applied corrections. */
  corrections: string[]
}

// ─── Block Progression (used by S4) ────────────────────────────────

export interface BlockProgressionState {
  currentBlockIndex: number
  sessionsCompletedInBlock: number
  totalSessionsInBlock: number
  consecutiveIncompleteBlocks: number
  currentBlockLabel: string
  lastAdvancedAt?: string
  /** F17: Compact identity of the planning block (cycle + phase). Used to detect real transitions and reset progress. */
  blockIdentity?: string
}

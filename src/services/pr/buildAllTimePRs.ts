import type { BlockLog, ExerciseSetLog } from '../../types/training'
import { isPRTrackableExercise } from './prEligibility'
import { formatLoadRepsLabel } from './prFormat'
import type { PRBoardEntry } from './prBoardTypes'

export type SetDraft = {
  loadKg?: number
  reps?: number
  seconds?: number
  meters?: number
}

export type ExerciseHistoricalBests = {
  bestLoadKg?: number
}

const FOURTEEN_DAYS_MS = 14 * 86_400_000

function isCompletedSet(completed: boolean | undefined): boolean {
  return completed !== false
}

function dateFromSet(log: ExerciseSetLog): string {
  return (log.updatedAt ?? log.createdAt ?? '').slice(0, 10)
}

/**
 * Agrège la meilleure charge historique depuis des séries (drafts ou logs).
 */
export function aggregateMaxLoadBests(drafts: readonly SetDraft[]): ExerciseHistoricalBests {
  const bests: ExerciseHistoricalBests = {}

  for (const set of drafts) {
    if (set.loadKg == null || set.loadKg <= 0) continue
    bests.bestLoadKg =
      bests.bestLoadKg == null ? set.loadKg : Math.max(bests.bestLoadKg, set.loadKg)
  }

  return bests
}

/**
 * Records historiques d'un exercice depuis les set logs (hors séance courante).
 */
export function buildExerciseBestsFromSetLogs(
  setLogs: readonly ExerciseSetLog[],
  exerciseId: string,
  currentSlotSignature: string,
): ExerciseHistoricalBests {
  const drafts: SetDraft[] = []

  for (const set of setLogs) {
    if (set.exerciseId !== exerciseId) continue
    if (set.slotSignature === currentSlotSignature) continue
    if (!isCompletedSet(set.completed)) continue
    drafts.push({ loadKg: set.loadKg, reps: set.reps, meters: set.meters, seconds: set.seconds })
  }

  return aggregateMaxLoadBests(drafts)
}

type LoadCandidate = {
  loadKg: number
  reps?: number
  dateISO: string
}

function pickBestLoadCandidate(
  current: LoadCandidate | undefined,
  next: LoadCandidate,
): LoadCandidate {
  if (!current || next.loadKg > current.loadKg) return next
  if (next.loadKg < current.loadKg) return current
  // Même charge : garder la 1re occurrence (pas de « nouveau record » sur + de reps).
  return current
}

function buildFromLoadCandidates(
  candidates: Map<string, LoadCandidate>,
  nowMs: number,
): PRBoardEntry[] {
  return Array.from(candidates.entries())
    .map(([exerciseId, data]) => ({
      exerciseId,
      metricType: 'load_reps' as const,
      bestValue: data.loadKg,
      bestLabel: formatLoadRepsLabel(data.loadKg, data.reps),
      dateISO: data.dateISO,
      isRecent: data.dateISO
        ? nowMs - new Date(data.dateISO).getTime() < FOURTEEN_DAYS_MS
        : false,
    }))
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
}

/**
 * Records all-time depuis exercise_set_logs — charge max, polyarticulaires uniquement.
 */
export function buildAllTimePRsFromSetLogs(
  logs: readonly ExerciseSetLog[],
  nowMs = Date.now(),
): PRBoardEntry[] {
  const candidates = new Map<string, LoadCandidate>()

  const chronological = [...logs].sort((a, b) => dateFromSet(a).localeCompare(dateFromSet(b)))

  for (const log of chronological) {
    if (!isPRTrackableExercise(log.exerciseId)) continue
    if (!isCompletedSet(log.completed)) continue
    if (log.loadKg == null || log.loadKg <= 0) continue

    const dateISO = dateFromSet(log)
    const next: LoadCandidate = { loadKg: log.loadKg, reps: log.reps, dateISO }
    candidates.set(log.exerciseId, pickBestLoadCandidate(candidates.get(log.exerciseId), next))
  }

  return buildFromLoadCandidates(candidates, nowMs)
}

/**
 * Records all-time depuis block_logs legacy — charge max, polyarticulaires uniquement.
 */
export function buildAllTimePRsFromBlockLogs(
  logs: readonly BlockLog[],
  nowMs = Date.now(),
): PRBoardEntry[] {
  const candidates = new Map<string, LoadCandidate>()

  const chronological = [...logs].reverse()

  for (const log of chronological) {
    const dateISO = log.dateISO.slice(0, 10)
    for (const entry of log.entries) {
      if (!isPRTrackableExercise(entry.exerciseId)) continue
      if (entry.loadKg == null || entry.loadKg <= 0) continue

      const next: LoadCandidate = { loadKg: entry.loadKg, reps: entry.reps, dateISO }
      candidates.set(
        entry.exerciseId,
        pickBestLoadCandidate(candidates.get(entry.exerciseId), next),
      )
    }
  }

  return buildFromLoadCandidates(candidates, nowMs)
}

/**
 * Fusionne legacy + set logs : set logs prioritaires à charge égale ou supérieure.
 */
export function mergePRBoardEntries(
  legacy: readonly PRBoardEntry[],
  fromSetLogs: readonly PRBoardEntry[],
): PRBoardEntry[] {
  const byExerciseId = new Map<string, PRBoardEntry>()

  for (const pr of legacy) byExerciseId.set(pr.exerciseId, pr)

  for (const pr of fromSetLogs) {
    const existing = byExerciseId.get(pr.exerciseId)
    if (!existing || pr.bestValue >= existing.bestValue) {
      byExerciseId.set(pr.exerciseId, pr)
    }
  }

  return Array.from(byExerciseId.values()).sort((a, b) => b.dateISO.localeCompare(a.dateISO))
}

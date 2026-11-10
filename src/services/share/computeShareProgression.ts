/**
 * Calcule `payload.progression` pour la carte de partage.
 * Load (hausse ≥ 5 % vs S−4) prioritaire, sinon streak de semaines complètes.
 * Aucune donnée inventée : historique / streak absents → null.
 */
import type { ShareProgression } from './sessionShareTypes'

const MS_DAY = 86_400_000
const LOAD_LOOKBACK_START_DAYS = 28
const LOAD_LOOKBACK_END_DAYS = 21
const MIN_LOAD_PERCENT = 5

export interface ShareProgressionLoadInput {
  exerciseId: string
  exerciseName: string
  maxKg: number
}

export interface ShareProgressionHistoryEntry {
  exerciseId: string
  loadKg?: number | null
  /** YYYY-MM-DD si connu (legacy block_logs). */
  dateISO?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ComputeShareProgressionInput {
  todayISO: string
  currentLoads: readonly ShareProgressionLoadInput[]
  history: readonly ShareProgressionHistoryEntry[]
  /** Streak SoT gamification (semaines complètes d’affilée). */
  weekStreak?: number | null
}

function parseDayUtc(isoDate: string): number | null {
  const t = Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(t) ? null : t
}

function shiftDays(isoDate: string, deltaDays: number): string | null {
  const t = parseDayUtc(isoDate)
  if (t == null) return null
  return new Date(t + deltaDays * MS_DAY).toISOString().slice(0, 10)
}

/** Date calendaire d’un log (priorité dateISO → updatedAt → createdAt). */
export function resolveHistoryEntryDateISO(
  entry: ShareProgressionHistoryEntry,
): string | null {
  const raw = entry.dateISO ?? entry.updatedAt ?? entry.createdAt
  if (!raw) return null
  const day = raw.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null
}

function roundPercent(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Meilleure hausse de charge vs fenêtre S−4 ([J−28, J−21]).
 * Retourne null si aucun exo comparable ou hausse &lt; 5 %.
 */
export function resolveShareLoadProgression(input: {
  todayISO: string
  currentLoads: readonly ShareProgressionLoadInput[]
  history: readonly ShareProgressionHistoryEntry[]
}): Extract<ShareProgression, { kind: 'load' }> | null {
  const windowStart = shiftDays(input.todayISO, -LOAD_LOOKBACK_START_DAYS)
  const windowEnd = shiftDays(input.todayISO, -LOAD_LOOKBACK_END_DAYS)
  if (!windowStart || !windowEnd) return null

  let best: Extract<ShareProgression, { kind: 'load' }> | null = null

  for (const current of input.currentLoads) {
    if (!(current.maxKg > 0) || !current.exerciseId) continue

    let baseline = 0
    for (const row of input.history) {
      if (row.exerciseId !== current.exerciseId) continue
      const kg = row.loadKg
      if (kg == null || !(kg > 0)) continue
      const day = resolveHistoryEntryDateISO(row)
      if (!day || day < windowStart || day > windowEnd) continue
      if (kg > baseline) baseline = kg
    }
    if (!(baseline > 0)) continue

    const percent = roundPercent(((current.maxKg - baseline) / baseline) * 100)
    if (percent < MIN_LOAD_PERCENT) continue
    if (!best || percent > best.percent) {
      best = {
        kind: 'load',
        percent,
        weeks: 4,
        exerciseName: current.exerciseName?.trim() || null,
      }
    }
  }

  return best
}

/** Streak ≥ 1 → payload ; 0 / absent → null (seuil héros/chip géré ailleurs). */
export function resolveShareStreakProgression(
  weekStreak: number | null | undefined,
): Extract<ShareProgression, { kind: 'streak' }> | null {
  if (weekStreak == null) return null
  const weeks = Math.max(0, Math.trunc(weekStreak))
  if (weeks < 1) return null
  return { kind: 'streak', weeks }
}

/**
 * Progression carte : load ≥ 5 % sinon streak, sinon null.
 */
export function computeShareProgression(
  input: ComputeShareProgressionInput,
): ShareProgression | null {
  const load = resolveShareLoadProgression({
    todayISO: input.todayISO,
    currentLoads: input.currentLoads,
    history: input.history,
  })
  if (load) return load
  return resolveShareStreakProgression(input.weekStreak)
}

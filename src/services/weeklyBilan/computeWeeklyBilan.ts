/**
 * Bilan hebdomadaire — agrège les données des 7 derniers jours calendaires
 * (lundi → dimanche contenant `today`) pour alimenter la card Premium
 * "Bilan de la semaine" sur /progress.
 *
 * Source des données :
 *  - `SessionLog[]` (rpe, durationMin, fatigue) → adhérence + RPE moyen + charge
 *  - `BlockLog[]` (entries avec loadKg/reps/setsCompleted) → tonnage + progressions
 *
 * Comparaison : on calcule aussi la semaine précédente pour produire les deltas.
 */
import type { BlockLog, SessionLog } from '../../types/training'

export interface WeeklyBilan {
  /** ISO du lundi de la semaine courante. */
  weekStart: string
  /** ISO du dimanche de la semaine courante. */
  weekEnd: string

  /** Nombre de séances loggées cette semaine. */
  sessionsDone: number
  /** Δ vs semaine précédente (positif = plus). */
  sessionsDelta: number

  /** Tonnage total (kg × reps × setsCompleted) — null si aucune donnée de charge. */
  tonnageKg: number | null
  /** Δ% tonnage vs semaine précédente, null si pas comparable. */
  tonnageDeltaPct: number | null

  /** RPE moyen pondéré par durée (ou brut si durée absente) — null si aucun RPE. */
  avgRpe: number | null
  /** Δ RPE vs semaine précédente, null si pas comparable. */
  avgRpeDelta: number | null

  /** Top 3 exercices ayant le plus progressé vs leur dernier log antérieur à cette semaine. */
  topProgressions: WeeklyBilanProgression[]
}

export interface WeeklyBilanProgression {
  exerciseId: string
  /** Charge max cette semaine (kg). */
  currentKg: number
  /** Charge max précédente (kg), toute période antérieure. */
  previousKg: number
  /** Delta absolu (currentKg - previousKg). */
  deltaKg: number
}

// ── Helpers date ────────────────────────────────────────────────────

/** Retourne l'ISO du lundi de la semaine contenant `isoDate`. */
export function startOfIsoWeek(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  const dow = d.getDay() // 0=Dim, 1=Lun, ...
  const daysSinceMonday = dow === 0 ? 6 : dow - 1
  d.setDate(d.getDate() - daysSinceMonday)
  return d.toISOString().slice(0, 10)
}

export function addDaysISO(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ── Core compute ────────────────────────────────────────────────────

export function computeWeeklyBilan(
  sessionLogs: SessionLog[],
  blockLogs: BlockLog[],
  today: string,
): WeeklyBilan {
  const weekStart = startOfIsoWeek(today)
  const weekEnd = addDaysISO(weekStart, 6)
  const prevStart = addDaysISO(weekStart, -7)
  const prevEnd = addDaysISO(weekStart, -1)

  const inRange = (iso: string, from: string, to: string) => {
    const d = iso.slice(0, 10)
    return d >= from && d <= to
  }

  // ── Séances & RPE depuis SessionLog ────────────────────────────
  const currentSessions = sessionLogs.filter((l) => inRange(l.dateISO, weekStart, weekEnd))
  const prevSessions = sessionLogs.filter((l) => inRange(l.dateISO, prevStart, prevEnd))

  const sessionsDone = currentSessions.length
  const sessionsDelta = sessionsDone - prevSessions.length

  const avgRpe = weightedMeanRpe(currentSessions)
  const prevAvgRpe = weightedMeanRpe(prevSessions)
  const avgRpeDelta = avgRpe != null && prevAvgRpe != null
    ? round1(avgRpe - prevAvgRpe)
    : null

  // ── Tonnage depuis BlockLog ─────────────────────────────────────
  const currentTonnage = sumTonnage(blockLogs.filter((l) => inRange(l.dateISO, weekStart, weekEnd)))
  const prevTonnage = sumTonnage(blockLogs.filter((l) => inRange(l.dateISO, prevStart, prevEnd)))

  const tonnageKg = currentTonnage > 0 ? Math.round(currentTonnage) : null
  const tonnageDeltaPct =
    tonnageKg != null && prevTonnage > 0
      ? Math.round(((currentTonnage - prevTonnage) / prevTonnage) * 100)
      : null

  // ── Top progressions ────────────────────────────────────────────
  const topProgressions = computeTopProgressions(blockLogs, weekStart, weekEnd)

  return {
    weekStart,
    weekEnd,
    sessionsDone,
    sessionsDelta,
    tonnageKg,
    tonnageDeltaPct,
    avgRpe,
    avgRpeDelta,
    topProgressions,
  }
}

// ── Helpers internes ────────────────────────────────────────────────

function weightedMeanRpe(sessions: SessionLog[]): number | null {
  const withRpe = sessions.filter((s) => typeof s.rpe === 'number')
  if (withRpe.length === 0) return null
  let sumWeighted = 0
  let sumWeights = 0
  for (const s of withRpe) {
    const w = s.durationMin && s.durationMin > 0 ? s.durationMin : 1
    sumWeighted += (s.rpe as number) * w
    sumWeights += w
  }
  return round1(sumWeighted / sumWeights)
}

function sumTonnage(logs: BlockLog[]): number {
  let total = 0
  for (const log of logs) {
    for (const entry of log.entries) {
      if (entry.loadKg == null || entry.reps == null) continue
      const sets = entry.setsCompleted ?? 1
      total += entry.loadKg * entry.reps * sets
    }
  }
  return total
}

function computeTopProgressions(
  blockLogs: BlockLog[],
  weekStart: string,
  weekEnd: string,
): WeeklyBilanProgression[] {
  // Max charge cette semaine, par exercice
  const currentMax = new Map<string, number>()
  for (const log of blockLogs) {
    if (log.dateISO.slice(0, 10) < weekStart || log.dateISO.slice(0, 10) > weekEnd) continue
    for (const entry of log.entries) {
      if (entry.loadKg == null) continue
      const prev = currentMax.get(entry.exerciseId) ?? 0
      if (entry.loadKg > prev) currentMax.set(entry.exerciseId, entry.loadKg)
    }
  }

  // Max charge antérieure à la semaine (tout l'historique précédent)
  const previousMax = new Map<string, number>()
  for (const log of blockLogs) {
    if (log.dateISO.slice(0, 10) >= weekStart) continue
    for (const entry of log.entries) {
      if (entry.loadKg == null) continue
      const prev = previousMax.get(entry.exerciseId) ?? 0
      if (entry.loadKg > prev) previousMax.set(entry.exerciseId, entry.loadKg)
    }
  }

  const progressions: WeeklyBilanProgression[] = []
  for (const [exerciseId, currentKg] of currentMax.entries()) {
    const previousKg = previousMax.get(exerciseId)
    if (previousKg == null || previousKg <= 0) continue // pas comparable
    const deltaKg = currentKg - previousKg
    if (deltaKg <= 0) continue // seulement les progressions
    progressions.push({ exerciseId, currentKg, previousKg, deltaKg })
  }

  return progressions
    .sort((a, b) => b.deltaKg - a.deltaKg)
    .slice(0, 3)
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

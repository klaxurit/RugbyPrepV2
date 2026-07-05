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

  /** Tonnage total (kg × reps × setsCompleted) — null si aucune donnée de charge.
   *  Source : SessionLog.tonnageKg (mother-session) + BlockLog entries (legacy).
   */
  tonnageKg: number | null
  /** Δ% tonnage vs semaine précédente, null si pas comparable. */
  tonnageDeltaPct: number | null

  /** Durée totale d'entraînement (minutes cumulées) — null si aucune donnée. */
  totalMinutes: number | null
  /** Δ minutes vs semaine précédente, null si pas comparable. */
  totalMinutesDelta: number | null

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

/** Retourne l'ISO local YYYY-MM-DD (évite le glissement UTC de toISOString). */
export function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Retourne l'ISO du lundi de la semaine contenant `isoDate`. */
export function startOfIsoWeek(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  const dow = d.getDay() // 0=Dim, 1=Lun, ...
  const daysSinceMonday = dow === 0 ? 6 : dow - 1
  d.setDate(d.getDate() - daysSinceMonday)
  return toLocalIsoDate(d)
}

export function addDaysISO(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + n)
  return toLocalIsoDate(d)
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

  // ── Durée totale (minutes) ─────────────────────────────────────
  const currentMinutes = sumDuration(currentSessions)
  const prevMinutes = sumDuration(prevSessions)
  const totalMinutes = currentMinutes > 0 ? currentMinutes : null
  const totalMinutesDelta = totalMinutes != null && prevMinutes > 0
    ? currentMinutes - prevMinutes
    : null

  // ── Tonnage : additionne SessionLog.tonnageKg (mother-session) + BlockLog (legacy).
  const currentTonnage =
    sumSessionTonnage(currentSessions) +
    sumBlockTonnage(blockLogs.filter((l) => inRange(l.dateISO, weekStart, weekEnd)))
  const prevTonnage =
    sumSessionTonnage(prevSessions) +
    sumBlockTonnage(blockLogs.filter((l) => inRange(l.dateISO, prevStart, prevEnd)))

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
    totalMinutes,
    totalMinutesDelta,
    topProgressions,
  }
}

// ── Helpers internes ────────────────────────────────────────────────

function sumDuration(sessions: SessionLog[]): number {
  let total = 0
  for (const s of sessions) {
    if (typeof s.durationMin === 'number' && s.durationMin > 0) total += s.durationMin
  }
  return total
}

function sumSessionTonnage(sessions: SessionLog[]): number {
  let total = 0
  for (const s of sessions) {
    if (typeof s.tonnageKg === 'number' && s.tonnageKg > 0) total += s.tonnageKg
  }
  return total
}

function sumBlockTonnage(logs: BlockLog[]): number {
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


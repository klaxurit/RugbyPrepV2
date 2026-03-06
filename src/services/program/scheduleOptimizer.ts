// src/services/program/scheduleOptimizer.ts

import type { ClubSchedule, DayOfWeek, SCSchedule, SCSessionSlot } from '../../types/training'

export const TRAINING_DAYS_DEFAULT: Record<2 | 3, DayOfWeek[]> = {
  2: [2, 4], // Mar + Jeu : jambes mardi (loin du match), upper jeudi
  3: [1, 3, 5],
}

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

// ─── Day info for UI display ──────────────────────────────────

/**
 * Risk levels — only match proximity matters.
 * Club training days are informational only (not a risk).
 *
 * 'match'      — jour de match lui-même (fortement déconseillé)
 * 'near_match' — veille de match (garder les jambes fraîches)
 * 'recovery'   — lendemain de match (récupération)
 * 'club'       — jour d'entraînement club (info seulement, combinable en muscu)
 * 'ok'         — aucune contrainte particulière
 */
export type DayRisk = 'match' | 'near_match' | 'recovery' | 'club' | 'ok'

export interface DayInfo {
  risk: DayRisk
  reason: string | null
}

export function getDayInfo(day: DayOfWeek, clubSchedule: ClubSchedule): DayInfo {
  const clubDayNums = clubSchedule.clubDays.map((d) => d.day)
  const matchDay = clubSchedule.matchDay

  if (matchDay !== undefined && day === matchDay) {
    return { risk: 'match', reason: 'Jour de match' }
  }

  if (matchDay !== undefined) {
    const daysUntilMatch = ((matchDay - day + 7) % 7)
    if (daysUntilMatch === 1) {
      return { risk: 'near_match', reason: 'Veille de match — garder les jambes légères' }
    }
    const dayAfterMatch = ((matchDay + 1) % 7) as DayOfWeek
    if (day === dayAfterMatch) {
      return { risk: 'recovery', reason: 'Lendemain de match — favoriser la récupération' }
    }
  }

  if (clubDayNums.includes(day)) {
    return { risk: 'club', reason: 'Entraînement club' }
  }

  return { risk: 'ok', reason: null }
}

// ─── Schedule computation ─────────────────────────────────────

/**
 * Scoring per day (higher = better):
 *  - Match day              → -15 (exclu de la suggestion auto)
 *  - Veille de match        → -10
 *  - Lendemain de match     → -6
 *  - Avant-veille de match  → -3
 *  - Lendemain de club      → +4  (récupération active)
 *  - Jour de club           → -1  (préférer un jour sans club en auto)
 *
 * Les jours de club ne sont pas bloqués — l'utilisateur peut les sélectionner
 * manuellement (notamment le vendredi "mise en place" en régional).
 *
 * Hard constraint: sessions séparées d'au moins 2 jours (auto seulement).
 */
export function computeSCSchedule(
  clubSchedule: ClubSchedule,
  weeklySessions: 2 | 3,
  upcomingMatchDates?: string[],
): SCSchedule {
  const clubDayNums = clubSchedule.clubDays.map((d) => d.day)
  const matchDay = clubSchedule.matchDay

  const scores: Record<number, number> = {}
  for (const day of ALL_DAYS) {
    let score = 0

    // Match day → exclu de la suggestion auto
    if (matchDay !== undefined && day === matchDay) score -= 15

    // Proximité match
    if (matchDay !== undefined && day !== matchDay) {
      const daysUntilMatch = ((matchDay - day + 7) % 7)
      if (daysUntilMatch === 1) score -= 10
      else if (daysUntilMatch === 2) score -= 3

      const dayAfterMatch = ((matchDay + 1) % 7) as DayOfWeek
      if (day === dayAfterMatch) score -= 6
    }

    // Léger bonus lendemain de club (récup active)
    for (const cd of clubDayNums) {
      const after = ((cd + 1) % 7) as DayOfWeek
      if (day === after) { score += 4; break }
    }

    // Léger malus jour de club (préférer un jour sans club en auto)
    if (clubDayNums.includes(day)) score -= 1

    // Matchs spécifiques à venir
    if (upcomingMatchDates) {
      for (const dateStr of upcomingMatchDates) {
        const matchDow = new Date(dateStr + 'T12:00:00').getDay() as DayOfWeek
        const daysUntil = ((matchDow - day + 7) % 7)
        if (daysUntil === 0) { score -= 15; break }
        if (daysUntil === 1) { score -= 10; break }
        if (daysUntil === 2) { score -= 3; break }
      }
    }

    scores[day] = score
  }

  const rankedDays = ALL_DAYS.slice().sort((a, b) => scores[b] - scores[a])
  const selectedDays = pickWithMinGap(rankedDays, weeklySessions, 2)

  if (selectedDays.length < weeklySessions) {
    const defaults = TRAINING_DAYS_DEFAULT[weeklySessions]
    const sessions: SCSessionSlot[] = defaults.map((day, i) => ({
      sessionIndex: i as 0 | 1 | 2,
      day,
    }))
    return { sessions, suggestedAt: new Date().toISOString() }
  }

  selectedDays.sort((a, b) => a - b)
  const sessions: SCSessionSlot[] = selectedDays.map((day, i) => ({
    sessionIndex: i as 0 | 1 | 2,
    day,
  }))
  return { sessions, suggestedAt: new Date().toISOString() }
}

export function buildManualSCSchedule(days: DayOfWeek[]): SCSchedule {
  const sorted = [...days].sort((a, b) => a - b)
  const sessions: SCSessionSlot[] = sorted.map((day, i) => ({
    sessionIndex: i as 0 | 1 | 2,
    day,
  }))
  return { sessions, suggestedAt: new Date().toISOString() }
}

function pickWithMinGap(ranked: DayOfWeek[], count: number, minGap: number): DayOfWeek[] {
  const selected: DayOfWeek[] = []
  for (const day of ranked) {
    if (selected.length >= count) break
    const tooClose = selected.some((s) => {
      const diff = Math.abs(day - s)
      return Math.min(diff, 7 - diff) < minGap
    })
    if (!tooClose) selected.push(day)
  }
  return selected
}

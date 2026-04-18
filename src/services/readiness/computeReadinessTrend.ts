/**
 * Calcule une courbe du score de forme sur les 7 derniers jours —
 * utilisée pour la card Premium "Score de forme" sur /home, qui reprend
 * exactement le chart affiché en teaser flouté aux utilisateurs free.
 *
 * Pour chaque jour j dans [-6 .. 0] (aujourd'hui inclus) :
 *  - `lastSessionDateISO` = dernière séance strictly ≤ j (ignore active recovery)
 *  - `acwrZone` et `fatigue` pris à l'instant présent (approximation —
 *    on ne re-calcule pas l'ACWR historique pour chaque jour)
 *  - `nextMatchDateISO` inchangé
 *  - Score computé via `computeReadinessScore`
 *
 * Renvoie 7 valeurs sur l'échelle 0-10 (pour matcher l'axe du teaser).
 */
import type { SessionLog } from '../../types/training'
import type { ACWRZone } from '../../hooks/useACWR'
import { computeReadinessScore } from './computeReadinessScore'

export interface ReadinessTrendInput {
  logs: SessionLog[]
  acwrZone: ACWRZone | null
  fatigue: 'OK' | 'FATIGUE'
  nextMatchDateISO: string | null
  todayISO: string
}

export function computeReadinessTrend(input: ReadinessTrendInput): number[] {
  const { logs, acwrZone, fatigue, nextMatchDateISO, todayISO } = input
  const trainingLogs = logs.filter((l) => l.sessionType !== 'ACTIVE_RECOVERY')

  const values: number[] = []
  for (let offset = 6; offset >= 0; offset--) {
    const dayISO = addDaysISO(todayISO, -offset)
    const lastSessionDateISO = findLastSessionOnOrBefore(trainingLogs, dayISO)
    const result = computeReadinessScore({
      acwrZone,
      fatigue,
      lastSessionDateISO,
      nextMatchDateISO,
      todayISO: dayISO,
    })
    // 0-100 → 0-10 (match teaser Y-axis)
    values.push(Math.round((result.score / 10) * 10) / 10)
  }
  return values
}

function addDaysISO(iso: string, delta: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

function findLastSessionOnOrBefore(logs: SessionLog[], dayISO: string): string | null {
  // logs sont normalement triés newest-first (voir useHistory) mais on ne suppose pas.
  let latest: string | null = null
  for (const log of logs) {
    const d = log.dateISO.slice(0, 10)
    if (d > dayISO) continue
    if (latest === null || d > latest) latest = d
  }
  return latest
}

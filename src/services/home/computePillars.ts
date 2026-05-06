import type { ACWRZone } from '../../hooks/useACWR'
import type { CalendarEvent, SessionLog } from '../../types/training'

export type PillarStatus = 'good' | 'ok' | 'warn'

export interface Pillar {
  id: 'load' | 'sleep' | 'recov' | 'rpe'
  label: string
  /** Score 0-100. `null` quand `locked === true`. */
  value: number | null
  status?: PillarStatus
  /** Pillar non débloqué (Sommeil = pas de tracking). */
  locked?: boolean
}

interface ComputeInputs {
  acwr: number | null
  acwrZone: ACWRZone | null
  logs: readonly SessionLog[]
  matchEvents: readonly CalendarEvent[]
  todayISO: string
}

/**
 * Calcule les 4 piliers du Score de forme Premium.
 *
 * - **Charge** : depuis l'ACWR (1.0 = sweet spot, score 100 ; éloignement = pénalité)
 * - **Sommeil** : verrouillé V1 (pas de tracking sleep dans l'app)
 * - **Récup** : heuristique depuis le délai depuis la dernière séance + récence match
 * - **RPE** : depuis le RPE moyen des 3 dernières séances (10 = max effort, score inversé)
 */
export function computePillars(inputs: ComputeInputs): Pillar[] {
  return [
    computeLoadPillar(inputs.acwr, inputs.acwrZone),
    { id: 'sleep', label: 'Sommeil', value: null, locked: true },
    computeRecoveryPillar(inputs.logs, inputs.matchEvents, inputs.todayISO),
    computeRpePillar(inputs.logs),
  ]
}

// ─── Charge ──────────────────────────────────────────────────────────────────

/**
 * ACWR mappé sur 0-100 :
 *  - 1.0 → 100 (sweet spot)
 *  - 0.8 ou 1.3 → 70 (limites optimal)
 *  - 1.5+ ou < 0.5 → 30 (caution/danger)
 */
function computeLoadPillar(acwr: number | null, zone: ACWRZone | null): Pillar {
  if (acwr == null) {
    return { id: 'load', label: 'Charge', value: 50, status: 'ok' }
  }
  // Distance au sweet spot 1.0, normalisée.
  const distance = Math.abs(acwr - 1.0)
  // 0 distance = 100, distance 0.7 = 0
  const value = Math.max(0, Math.min(100, Math.round(100 - distance * 142)))
  const status: PillarStatus =
    zone === 'optimal' ? 'good' : zone === 'underload' ? 'ok' : 'warn'
  return { id: 'load', label: 'Charge', value, status }
}

// ─── Récup ───────────────────────────────────────────────────────────────────

function diffDaysISO(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T12:00:00`).getTime()
  const to = new Date(`${toISO}T12:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}

/**
 * Récup heuristique :
 *  - Lendemain de match (J+1) → 35 (récup en cours)
 *  - 0 jour depuis dernière séance → 50 (encore frais ou en surcharge)
 *  - 1 jour depuis dernière séance → 75 (bonne récup)
 *  - 2-3 jours → 90 (optimal)
 *  - 4+ jours → 70 (sous-utilisation)
 */
function computeRecoveryPillar(
  logs: readonly SessionLog[],
  matches: readonly CalendarEvent[],
  todayISO: string,
): Pillar {
  const lastPastMatch = matches
    .filter((e) => e.type === 'match' && e.date < todayISO)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  if (lastPastMatch && diffDaysISO(lastPastMatch.date, todayISO) === 1) {
    return { id: 'recov', label: 'Récup', value: 35, status: 'warn' }
  }

  const lastLog = [...logs].sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
  if (!lastLog) {
    return { id: 'recov', label: 'Récup', value: 70, status: 'good' }
  }
  const daysSince = diffDaysISO(lastLog.dateISO.slice(0, 10), todayISO)
  if (daysSince <= 0) return { id: 'recov', label: 'Récup', value: 50, status: 'ok' }
  if (daysSince === 1) return { id: 'recov', label: 'Récup', value: 75, status: 'good' }
  if (daysSince <= 3) return { id: 'recov', label: 'Récup', value: 90, status: 'good' }
  return { id: 'recov', label: 'Récup', value: 70, status: 'ok' }
}

// ─── RPE ─────────────────────────────────────────────────────────────────────

/**
 * RPE moyen des 3 dernières séances loguées (échelle 1-10).
 * Mappé en "fraîcheur" : RPE bas = bon score (effort modéré), RPE haut = warn.
 *  - RPE 1-3 → 90+ (très frais)
 *  - RPE 4-5 → 70-80 (effort modéré, optimal)
 *  - RPE 6-7 → 50-60 (effort soutenu)
 *  - RPE 8-10 → < 40 (effort intense répété → fatigue)
 */
function computeRpePillar(logs: readonly SessionLog[]): Pillar {
  const recentRpe = logs
    .filter((l): l is SessionLog & { rpe: number } => typeof l.rpe === 'number')
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .slice(0, 3)
    .map((l) => l.rpe)
  if (recentRpe.length === 0) {
    return { id: 'rpe', label: 'RPE', value: 65, status: 'ok' }
  }
  const avg = recentRpe.reduce((sum, x) => sum + x, 0) / recentRpe.length
  // RPE 1 → 100, RPE 10 → 10. Inversion linéaire avec floor 10.
  const value = Math.max(10, Math.min(100, Math.round(110 - avg * 10)))
  const status: PillarStatus = avg <= 5 ? 'good' : avg <= 7 ? 'ok' : 'warn'
  return { id: 'rpe', label: 'RPE', value, status }
}

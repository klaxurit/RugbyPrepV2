/**
 * Monitoring ACWR (Acute:Chronic Workload Ratio)
 *
 * Formule : ACWR = charge aiguë (7 derniers jours) / charge chronique (moy. 4 semaines)
 * Charge séance = RPE (1-10) × Durée (min) = Unités Arbitraires (UA)
 *
 * Zones (Hulin et al. 2016 — rugby league, 53 joueurs) :
 *   < 0.8  → sous-charge (déconditionnement)
 *   0.8–1.3 → zone optimale (risque le plus faible)
 *   1.3–1.5 → vigilance
 *   > 1.5   → danger (×2.12 risque blessure)
 *   > 2.0   → critique
 *
 * Source : Hulin B.T. et al. (2016). BJSM, 50(4), 231-236.
 */
import { useMemo } from 'react'
import type { CalendarEvent, SessionLog } from '../types/training'
import { RULE_CONSTANTS_V1 } from '../services/program/policies/ruleConstants.v1'

export type ACWRZone = 'underload' | 'optimal' | 'caution' | 'danger' | 'critical'

export interface ACWRResult {
  acwr: number | null      // null si pas assez de données
  acuteLoad: number        // charge des 7 derniers jours (UA)
  chronicLoad: number      // charge chronique moyenne (UA/sem)
  zone: ACWRZone | null    // null si pas assez de données
  hasSufficientData: boolean
  weeksOfData: number      // nombre de semaines avec des données
}

const addDays = (d: Date, days: number): Date => {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

const startOfDay = (d: Date): Date => {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

/**
 * Calcule la charge totale (UA) pour les séances comprises dans [from, to).
 * Seules les séances avec RPE ET durationMin sont comptées.
 */
function loadInWindow(logs: SessionLog[], from: Date, to: Date): number {
  return logs.reduce((sum, log) => {
    if (log.rpe == null || log.durationMin == null) return sum
    const d = new Date(log.dateISO)
    if (d >= from && d < to) {
      return sum + log.rpe * log.durationMin
    }
    return sum
  }, 0)
}

/**
 * Compte le nombre de semaines (sur les 5 dernières) qui ont au moins
 * une séance avec des données de charge.
 */
function weeksWithData(logs: SessionLog[], today: Date): number {
  let count = 0
  for (let i = 0; i < 5; i++) {
    const to = startOfDay(addDays(today, -i * 7))
    const from = startOfDay(addDays(today, -(i + 1) * 7))
    const hasData = logs.some((log) => {
      if (log.rpe == null || log.durationMin == null) return false
      const d = new Date(log.dateISO)
      return d >= from && d < to
    })
    if (hasData) count++
  }
  return count
}

export function classifyACWR(acwr: number): ACWRZone {
  const { cautionThreshold, dangerThreshold, criticalThreshold } = RULE_CONSTANTS_V1.acwr
  if (acwr < 0.8) return 'underload'
  if (acwr <= cautionThreshold) return 'optimal'  // ≤1.3 = optimal (sweet spot ceiling)
  if (acwr < dangerThreshold) return 'caution'     // 1.3 < x < 1.5 = caution
  if (acwr < criticalThreshold) return 'danger'    // 1.5 ≤ x < 2.0 = danger (Hulin 2016: ×2.12 risk)
  return 'critical'                                 // ≥2.0 = critical
}

export function useACWR(logs: SessionLog[], matchEvents?: CalendarEvent[]): ACWRResult {
  return useMemo(() => {
    const today = startOfDay(new Date())

    // Convertir les matchs avec charge renseignée en SessionLog-like
    const matchAsLogs: SessionLog[] = (matchEvents ?? [])
      .filter((e) => e.type === 'match' && e.rpe != null && e.duration_min != null)
      .map((e) => ({
        id: `match-${e.id}`,
        dateISO: e.date + 'T12:00:00',
        week: 'W1' as SessionLog['week'], // valeur neutre — non utilisée pour le calcul ACWR
        sessionType: 'FULL' as SessionLog['sessionType'],
        fatigue: 'OK' as SessionLog['fatigue'],
        rpe: e.rpe,
        durationMin: e.duration_min,
      }))

    const allLogs = [...logs, ...matchAsLogs]

    // Charge aiguë = 7 derniers jours
    const acuteFrom = startOfDay(addDays(today, -7))
    const acuteLoad = loadInWindow(allLogs, acuteFrom, addDays(today, 1))

    // Charge chronique = moyenne sur 4 fenêtres de 7 jours (sem 1 à 4)
    const weekLoads: number[] = []
    for (let i = 0; i < 4; i++) {
      const to = startOfDay(addDays(today, -i * 7))
      const from = startOfDay(addDays(today, -(i + 1) * 7))
      weekLoads.push(loadInWindow(allLogs, from, to))
    }
    const chronicLoad = weekLoads.reduce((s, v) => s + v, 0) / 4

    const weeksData = weeksWithData(allLogs, today)
    const hasSufficientData = weeksData >= 2 // au moins 2 semaines pour estimer

    if (!hasSufficientData || chronicLoad === 0) {
      return {
        acwr: null,
        acuteLoad,
        chronicLoad,
        zone: null,
        hasSufficientData,
        weeksOfData: weeksData,
      }
    }

    const acwr = Math.round((acuteLoad / chronicLoad) * 100) / 100

    return {
      acwr,
      acuteLoad,
      chronicLoad,
      zone: classifyACWR(acwr),
      hasSufficientData: true,
      weeksOfData: weeksData,
    }
  }, [logs, matchEvents])
}

// ─── Config visuelle ──────────────────────────────────────────

export const ACWR_ZONE_CONFIG: Record<ACWRZone, {
  label: string
  color: string
  bg: string
  border: string
  message: string
}> = {
  underload: {
    label: 'Sous-charge',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    message: 'Volume insuffisant — risque de déconditionnement.',
  },
  optimal: {
    label: 'Zone optimale',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    message: 'Charge idéale — continue comme ça.',
  },
  caution: {
    label: 'Vigilance',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    message: 'Charge élevée — surveille la récupération.',
  },
  danger: {
    label: 'Surcharge',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    message: '⚠ Risque blessure ×2.12 — réduis la charge.',
  },
  critical: {
    label: 'Critique',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    message: '🛑 Charge critique — repos impératif.',
  },
}

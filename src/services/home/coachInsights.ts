import type { ACWRZone } from '../../hooks/useACWR'
import type { CalendarEvent, SessionLog } from '../../types/training'

/**
 * Templates d'insights "IA Coach" — règles métier locales (V1).
 * Phrases pensées coach rugby pro : courtes, actionnables, ton serif italic.
 *
 * Ces 6 cas sont mutuellement exclusifs et évalués par ordre de priorité dans
 * `selectCoachInsight` ci-dessous (le premier qui matche gagne).
 */
export type CoachInsightId =
  | 'highLoad'
  | 'tapering'
  | 'postMatch'
  | 'highCadence'
  | 'lowScore'
  | 'baseline'

export interface CoachInsight {
  id: CoachInsightId
  eyebrow: string
  text: string
}

export const COACH_INSIGHTS: Record<CoachInsightId, CoachInsight> = {
  highLoad: {
    id: 'highLoad',
    eyebrow: 'Charge élevée',
    text: "ACWR au-dessus de 1.3. Allège l'intensité aujourd'hui — un bloc en moins, ça vaut mieux qu'une blessure dans deux semaines.",
  },
  tapering: {
    id: 'tapering',
    eyebrow: 'Affûtage',
    text: 'Match dans 2 jours. Volume bas, intensité courte et nerveuse — tu dois sortir frais, pas vidé.',
  },
  postMatch: {
    id: 'postMatch',
    eyebrow: 'Lendemain de match',
    text: "Mobilité, marche active, hydratation. La vraie séance d'aujourd'hui, c'est ta récup.",
  },
  highCadence: {
    id: 'highCadence',
    eyebrow: 'Cadence soutenue',
    text: '11 séances sur 14 jours. Ton corps encaisse — garde le cap mais place une vraie journée off cette semaine.',
  },
  lowScore: {
    id: 'lowScore',
    eyebrow: 'Signal repos',
    text: "Score sous 50. Aujourd'hui c'est mobilité, sommeil tôt, et on relance demain. Pas de héros.",
  },
  baseline: {
    id: 'baseline',
    eyebrow: 'Tu es affûté',
    text: 'Charge bien encaissée, RPE stable. Tiens le plan — c\'est exactement ce qu\'on veut voir.',
  },
}

interface SelectInputs {
  score: number
  acwr: number | null
  acwrZone: ACWRZone | null
  todayISO: string
  /** Tous les events match passés et futurs (visible). */
  matchEvents: readonly CalendarEvent[]
  /** Logs des séances loguées (>= 14 derniers jours pour la cadence). */
  logs: readonly SessionLog[]
}

function diffDaysISO(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T12:00:00`).getTime()
  const to = new Date(`${toISO}T12:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}

/**
 * Sélectionne le meilleur insight selon l'état réel de l'utilisateur.
 *
 * Ordre de priorité (premier gagnant) :
 *  1. lowScore       — score < 50 (signal d'alerte qui prime sur le reste)
 *  2. postMatch      — match joué hier (récup obligatoire)
 *  3. tapering       — match dans 1-3 jours (priorité affûtage)
 *  4. highLoad       — ACWR > 1.3 (zone caution/danger/critical)
 *  5. highCadence    — >= 11 séances sur 14 derniers jours
 *  6. baseline       — état neutre, encouragement par défaut
 */
export function selectCoachInsight(inputs: SelectInputs): CoachInsight {
  const { score, acwr, acwrZone, todayISO, matchEvents, logs } = inputs

  if (score < 50) return COACH_INSIGHTS.lowScore

  // Match passé dans les dernières 24h ?
  const lastPastMatch = matchEvents
    .filter((e) => e.type === 'match' && e.date < todayISO)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  if (lastPastMatch && diffDaysISO(lastPastMatch.date, todayISO) === 1) {
    return COACH_INSIGHTS.postMatch
  }

  // Match dans 1-3 jours ?
  const nextFutureMatch = matchEvents
    .filter((e) => e.type === 'match' && e.date > todayISO)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  if (nextFutureMatch) {
    const daysUntil = diffDaysISO(todayISO, nextFutureMatch.date)
    if (daysUntil >= 1 && daysUntil <= 3) return COACH_INSIGHTS.tapering
  }

  // Charge élevée ?
  if (
    (acwr != null && acwr > 1.3) ||
    acwrZone === 'caution' ||
    acwrZone === 'danger' ||
    acwrZone === 'critical'
  ) {
    return COACH_INSIGHTS.highLoad
  }

  // Cadence soutenue ?
  const fourteenDaysAgo = new Date(`${todayISO}T12:00:00`)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const recentSessionCount = logs.filter((l) => {
    const date = new Date(`${l.dateISO.slice(0, 10)}T12:00:00`)
    return date >= fourteenDaysAgo
  }).length
  if (recentSessionCount >= 11) return COACH_INSIGHTS.highCadence

  return COACH_INSIGHTS.baseline
}

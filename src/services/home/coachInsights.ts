import type { ACWRZone } from '../../hooks/useACWR'
import type { Lang } from '../../i18n/appLabels'
import { coachInsightCopy, type CoachInsightId } from '../../i18n/programSurfaces'
import type { CalendarEvent, SessionLog } from '../../types/training'

export type { CoachInsightId }

export interface CoachInsight {
  id: CoachInsightId
  eyebrow: string
  text: string
}

interface SelectInputs {
  score: number
  acwr: number | null
  acwrZone: ACWRZone | null
  todayISO: string
  matchEvents: readonly CalendarEvent[]
  logs: readonly SessionLog[]
  lang?: Lang
}

function diffDaysISO(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T12:00:00`).getTime()
  const to = new Date(`${toISO}T12:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}

function toInsight(id: CoachInsightId, lang: Lang): CoachInsight {
  const copy = coachInsightCopy(id, lang)
  return { id, ...copy }
}

function daysSinceLastTraining(logs: readonly SessionLog[], todayISO: string): number | null {
  const trainingLogs = logs.filter((l) => l.sessionType !== 'ACTIVE_RECOVERY')
  const lastLog = [...trainingLogs].sort((a, b) => b.dateISO.localeCompare(a.dateISO))[0]
  if (!lastLog) return null
  return diffDaysISO(lastLog.dateISO.slice(0, 10), todayISO)
}

export function selectCoachInsight(inputs: SelectInputs): CoachInsight {
  const { score, acwr, acwrZone, todayISO, matchEvents, logs, lang = 'fr' } = inputs

  if (score < 50) return toInsight('lowScore', lang)

  const lastPastMatch = matchEvents
    .filter((e) => e.type === 'match' && e.date < todayISO)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  if (lastPastMatch && diffDaysISO(lastPastMatch.date, todayISO) === 1) {
    return toInsight('postMatch', lang)
  }

  const nextFutureMatch = matchEvents
    .filter((e) => e.type === 'match' && e.date > todayISO)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  if (nextFutureMatch) {
    const daysUntil = diffDaysISO(todayISO, nextFutureMatch.date)
    if (daysUntil >= 1 && daysUntil <= 3) return toInsight('tapering', lang)
  }

  if (
    (acwr != null && acwr > 1.3) ||
    acwrZone === 'caution' ||
    acwrZone === 'danger' ||
    acwrZone === 'critical'
  ) {
    return toInsight('highLoad', lang)
  }

  const fourteenDaysAgo = new Date(`${todayISO}T12:00:00`)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const cutoff = fourteenDaysAgo.toISOString().slice(0, 10)
  const recentLogs = logs.filter((l) => l.dateISO >= cutoff)
  if (recentLogs.length >= 11) return toInsight('highCadence', lang)

  const daysSince = daysSinceLastTraining(logs, todayISO)
  if (daysSince != null && daysSince >= 7) {
    return toInsight('prolongedBreak', lang)
  }

  if (acwrZone === 'underload' || (acwr != null && acwr < 0.8)) {
    return toInsight('underload', lang)
  }

  return toInsight('baseline', lang)
}

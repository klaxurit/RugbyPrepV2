import type { BlockLog, ExerciseLogEntry, SessionLog } from '../../types/training'

export interface WeeklySummaryInput {
  logs: SessionLog[]
  blockLogs: BlockLog[]
  plannedSessionCount: number
  todayISO: string
}

export interface WeeklySummaryResult {
  sessionsDone: number
  sessionsPlanned: number
  completionRatio: number
  totalLoad: number
  totalLoadLastWeek: number
  loadChangePercent: number | null
  avgRPE: number | null
  topProgressedExercise: {
    exerciseId: string
    improvementLabel: string
  } | null
  hasSufficientData: boolean
}

/** Returns [mondayISO, sundayISO] for the week containing dateISO. */
function weekBounds(dateISO: string): [string, string] {
  const d = new Date(`${dateISO.slice(0, 10)}T12:00:00`)
  const dow = d.getDay() // 0=Sun..6=Sat
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMon)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return [fmt(monday), fmt(sunday)]
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function dayOnly(dateISO: string): string {
  return dateISO.slice(0, 10)
}

function isInRange(dateISO: string, start: string, end: string): boolean {
  const d = dayOnly(dateISO)
  return d >= start && d <= end
}

function sumLoad(logs: SessionLog[]): number {
  return logs.reduce((s, l) => {
    if (l.rpe != null && l.durationMin != null) return s + l.rpe * l.durationMin
    return s
  }, 0)
}

function avgRPE(logs: SessionLog[]): number | null {
  const withRPE = logs.filter((l) => l.rpe != null)
  if (withRPE.length === 0) return null
  return Math.round((withRPE.reduce((s, l) => s + l.rpe!, 0) / withRPE.length) * 10) / 10
}

function findTopProgressed(
  thisWeekBlocks: BlockLog[],
  lastWeekBlocks: BlockLog[],
): WeeklySummaryResult['topProgressedExercise'] {
  // Build best entry per exercise for each week
  const bestByWeek = (blocks: BlockLog[]) => {
    const map = new Map<string, ExerciseLogEntry>()
    for (const block of blocks) {
      for (const entry of block.entries) {
        if (entry.loadKg == null) continue
        const existing = map.get(entry.exerciseId)
        if (!existing || (entry.loadKg ?? 0) > (existing.loadKg ?? 0)) {
          map.set(entry.exerciseId, entry)
        }
      }
    }
    return map
  }

  const thisWeek = bestByWeek(thisWeekBlocks)
  const lastWeek = bestByWeek(lastWeekBlocks)

  let bestId: string | null = null
  let bestDelta = 0

  for (const [exerciseId, entry] of thisWeek) {
    const prev = lastWeek.get(exerciseId)
    if (!prev || prev.loadKg == null || entry.loadKg == null) continue
    const delta = entry.loadKg - prev.loadKg
    if (delta > bestDelta) {
      bestDelta = delta
      bestId = exerciseId
    }
  }

  if (!bestId || bestDelta <= 0) return null

  return {
    exerciseId: bestId,
    improvementLabel: `+${bestDelta} kg`,
  }
}

export function computeWeeklySummary(input: WeeklySummaryInput): WeeklySummaryResult {
  const { logs, blockLogs, plannedSessionCount, todayISO } = input

  const [thisMonday, thisSunday] = weekBounds(todayISO)
  const lastMonday = new Date(`${thisMonday}T12:00:00`)
  lastMonday.setDate(lastMonday.getDate() - 7)
  const lastSunday = new Date(`${thisMonday}T12:00:00`)
  lastSunday.setDate(lastSunday.getDate() - 1)
  const lastMondayISO = fmt(lastMonday)
  const lastSundayISO = fmt(lastSunday)

  const thisWeekLogs = logs.filter((l) => isInRange(l.dateISO, thisMonday, thisSunday))
  const lastWeekLogs = logs.filter((l) => isInRange(l.dateISO, lastMondayISO, lastSundayISO))

  const sessionsDone = thisWeekLogs.length
  const totalLoad = sumLoad(thisWeekLogs)
  const totalLoadLastWeek = sumLoad(lastWeekLogs)

  const loadChangePercent =
    totalLoadLastWeek > 0
      ? Math.round(((totalLoad - totalLoadLastWeek) / totalLoadLastWeek) * 100)
      : null

  const thisWeekBlocks = blockLogs.filter((b) => isInRange(b.dateISO, thisMonday, thisSunday))
  const lastWeekBlocks = blockLogs.filter((b) => isInRange(b.dateISO, lastMondayISO, lastSundayISO))

  return {
    sessionsDone,
    sessionsPlanned: plannedSessionCount,
    completionRatio: plannedSessionCount > 0 ? sessionsDone / plannedSessionCount : 0,
    totalLoad,
    totalLoadLastWeek,
    loadChangePercent,
    avgRPE: avgRPE(thisWeekLogs),
    topProgressedExercise: findTopProgressed(thisWeekBlocks, lastWeekBlocks),
    hasSufficientData: sessionsDone > 0,
  }
}

/**
 * Agrégat groupe / club — ordre des athlètes = ordre d’entrée.
 */
import type { SquadWeeklyOverview, SquadWeeklySummary } from '../../types/staffPlanning'
import type { UserProfile, CalendarEvent, SessionLog } from '../../types/training'
import { buildAthleteStaffWeeklyView, type BuildAthleteStaffWeeklyViewParams } from './buildAthleteStaffWeeklyView'

export interface BuildSquadWeeklyOverviewParams {
  today: Date | string
  clubId?: string
  squadId?: string
  athletes: Array<{
    athleteId: string
    profile: UserProfile
    events: CalendarEvent[]
    logs: SessionLog[]
    fatigue: 'OK' | 'FATIGUE'
    acwrZone?: 'underload' | 'optimal' | 'caution' | 'danger' | 'critical' | null
    identity?: BuildAthleteStaffWeeklyViewParams['identity']
    motherSessionResolverOptions?: BuildAthleteStaffWeeklyViewParams['motherSessionResolverOptions']
    planningAnchors?: BuildAthleteStaffWeeklyViewParams['planningAnchors']
  }>
}

function normalizeGeneratedForDate(today: Date | string): string {
  if (typeof today === 'string') {
    const s = today.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    throw new Error(
      `buildSquadWeeklyOverview: today invalide (${JSON.stringify(today)}). Attendu YYYY-MM-DD.`
    )
  }
  if (Number.isNaN(today.getTime())) {
    throw new Error('buildSquadWeeklyOverview: today Date invalide (NaN).')
  }
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptyByCycle(): SquadWeeklySummary['byCycle'] {
  return {
    off_season: 0,
    pre_season: 0,
    in_season: 0,
    playoffs: 0,
  }
}

function summarize(athletes: SquadWeeklyOverview['athletes']): SquadWeeklySummary {
  const byCycle = emptyByCycle()
  let matchWeekCount = 0
  let highFatigueCount = 0
  let veryHighFatigueCount = 0
  let lowAdherenceCount = 0
  let missingSessionDataCount = 0

  for (const a of athletes) {
    const c = a.annualPlanning.cycle
    byCycle[c] += 1
    if (a.annualPlanning.isMatchWeek) matchWeekCount += 1
    if (a.load.fatigueLevel === 'high') highFatigueCount += 1
    if (a.load.fatigueLevel === 'very_high') veryHighFatigueCount += 1
    const ratio = a.adherence.completionVsPlanned7d
    if (ratio !== null && ratio < 0.5) lowAdherenceCount += 1
    if (a.motherSessions.status === 'missing_session') missingSessionDataCount += 1
  }

  return {
    totalAthletes: athletes.length,
    byCycle,
    matchWeekCount,
    highFatigueCount,
    veryHighFatigueCount,
    lowAdherenceCount,
    missingSessionDataCount,
  }
}

/**
 * Construit l’overview club / groupe pour une date donnée.
 */
export function buildSquadWeeklyOverview(
  params: BuildSquadWeeklyOverviewParams
): SquadWeeklyOverview {
  const generatedForDate = normalizeGeneratedForDate(params.today)

  const athletes = params.athletes.map((row) =>
    buildAthleteStaffWeeklyView({
      athleteId: row.athleteId,
      today: generatedForDate,
      profile: row.profile,
      events: row.events,
      logs: row.logs,
      fatigue: row.fatigue,
      acwrZone: row.acwrZone,
      identity: {
        clubId: row.identity?.clubId ?? params.clubId,
        squadId: row.identity?.squadId ?? params.squadId,
        source: row.identity?.source ?? 'staff',
      },
      motherSessionResolverOptions: row.motherSessionResolverOptions,
      planningAnchors: row.planningAnchors,
    })
  )

  return {
    clubId: params.clubId,
    squadId: params.squadId,
    generatedForDate,
    athletes,
    summary: summarize(athletes),
    warnings: [],
  }
}

/**
 * Payload client → edge `ai-coach` (useCase free_chat).
 * Tout ce qui aide le bot à répondre sans re-questionnaire.
 */
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { CalendarEvent, DayOfWeek, SessionLog, UserProfile } from '../../types/training'
import type { Lang } from '../../i18n/appLabels'
import {
  chatPhaseFromPlanning,
  chatWeekLabelFromPlanning,
} from './resolveChatProgramContext'

const DAY_LABELS_FR: Record<DayOfWeek, string> = {
  0: 'dim',
  1: 'lun',
  2: 'mar',
  3: 'mer',
  4: 'jeu',
  5: 'ven',
  6: 'sam',
}

const DAY_LABELS_EN: Record<DayOfWeek, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
}

export interface FreeChatNextMatch {
  date: string
  opponent?: string | null
  daysUntil?: number | null
}

export interface FreeChatContext {
  today: string
  week: string
  phase?: string
  cycle?: string
  weekNumber?: number
  isDeloadWeek?: boolean
  isMatchWeek?: boolean
  inSeasonSubMode?: string
  playoffTaperPhase?: string
  clubContactProxy?: string
  volumeLighteningReasons?: string[]
  fatigueLoadChoiceApplied?: string
  daysUntilNextMatch?: number | null
  daysSinceLastMatch?: number | null
  acwr?: number | null
  acwrZone?: string | null
  acuteLoad?: number
  chronicLoad?: number
  fatigue?: string
  recentLogs?: Array<{
    sessionType: string
    rpe?: number
    durationMin?: number
    dateISO: string
    week: string
  }>
  upcomingWeekEvents?: Array<{
    date: string
    type: string
    opponent?: string | null
  }>
  profile?: {
    displayName?: string
    level?: string
    trainingLevel?: string
    weeklySessions?: number
    position?: string
    rugbyPosition?: string
    injuries?: string[]
    equipment?: string[]
    heightCm?: number
    weightKg?: number
    ageBand?: string
    performanceFocus?: string
    trainingBaseline?: string
    clubName?: string
    leagueLevel?: string
    preferredLanguage?: string
    clubDays?: string[]
    matchDay?: string
    gymDays?: string[]
    returnToTeamTrainingAt?: string
    seasonEndedAt?: string
    offSeasonStartAt?: string
  }
  nextMatch?: FreeChatNextMatch | null
  explanationSummary?: string
}

function dayLabel(day: DayOfWeek, lang: Lang): string {
  return (lang === 'en' ? DAY_LABELS_EN : DAY_LABELS_FR)[day]
}

function daysUntilISO(todayISO: string, matchISO: string): number | null {
  const parse = (s: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
    if (!m) return null
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  const from = parse(todayISO)
  const to = parse(matchISO)
  if (from == null || to == null) return null
  return Math.round((to - from) / 86_400_000)
}

function isoWeekBounds(todayISO: string): { start: string; end: string } {
  const d = new Date(`${todayISO}T12:00:00`)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (x: Date) => x.toISOString().slice(0, 10)
  return { start: fmt(monday), end: fmt(sunday) }
}

export function buildFreeChatContext(params: {
  profile: UserProfile
  planningContext: AnnualPlanningContext
  lang: Lang
  today: string
  fatigue?: string | null
  acwr?: number | null
  acwrZone?: string | null
  acuteLoad?: number
  chronicLoad?: number
  logs: SessionLog[]
  events: CalendarEvent[]
  nextMatch?: { date: string; opponent?: string | null } | null
  explanationSummary?: string | null
}): FreeChatContext {
  const {
    profile,
    planningContext,
    lang,
    today,
    fatigue,
    acwr,
    acwrZone,
    acuteLoad,
    chronicLoad,
    logs,
    events,
    nextMatch,
    explanationSummary,
  } = params

  const week = chatWeekLabelFromPlanning(planningContext, lang)
  const phase = chatPhaseFromPlanning(planningContext) ?? undefined
  const { start, end } = isoWeekBounds(today)

  const upcomingWeekEvents = events
    .filter((e) => e.date >= start && e.date <= end)
    .slice(0, 8)
    .map((e) => ({
      date: e.date,
      type: e.type,
      opponent: e.type === 'match' ? (e.opponent ?? null) : null,
    }))

  const clubDays = (profile.clubSchedule?.clubDays ?? []).map((d) =>
    dayLabel(d.day, lang),
  )
  const matchDay =
    profile.clubSchedule?.matchDay != null
      ? dayLabel(profile.clubSchedule.matchDay, lang)
      : undefined
  const gymDays = (profile.scSchedule?.sessions ?? []).map((s) =>
    dayLabel(s.day, lang),
  )

  return {
    today,
    week,
    phase,
    cycle: planningContext.cycle,
    weekNumber: planningContext.weekNumber,
    isDeloadWeek: planningContext.isDeloadWeek,
    isMatchWeek: planningContext.isMatchWeek,
    inSeasonSubMode: planningContext.inSeasonSubMode,
    playoffTaperPhase: planningContext.playoffTaperPhase,
    clubContactProxy: planningContext.clubContactProxy,
    volumeLighteningReasons: planningContext.volumeLighteningReasons,
    fatigueLoadChoiceApplied: planningContext.fatigueLoadChoiceApplied,
    daysUntilNextMatch: planningContext.daysUntilNextMatch,
    daysSinceLastMatch: planningContext.daysSinceLastMatch,
    acwr: acwr ?? null,
    acwrZone: acwrZone ?? null,
    acuteLoad,
    chronicLoad,
    fatigue: fatigue ?? undefined,
    recentLogs: logs.slice(0, 8).map((l) => ({
      sessionType: l.sessionType,
      rpe: l.rpe,
      durationMin: l.durationMin,
      dateISO: l.dateISO,
      week: l.week,
    })),
    upcomingWeekEvents: upcomingWeekEvents.length > 0 ? upcomingWeekEvents : undefined,
    explanationSummary: explanationSummary ?? undefined,
    profile: {
      displayName: profile.displayName,
      level: profile.level,
      trainingLevel: profile.trainingLevel,
      weeklySessions: profile.weeklySessions,
      position: profile.position ?? profile.rugbyPosition,
      rugbyPosition: profile.rugbyPosition,
      injuries: profile.injuries?.length ? [...profile.injuries] : undefined,
      equipment: profile.equipment?.length ? [...profile.equipment] : undefined,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      ageBand: profile.ageBand,
      performanceFocus: profile.performanceFocus,
      trainingBaseline: profile.trainingBaseline,
      clubName: profile.clubName,
      leagueLevel: profile.leagueLevel,
      preferredLanguage: profile.preferredLanguage,
      clubDays: clubDays.length ? clubDays : undefined,
      matchDay,
      gymDays: gymDays.length ? gymDays : undefined,
      returnToTeamTrainingAt: profile.planningAnchors?.returnToTeamTrainingAt,
      seasonEndedAt: profile.planningAnchors?.seasonEndedAt,
      offSeasonStartAt: profile.planningAnchors?.offSeasonStartAt,
    },
    nextMatch: nextMatch
      ? {
          date: nextMatch.date,
          opponent: nextMatch.opponent ?? null,
          daysUntil: daysUntilISO(today, nextMatch.date),
        }
      : null,
  }
}

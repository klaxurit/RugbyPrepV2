/**
 * Résolution indicative du programme sur un mois calendaire :
 * séances prévues par jour + transitions de phase (Hypertrophie → Transition, etc.).
 * Pure — pas de snapshot / corrections intra-semaine.
 */
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { Lang } from '../../i18n/appLabels'
import {
  cycleLabel,
  offSeasonPhaseLabel,
  preSeasonPhaseLabel,
} from '../../i18n/programSurfaces'
import { detectAnnualPlanningContext } from '../season/detectAnnualPlanningContext'
import { buildAthletePlanningInputs } from '../annualPlanning/buildAthletePlanningInputs'
import { resolveWeeklyProgramSurface } from '../program/resolveWeeklyProgramSurface'
import type { ResolveWeeklyProgramSurfaceParams } from '../program/resolveWeeklyProgramSurface'
import { resolveWeekPresentation } from './resolveWeekPresentation'
import { mergeDatedSessionCompletionForWeek } from './mergeDatedSessionCompletion'
import type { DatedSession } from '../../types/scheduling'
import type { MotherSessionType } from '../../types/motherSession'
import { startOfIsoWeek, addDaysISO } from '../weeklyBilan/computeWeeklyBilan'
import { formatTitleFromMotherSessionId } from '../../components/motherSession/formatMotherSessionTitle'

export type MonthSessionStatus = 'completed' | 'missed' | 'pending' | 'skipped'

export interface MonthPlannedSession {
  dateISO: string
  title: string
  shortLabel: string
  sessionType: MotherSessionType
  status: MonthSessionStatus
  /** @deprecated use status */
  completionStatus?: 'skipped' | 'completed'
}

export interface MonthPhaseMarker {
  /** Lundi ISO où la transition prend effet. */
  effectiveDateISO: string
  kind: 'cycle' | 'off_season_phase' | 'pre_season_phase' | 'deload'
  fromLabel: string
  toLabel: string
  /** Ex. « Hypertrophie → Transition » */
  summary: string
}

export interface MonthProgramGrid {
  sessionsByDate: Map<string, MonthPlannedSession[]>
  phaseMarkers: MonthPhaseMarker[]
  /** Label court de phase par lundi ISO (lundi visible dans le mois). */
  phaseLabelByMonday: Map<string, string>
}

export type ResolveMonthProgramGridParams = ResolveWeeklyProgramSurfaceParams & {
  year: number
  /** 0-indexed (JS Date month). */
  month: number
  lang?: Lang
}

const SESSION_SHORT: Record<MotherSessionType, { fr: string; en: string }> = {
  lower: { fr: 'Bas', en: 'Lo' },
  upper: { fr: 'Haut', en: 'Up' },
  full: { fr: 'Full', en: 'Full' },
  full_light_primer: { fr: 'Primer', en: 'Primer' },
  speed_power: { fr: 'Vitesse', en: 'Spd' },
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function monthBounds(year: number, month: number): { first: string; last: string } {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return {
    first: `${year}-${pad2(month + 1)}-01`,
    last: `${year}-${pad2(month + 1)}-${pad2(daysInMonth)}`,
  }
}

/** Lundis ISO dont au moins un jour tombe dans le mois. */
export function listIsoWeekMondaysInMonth(year: number, month: number): string[] {
  const { first, last } = monthBounds(year, month)
  const mondays = new Set<string>()
  let cursor = first
  while (cursor <= last) {
    mondays.add(startOfIsoWeek(cursor))
    cursor = addDaysISO(cursor, 1)
  }
  return [...mondays].sort()
}

function isoDateFromWeekMonday(weekMonday: string, dayOfWeek: number): string {
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return addDaysISO(weekMonday, offset)
}

function safeDetectContext(
  params: ResolveMonthProgramGridParams,
  today: string,
): AnnualPlanningContext | null {
  try {
    const { inputs } = buildAthletePlanningInputs({
      profile: params.profile,
      events: params.events,
      logs: params.logs,
      today,
      fatigue: params.fatigue,
      acwrZone: params.acwrZone,
      readinessScore: params.readinessScore,
      jumpTrend: params.jumpTrend,
    })
    return detectAnnualPlanningContext(inputs)
  } catch {
    return null
  }
}

function planningWeekRowLabel(ctx: AnnualPlanningContext, lang: Lang): string {
  if (ctx.cycle === 'off_season' && ctx.offSeasonPhase != null && ctx.weekNumber != null) {
    return `${offSeasonPhaseLabel(ctx.offSeasonPhase, lang)} S${ctx.weekNumber}`
  }
  if (ctx.cycle === 'pre_season' && ctx.preSeasonPhase != null && ctx.weekNumber != null) {
    return `${preSeasonPhaseLabel(ctx.preSeasonPhase, lang)} S${ctx.weekNumber}`
  }
  if (ctx.cycle === 'in_season' && ctx.weekNumber != null) {
    const base = ctx.isDeloadWeek
      ? lang === 'fr'
        ? 'Décharge'
        : 'Deload'
      : lang === 'fr'
        ? 'En saison'
        : 'In season'
    return `${base} S${ctx.weekNumber}`
  }
  if (ctx.cycle === 'playoffs') {
    return lang === 'fr' ? 'Phase finale' : 'Playoffs'
  }
  return cycleLabel(ctx.cycle, lang)
}

function phaseMarkerSummary(
  from: AnnualPlanningContext,
  to: AnnualPlanningContext,
  lang: Lang,
): string {
  const fromLabel = planningWeekRowLabel(from, lang)
  const toLabel = planningWeekRowLabel(to, lang)
  return `${fromLabel} → ${toLabel}`
}

function resolveMonthSessionStatus(
  dateISO: string,
  todayISO: string,
  slotStatus: DatedSession['completionStatus'] | undefined,
  hasGymLogOnDate: boolean,
): MonthSessionStatus {
  if (slotStatus === 'skipped') return 'skipped'
  if (slotStatus === 'completed' || hasGymLogOnDate) return 'completed'
  if (dateISO < todayISO) return 'missed'
  return 'pending'
}

function detectPhaseMarkers(
  weekMondays: string[],
  params: ResolveMonthProgramGridParams,
  lang: Lang,
): MonthPhaseMarker[] {
  const markers: MonthPhaseMarker[] = []
  for (let i = 0; i < weekMondays.length - 1; i++) {
    const fromMonday = weekMondays[i]
    const toMonday = weekMondays[i + 1]
    const current = safeDetectContext(params, fromMonday)
    const next = safeDetectContext(params, toMonday)
    if (!current || !next) continue

    const fromLabel = planningWeekRowLabel(current, lang)
    const toLabel = planningWeekRowLabel(next, lang)
    if (fromLabel === toLabel) continue

    const summary = phaseMarkerSummary(current, next, lang)

    if (current.cycle !== next.cycle) {
      markers.push({
        effectiveDateISO: toMonday,
        kind: 'cycle',
        fromLabel,
        toLabel,
        summary,
      })
      continue
    }

    if (
      current.cycle === 'off_season' &&
      current.offSeasonPhase !== next.offSeasonPhase &&
      next.offSeasonPhase != null
    ) {
      markers.push({
        effectiveDateISO: toMonday,
        kind: 'off_season_phase',
        fromLabel,
        toLabel,
        summary,
      })
      continue
    }

    if (
      current.cycle === 'pre_season' &&
      current.preSeasonPhase !== next.preSeasonPhase &&
      next.preSeasonPhase != null
    ) {
      markers.push({
        effectiveDateISO: toMonday,
        kind: 'pre_season_phase',
        fromLabel,
        toLabel,
        summary,
      })
      continue
    }

    if (current.cycle === 'in_season' && !current.isDeloadWeek && next.isDeloadWeek) {
      markers.push({
        effectiveDateISO: toMonday,
        kind: 'deload',
        fromLabel,
        toLabel,
        summary: lang === 'fr' ? `Décharge S${next.weekNumber ?? ''}`.trim() : `Deload W${next.weekNumber ?? ''}`.trim(),
      })
    }
  }
  return markers
}

function shortLabelForSession(
  sessionType: MotherSessionType,
  motherSessionId: string,
  lang: Lang,
): string {
  const mapped = SESSION_SHORT[sessionType]?.[lang]
  if (mapped) return mapped
  const title = formatTitleFromMotherSessionId(motherSessionId, lang)
  return title.split(/[·\-–]/)[0]?.trim().slice(0, 8) ?? title.slice(0, 8)
}

export function resolveMonthProgramGrid(params: ResolveMonthProgramGridParams): MonthProgramGrid {
  const lang = params.lang ?? 'fr'
  const { year, month } = params
  const { first, last } = monthBounds(year, month)
  const weekMondays = listIsoWeekMondaysInMonth(year, month)

  const sessionsByDate = new Map<string, MonthPlannedSession[]>()
  const phaseLabelByMonday = new Map<string, string>()

  const gymLogDates = new Set<string>()
  for (const log of params.logs) {
    if (log.sessionType === 'ACTIVE_RECOVERY' || log.sessionType === 'RECOVERY') continue
    gymLogDates.add(log.dateISO.slice(0, 10))
  }

  for (const weekMonday of weekMondays) {
    const ctx = safeDetectContext(params, weekMonday)
    if (ctx) {
      phaseLabelByMonday.set(weekMonday, planningWeekRowLabel(ctx, lang))
    }

    const surface = resolveWeeklyProgramSurface({ ...params, today: weekMonday })
    const slots = surface.motherSession?.sessions ?? []
    if (slots.length === 0) continue

    const presentation = resolveWeekPresentation({
      motherSessions: slots,
      schedulingMode: surface.schedulingMode,
      events: params.events,
      today: weekMonday,
      clubSchedule: params.profile.clubSchedule,
      scSchedule: params.profile.scSchedule,
      corrections: [],
    })

    const dated = presentation.sessions.filter((s): s is DatedSession => s.kind === 'dated')
    const merged = mergeDatedSessionCompletionForWeek(dated, params.logs, weekMonday)

    for (const session of merged) {
      const dateISO = isoDateFromWeekMonday(weekMonday, session.dayOfWeek)
      if (dateISO < first || dateISO > last) continue

      const meta = session.sessionSlot.session.metadata
      const sessionType = meta.sessionType
      const motherSessionId = meta.id
      const status = resolveMonthSessionStatus(
        dateISO,
        params.today,
        session.completionStatus,
        gymLogDates.has(dateISO),
      )
      const entry: MonthPlannedSession = {
        dateISO,
        title: formatTitleFromMotherSessionId(motherSessionId, lang),
        shortLabel: shortLabelForSession(sessionType, motherSessionId, lang),
        sessionType,
        status,
        ...(status === 'completed' || status === 'skipped'
          ? { completionStatus: status }
          : {}),
      }

      const list = sessionsByDate.get(dateISO) ?? []
      list.push(entry)
      sessionsByDate.set(dateISO, list)
    }
  }

  return {
    sessionsByDate,
    phaseMarkers: detectPhaseMarkers(weekMondays, params, lang),
    phaseLabelByMonday,
  }
}

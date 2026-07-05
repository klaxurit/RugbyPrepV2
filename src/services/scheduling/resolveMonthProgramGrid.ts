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
import type { UserProfile } from '../../types/training'
import { formatTitleFromMotherSessionId } from '../../components/motherSession/formatMotherSessionTitle'

/** Ancres figées depuis la semaine réelle + début implicite si override manuel. */
function buildMonthProjectionBase(
  params: ResolveMonthProgramGridParams,
): { baseParams: ResolveMonthProgramGridParams; currentMonday: string } {
  const anchorCtx = safeDetectContext(params, params.today)
  const anchors = { ...(params.profile.planningAnchors ?? {}) }
  const currentMonday = startOfIsoWeek(params.today)

  if (
    anchorCtx?.cycle === 'off_season' &&
    anchorCtx.weekNumber != null &&
    anchorCtx.weekNumber > 0
  ) {
    // Aligner les semaines futures sur la semaine réelle (ex. S7 → S8, S9…),
    // y compris quand un override manuel diverge du calendrier seasonEndedAt.
    anchors.offSeasonStartAt = addDaysISO(currentMonday, -(anchorCtx.weekNumber - 1) * 7)
    delete anchors.manualOffSeasonWeekOverride
  } else if (anchorCtx?.offSeasonStartAt) {
    anchors.offSeasonStartAt = anchorCtx.offSeasonStartAt
  }

  const baseProfile: UserProfile = {
    ...params.profile,
    planningAnchors: { ...anchors },
  }

  return {
    baseParams: { ...params, profile: baseProfile },
    currentMonday,
  }
}

function paramsForProjectedWeek(
  baseParams: ResolveMonthProgramGridParams,
  weekMonday: string,
): ResolveMonthProgramGridParams {
  const anchors = { ...(baseParams.profile.planningAnchors ?? {}) }
  delete anchors.manualOffSeasonWeekOverride
  delete anchors.manualPreSeasonWeekOverride
  return {
    ...baseParams,
    profile: { ...baseParams.profile, planningAnchors: anchors },
    today: weekMonday,
  }
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

export interface MonthWeekBand {
  mondayISO: string
  sundayISO: string
  /** Ex. « Inter-saison · Hypertrophie · semaine 7 » */
  fullLabel: string
}

export interface MonthProgramGrid {
  sessionsByDate: Map<string, MonthPlannedSession[]>
  phaseMarkers: MonthPhaseMarker[]
  /** @deprecated préférer phaseBandByMonday */
  phaseLabelByMonday: Map<string, string>
  phaseBandByMonday: Map<string, MonthWeekBand>
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

function planningWeekBandLabel(ctx: AnnualPlanningContext, lang: Lang): string {
  if (ctx.cycle === 'off_season' && ctx.offSeasonPhase != null && ctx.weekNumber != null) {
    const phase = offSeasonPhaseLabel(ctx.offSeasonPhase, lang)
    return lang === 'fr'
      ? `Inter-saison · ${phase} · semaine ${ctx.weekNumber}`
      : `Off-season · ${phase} · week ${ctx.weekNumber}`
  }
  if (ctx.cycle === 'pre_season' && ctx.preSeasonPhase != null && ctx.weekNumber != null) {
    const phase = preSeasonPhaseLabel(ctx.preSeasonPhase, lang)
    return lang === 'fr'
      ? `Pré-saison · ${phase} · semaine ${ctx.weekNumber}`
      : `Pre-season · ${phase} · week ${ctx.weekNumber}`
  }
  if (ctx.cycle === 'in_season' && ctx.weekNumber != null) {
    const base = ctx.isDeloadWeek
      ? lang === 'fr'
        ? 'Décharge'
        : 'Deload'
      : lang === 'fr'
        ? 'En saison'
        : 'In season'
    return lang === 'fr'
      ? `${base} · semaine ${ctx.weekNumber}`
      : `${base} · week ${ctx.weekNumber}`
  }
  if (ctx.cycle === 'playoffs') {
    return lang === 'fr' ? 'Phase finale' : 'Playoffs'
  }
  return cycleLabel(ctx.cycle, lang)
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
  baseParams: ResolveMonthProgramGridParams,
  lang: Lang,
): MonthPhaseMarker[] {
  const markers: MonthPhaseMarker[] = []
  for (let i = 0; i < weekMondays.length - 1; i++) {
    const fromMonday = weekMondays[i]
    const toMonday = weekMondays[i + 1]
    const current = safeDetectContext(paramsForProjectedWeek(baseParams, fromMonday), fromMonday)
    const next = safeDetectContext(paramsForProjectedWeek(baseParams, toMonday), toMonday)
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
  const { baseParams } = buildMonthProjectionBase(params)

  const sessionsByDate = new Map<string, MonthPlannedSession[]>()
  const phaseLabelByMonday = new Map<string, string>()
  const phaseBandByMonday = new Map<string, MonthWeekBand>()

  const gymLogDates = new Set<string>()
  for (const log of params.logs) {
    if (log.sessionType === 'ACTIVE_RECOVERY' || log.sessionType === 'RECOVERY') continue
    gymLogDates.add(log.dateISO.slice(0, 10))
  }

  for (const weekMonday of weekMondays) {
    const weekParams = paramsForProjectedWeek(baseParams, weekMonday)
    const ctx = safeDetectContext(weekParams, weekMonday)
    if (ctx) {
      phaseLabelByMonday.set(weekMonday, planningWeekRowLabel(ctx, lang))
      phaseBandByMonday.set(weekMonday, {
        mondayISO: weekMonday,
        sundayISO: addDaysISO(weekMonday, 6),
        fullLabel: planningWeekBandLabel(ctx, lang),
      })
    }

    const surface = resolveWeeklyProgramSurface(weekParams)
    const slots = surface.motherSession?.sessions ?? []
    if (slots.length === 0) continue

    const presentation = resolveWeekPresentation({
      motherSessions: slots,
      schedulingMode: surface.schedulingMode,
      events: weekParams.events,
      today: weekMonday,
      clubSchedule: weekParams.profile.clubSchedule,
      scSchedule: weekParams.profile.scSchedule,
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
    phaseMarkers: detectPhaseMarkers(weekMondays, baseParams, lang),
    phaseLabelByMonday,
    phaseBandByMonday,
  }
}

/**
 * Vue staff hebdomadaire pour un athlète — pur, sans UI ni horloge implicite.
 */
import type { UserProfile, CalendarEvent, SessionLog } from '../../types/training'
import type { AthletePlanningInputs } from '../../types/annualPlanning'
import type {
  AthleteStaffWeeklyView,
  AthleteWeeklyMotherSessionSummary,
  StaffAlert,
} from '../../types/staffPlanning'
import { buildAthletePlanningInputs } from '../annualPlanning/buildAthletePlanningInputs'
import {
  resolveMotherSessionsForWeek,
  type ResolveMotherSessionsForWeekOptions,
} from '../motherSession/resolveMotherSessionsForWeek'

const COMPLETION_RATIO_CAP = 5

export interface BuildAthleteStaffWeeklyViewParams {
  athleteId: string
  today: Date | string
  profile: UserProfile
  events: CalendarEvent[]
  logs: SessionLog[]
  fatigue: 'OK' | 'FATIGUE'
  acwrZone?: 'underload' | 'optimal' | 'caution' | 'danger' | 'critical' | null
  identity?: {
    clubId?: string
    squadId?: string
    source?: 'self' | 'staff' | 'system'
  }
  /**
   * Surcharge dataset (tests / tooling) — par défaut le resolver utilise le jeu généré.
   */
  motherSessionResolverOptions?: ResolveMotherSessionsForWeekOptions
  /**
   * Ancres planning (staff / tests) — fusionnées après l’adaptateur, avant le resolver.
   */
  planningAnchors?: AthletePlanningInputs['planningAnchors']
}

function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function normalizeTodayExplicit(today: Date | string): string {
  if (typeof today === 'string') {
    const s = today.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    throw new Error(
      `buildAthleteStaffWeeklyView: today invalide (${JSON.stringify(today)}). Attendu YYYY-MM-DD.`
    )
  }
  if (Number.isNaN(today.getTime())) {
    throw new Error('buildAthleteStaffWeeklyView: today Date invalide (NaN).')
  }
  return toIsoDateLocal(today)
}

function hasMatchInCalendar(events: CalendarEvent[]): boolean {
  return events.some((e) => e.type === 'match')
}

function isMissingPositionMapping(planningAdapterWarnings: string[]): boolean {
  return planningAdapterWarnings.some(
    (w) =>
      w.includes('Poste rugby non renseigné') ||
      w.includes('non mappé explicitement') ||
      w.includes('groupe back_three utilisé par défaut')
  )
}

function buildMotherSummary(
  resolution: ReturnType<typeof resolveMotherSessionsForWeek>
): AthleteWeeklyMotherSessionSummary {
  const { status, sessions, warnings, companionRecommendations, missingSessionIds, message } =
    resolution

  if (status === 'missing_session') {
    const extra =
      missingSessionIds?.map((id) => `Mother session absente du dataset : ${id}`) ?? []
    if (message) extra.unshift(message)
    return {
      status: 'missing_session',
      sessionIds: [],
      sessionTitles: [],
      companionRecommendations: companionRecommendations ?? [],
      warnings: [...warnings, ...extra],
      sessions: undefined,
    }
  }

  const sessionIds = sessions.map((s) => s.sessionId)
  const sessionTitles = sessions.map((s) => s.session.title ?? s.session.metadata.id)
  const motherSessions = sessions.map((s) => s.session)

  return {
    status,
    sessionIds,
    sessionTitles,
    companionRecommendations: companionRecommendations ?? [],
    warnings: [...warnings],
    sessions: motherSessions,
  }
}

function buildAlerts(params: {
  derivedFatigue: 'normal' | 'high' | 'very_high'
  painFlags: string[]
  resolutionStatus: AthleteWeeklyMotherSessionSummary['status']
  isMatchWeek: boolean
  cycle: AthleteStaffWeeklyView['annualPlanning']['cycle']
  completionVsPlanned7d: number | null
  completed28: number
  calendarSparse: boolean
  missingPositionMapping: boolean
}): StaffAlert[] {
  const out: StaffAlert[] = []

  if (params.missingPositionMapping) {
    out.push({
      code: 'missing_position_mapping',
      severity: 'warning',
      message: 'Poste non fiable : fallback groupe mother sessions (vérifier le profil).',
    })
  }

  if (params.calendarSparse) {
    out.push({
      code: 'calendar_sparse',
      severity: 'info',
      message: 'Aucun match en calendrier : charge compétition sous-estimée.',
    })
  }

  if (params.completed28 === 0) {
    out.push({
      code: 'missing_recent_logs',
      severity: 'warning',
      message: 'Aucune séance enregistrée sur 28 j — adhérence / charge floues.',
    })
  }

  if (params.painFlags.length > 0) {
    out.push({
      code: 'injury_flags_present',
      severity: 'warning',
      message: `Signaux blessure déclarés : ${params.painFlags.join(', ')}.`,
    })
  }

  if (params.derivedFatigue === 'very_high') {
    out.push({
      code: 'very_high_fatigue',
      severity: 'critical',
      message: 'Fatigue métier très élevée (ACWR danger / critique ou équivalent).',
    })
  } else if (params.derivedFatigue === 'high') {
    out.push({
      code: 'high_fatigue',
      severity: 'warning',
      message: 'Fatigue métier élevée ou zone ACWR vigilance.',
    })
  }

  if (params.resolutionStatus === 'missing_session') {
    out.push({
      code: 'missing_session_data',
      severity: 'critical',
      message: 'Mother sessions incomplètes côté dataset — plan hebdo non fiable.',
    })
  }

  if (params.cycle === 'playoffs') {
    out.push({
      code: 'playoffs_taper',
      severity: 'info',
      message: 'Phase playoffs : logique taper (in-season) appliquée.',
    })
  }

  if (params.isMatchWeek) {
    out.push({
      code: 'match_week',
      severity: 'info',
      message: 'Semaine avec match : contexte charge / récup à surveiller.',
    })
  }

  if (params.completionVsPlanned7d !== null && params.completionVsPlanned7d < 0.5) {
    out.push({
      code: 'low_adherence',
      severity: 'warning',
      message: 'Adhérence 7j faible vs séances prévues cette semaine.',
    })
  }

  return out
}

/**
 * Construit la vue staff d’un joueur pour la semaine de `today`.
 */
export function buildAthleteStaffWeeklyView(
  params: BuildAthleteStaffWeeklyViewParams
): AthleteStaffWeeklyView {
  const {
    athleteId,
    today,
    profile,
    events,
    logs,
    fatigue,
    acwrZone,
    identity: identityExtra,
    motherSessionResolverOptions,
    planningAnchors,
  } = params

  const todayIso = normalizeTodayExplicit(today)

  const athleteIdentity = {
    athleteId,
    clubId: identityExtra?.clubId ?? profile.clubCode,
    squadId: identityExtra?.squadId,
    source: identityExtra?.source ?? ('self' as const),
  }

  const built = buildAthletePlanningInputs({
    profile,
    events,
    logs,
    today: todayIso,
    fatigue,
    acwrZone,
    athleteIdentity,
  })

  const inputs: AthletePlanningInputs =
    planningAnchors !== undefined
      ? {
          ...built.inputs,
          planningAnchors: { ...built.inputs.planningAnchors, ...planningAnchors },
        }
      : built.inputs

  const planningAdapterWarnings = built.warnings
  const derived = built.derived

  const resolution = resolveMotherSessionsForWeek(inputs, motherSessionResolverOptions)
  const motherSessions = buildMotherSummary(resolution)

  const snap = inputs.monitoringSnapshot
  const completed7 = snap?.completedSessionsLast7d ?? 0
  const completed28 = snap?.completedSessionsLast28d ?? 0

  const plannedThisWeek =
    motherSessions.status === 'resolved' || motherSessions.status === 'resolved_with_warnings'
      ? motherSessions.sessionIds.length
      : 0

  let completionVsPlanned7d: number | null = null
  if (plannedThisWeek > 0) {
    const raw = completed7 / plannedThisWeek
    completionVsPlanned7d = Math.min(raw, COMPLETION_RATIO_CAP)
  }

  const load = {
    fatigueLevel: derived.fatigueLevel,
    latestRpeLoad: snap?.latestRpeLoad ?? null,
    painFlags: [...(snap?.painFlags ?? [])],
    acwrZone: acwrZone ?? null,
  }

  const adherence = {
    completedSessionsLast7d: completed7,
    completedSessionsLast28d: completed28,
    plannedSessionsThisWeek: plannedThisWeek,
    completionVsPlanned7d,
  }

  const alerts = buildAlerts({
    derivedFatigue: derived.fatigueLevel,
    painFlags: load.painFlags,
    resolutionStatus: motherSessions.status,
    isMatchWeek: resolution.planningContext.isMatchWeek,
    cycle: resolution.planningContext.cycle,
    completionVsPlanned7d,
    completed28,
    calendarSparse: !hasMatchInCalendar(events),
    missingPositionMapping: isMissingPositionMapping(planningAdapterWarnings),
  })

  return {
    identity: athleteIdentity,
    planningInputs: inputs,
    annualPlanning: resolution.planningContext,
    motherSessions,
    adherence,
    load,
    alerts,
  }
}

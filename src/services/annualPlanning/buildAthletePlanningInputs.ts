/**
 * Adaptateur pur : données app → AthletePlanningInputs (resolver annuel / mother sessions).
 * Aucune horloge implicite : `today` doit être fourni (YYYY-MM-DD).
 */
import type { AthleteIdentityContext, AthletePlanningInputs } from '../../types/annualPlanning'
import type { CalendarEvent, Contra, RugbyPositionGroup, SessionLog, UserProfile } from '../../types/training'

/** Aligné sur useACWR (évite d’importer le hook depuis un service). */
export type AcwrZoneInput =
  | 'underload'
  | 'optimal'
  | 'caution'
  | 'danger'
  | 'critical'
  | null
  | undefined

export interface BuildAthletePlanningInputsParams {
  profile: UserProfile
  events: CalendarEvent[]
  logs: SessionLog[]
  today: string
  fatigue: 'OK' | 'FATIGUE'
  acwrZone?: AcwrZoneInput
  athleteIdentity?: AthleteIdentityContext
}

export interface BuildAthletePlanningInputsResult {
  inputs: AthletePlanningInputs
  warnings: string[]
  derived: {
    resolvedPositionGroup: 'front_row' | 'back_three'
    fatigueLevel: 'normal' | 'high' | 'very_high'
  }
}

type PlanningAnchorsResult = AthletePlanningInputs['planningAnchors']

const FRONT_ROW_GROUPS: RugbyPositionGroup[] = ['FRONT_ROW', 'SECOND_ROW', 'BACK_ROW']
const BACK_THREE_GROUPS: RugbyPositionGroup[] = ['HALF_BACKS', 'CENTERS', 'BACK_THREE']

function normalizePositionToken(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined
  return raw.trim().toUpperCase().replace(/\s+/g, '_')
}

function resolvePositionGroup(
  profile: UserProfile,
  warnings: string[]
): 'front_row' | 'back_three' {
  const token =
    normalizePositionToken(profile.rugbyPosition as string | undefined) ??
    normalizePositionToken(profile.position as string | undefined)

  if (!token) {
    warnings.push(
      'Poste rugby non renseigné : groupe back_three utilisé par défaut pour les mother sessions.'
    )
    return 'back_three'
  }

  if (FRONT_ROW_GROUPS.includes(token as RugbyPositionGroup)) {
    return 'front_row'
  }
  if (BACK_THREE_GROUPS.includes(token as RugbyPositionGroup)) {
    return 'back_three'
  }

  warnings.push(
    `Poste « ${token} » non mappé explicitement : groupe back_three utilisé par défaut.`
  )
  return 'back_three'
}

function clampWeeklyFrequency(
  profile: UserProfile,
  warnings: string[]
): 2 | 3 | 4 {
  const raw = profile.weeklySessions as number | undefined
  if (raw === 2 || raw === 3 || raw === 4) {
    return raw
  }
  if (raw === undefined || raw === null || Number.isNaN(Number(raw))) {
    warnings.push(
      'Fréquence hebdomadaire absente ou invalide : 2 séances / semaine utilisées par défaut.'
    )
    return 2
  }
  const n = Math.round(Number(raw))
  if (n < 2) {
    warnings.push('Fréquence inférieure à 2 ramenée à 2 séances / semaine.')
    return 2
  }
  if (n > 4) {
    warnings.push('Fréquence supérieure à 4 ramenée à 4 séances / semaine.')
    return 4
  }
  if (n === 2 || n === 3 || n === 4) return n
  warnings.push('Fréquence incohérente : 2 séances / semaine utilisées par défaut.')
  return 2
}

function resolveFatigueLevel(
  fatigue: 'OK' | 'FATIGUE',
  acwrZone: AcwrZoneInput
): 'normal' | 'high' | 'very_high' {
  if (acwrZone === 'critical' || acwrZone === 'danger') return 'very_high'
  if (fatigue === 'FATIGUE' || acwrZone === 'caution') return 'high'
  return 'normal'
}

function dayDiffToFrom(logDayYmd: string, todayYmd: string): number {
  const a = new Date(`${logDayYmd}T12:00:00`)
  const b = new Date(`${todayYmd}T12:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function logDayOnly(dateISO: string): string {
  const s = dateISO.trim()
  if (s.length >= 10) return s.slice(0, 10)
  try {
    return new Date(s).toISOString().slice(0, 10)
  } catch {
    return s
  }
}

function countCompletedInRollingDays(logs: SessionLog[], todayYmd: string, days: number): number {
  let n = 0
  for (const log of logs) {
    const logDay = logDayOnly(log.dateISO)
    const diff = dayDiffToFrom(logDay, todayYmd)
    if (diff >= 0 && diff < days) n += 1
  }
  return n
}

function latestRpeLoadFromLogs(logs: SessionLog[]): number | undefined {
  const candidates = logs.filter(
    (l) => l.rpe != null && l.durationMin != null && l.durationMin > 0
  )
  if (candidates.length === 0) return undefined
  candidates.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())
  const top = candidates[0]
  if (top.rpe == null || top.durationMin == null) return undefined
  return top.rpe * top.durationMin
}

function painFlagsFromInjuries(injuries: Contra[]): string[] {
  return [...injuries]
}

function buildIdentity(
  profile: UserProfile,
  override?: AthleteIdentityContext
): AthleteIdentityContext | undefined {
  if (override) {
    return {
      ...override,
      source: override.source ?? 'self',
      clubId: override.clubId ?? profile.clubCode,
    }
  }
  if (!profile.clubCode) return undefined
  return {
    clubId: profile.clubCode,
    squadId: undefined,
    source: 'self',
  }
}

function resolvePlanningAnchors(
  profile: UserProfile,
  hasMatchInCalendar: boolean,
  hasFutureMatch: boolean,
): PlanningAnchorsResult {
  const seasonMode = profile.seasonMode
  const pa = profile.planningAnchors

  // Start with profile-level anchors (seasonEndedAt, manualPlayoffs, etc.)
  const base: NonNullable<PlanningAnchorsResult> = {}
  if (pa?.manualPlayoffs) base.manualPlayoffs = true
  if (pa?.returnToTeamTrainingAt) base.returnToTeamTrainingAt = pa.returnToTeamTrainingAt

  // seasonEndedAt: only apply if no future matches exist (stale anchor guard)
  if (pa?.seasonEndedAt && !hasFutureMatch) {
    base.seasonEndedAt = pa.seasonEndedAt
  }
  if (pa?.offSeasonStartAt && !hasFutureMatch) {
    base.offSeasonStartAt = pa.offSeasonStartAt
  }

  if (!seasonMode) {
    return Object.keys(base).length > 0 ? base : undefined
  }

  if (seasonMode === 'off_season') {
    return { ...base, manualCycleOverride: 'off_season' }
  }

  if (hasMatchInCalendar) {
    return { ...base, manualCycleOverride: seasonMode }
  }

  return { ...base, onboardingCycleHint: seasonMode }
}

/**
 * Transforme profil + calendrier + historique en entrées du resolver annuel.
 */
export function buildAthletePlanningInputs(
  params: BuildAthletePlanningInputsParams
): BuildAthletePlanningInputsResult {
  const warnings: string[] = []
  const { profile, events, logs, today, fatigue, acwrZone, athleteIdentity } = params

  const resolvedPositionGroup = resolvePositionGroup(profile, warnings)
  const weeklyFrequency = clampWeeklyFrequency(profile, warnings)
  const fatigueLevel = resolveFatigueLevel(fatigue, acwrZone)

  const completedSessionsLast7d = countCompletedInRollingDays(logs, today, 7)
  const completedSessionsLast28d = countCompletedInRollingDays(logs, today, 28)
  const latestRpeLoad = latestRpeLoadFromLogs(logs)
  const painFlags = painFlagsFromInjuries(profile.injuries ?? [])

  const monitoringSnapshot: AthletePlanningInputs['monitoringSnapshot'] = {
    completedSessionsLast7d,
    completedSessionsLast28d,
    painFlags: painFlags.length > 0 ? painFlags : undefined,
    latestRpeLoad,
  }

  const identity = buildIdentity(profile, athleteIdentity)

  const hasMatchInCalendar = events.some((e) => e.type === 'match')
  const hasFutureMatch = events.some((e) => e.type === 'match' && e.date >= today)
  const planningAnchors = resolvePlanningAnchors(profile, hasMatchInCalendar, hasFutureMatch)

  const inputs: AthletePlanningInputs = {
    events: events.map((e) => ({ date: e.date, type: e.type })),
    today,
    weeklyFrequency,
    positionGroup: resolvedPositionGroup,
    fatigueLevel,
    identity,
    monitoringSnapshot,
    planningAnchors,
  }

  return {
    inputs,
    warnings,
    derived: {
      resolvedPositionGroup,
      fatigueLevel,
    },
  }
}

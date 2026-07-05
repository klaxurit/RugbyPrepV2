/**
 * Adaptateur pur : données app → AthletePlanningInputs (resolver annuel / mother sessions).
 * Aucune horloge implicite : `today` doit être fourni (YYYY-MM-DD).
 */
import type { AthleteIdentityContext, AthletePlanningInputs } from '../../types/annualPlanning'
import type {
  CalendarEvent,
  Contra,
  FatigueLevel,
  FatigueStatus,
  RugbyPositionGroup,
  SessionLog,
  UserProfile,
} from '../../types/training'
import type { ACWRZone } from '../../hooks/useACWR'
import { isRestartRampUpActive } from '../program/restartRampUp'
import { resolveFatigueLevel } from '../program/resolveFatigueLevel'
import { shouldAutoManualPlayoffsFromCalendar } from '../calendar/inferMatchKindFromFfrJournee'

// (`AcwrZoneInput` retiré — on utilise directement `ACWRZone | null | undefined`
//  depuis le hook canonical `useACWR`.)
export type AcwrZoneInput = ACWRZone | null | undefined

export interface BuildAthletePlanningInputsParams {
  profile: UserProfile
  events: CalendarEvent[]
  logs: SessionLog[]
  today: string
  fatigue: FatigueStatus
  acwrZone?: AcwrZoneInput
  athleteIdentity?: AthleteIdentityContext
  readinessScore?: number
  jumpTrend?: 'up' | 'flat' | 'down'
}

export interface BuildAthletePlanningInputsResult {
  inputs: AthletePlanningInputs
  warnings: string[]
  derived: {
    resolvedPositionGroup: 'front_row' | 'back_three'
    fatigueLevel: FatigueLevel
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

// (Logique extraite vers `src/services/program/resolveFatigueLevel.ts` —
//  source unique de vérité partagée. Tests unitaires dédiés.)

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

function applyProfileManualAnchors(
  pa: UserProfile['planningAnchors'],
  base: NonNullable<PlanningAnchorsResult>,
  seasonMode: UserProfile['seasonMode'],
): void {
  if (!pa) return
  if (pa.manualCycleOverride) base.manualCycleOverride = pa.manualCycleOverride
  if (pa.manualOffSeasonWeekOverride != null && Number.isFinite(pa.manualOffSeasonWeekOverride)) {
    base.manualOffSeasonWeekOverride = pa.manualOffSeasonWeekOverride
  }
  if (pa.manualPreSeasonWeekOverride != null && Number.isFinite(pa.manualPreSeasonWeekOverride)) {
    base.manualPreSeasonWeekOverride = pa.manualPreSeasonWeekOverride
  }
  if (pa.firstMatchDateOverride) base.firstMatchDateOverride = pa.firstMatchDateOverride
  if (pa.seasonEndedSource) base.seasonEndedSource = pa.seasonEndedSource
  if (
    base.manualOffSeasonWeekOverride != null &&
    !base.manualCycleOverride &&
    seasonMode === 'off_season'
  ) {
    base.manualCycleOverride = 'off_season'
  }
}

function resolvePlanningAnchors(
  profile: UserProfile,
  hasMatchInCalendar: boolean,
  hasFutureMatch: boolean,
  hasMatchThisWeek: boolean,
): PlanningAnchorsResult {
  const seasonMode = profile.seasonMode
  const pa = profile.planningAnchors

  // Start with profile-level anchors (seasonEndedAt, manualPlayoffs, etc.)
  const base: NonNullable<PlanningAnchorsResult> = {}
  applyProfileManualAnchors(pa, base, seasonMode)
  if (pa?.manualPlayoffs) base.manualPlayoffs = true
  if (pa?.returnToTeamTrainingAt) base.returnToTeamTrainingAt = pa.returnToTeamTrainingAt

  // seasonEndedAt / offSeasonStartAt : une fois déclarés, le calendrier (match FFR
  // cette semaine, match futur stale) ne doit jamais les effacer — sinon reset brutal
  // inter-saison → saison + perte de phase (Hypertrophie → Transition).
  const userDeclaredSeasonEnd = Boolean(pa?.seasonEndedAt)
  const matchInvalidatesSeasonEnd = userDeclaredSeasonEnd
    ? false
    : hasFutureMatch || hasMatchThisWeek
  if (pa?.seasonEndedAt && !matchInvalidatesSeasonEnd) {
    base.seasonEndedAt = pa.seasonEndedAt
  }
  if (pa?.offSeasonStartAt && !matchInvalidatesSeasonEnd) {
    base.offSeasonStartAt = pa.offSeasonStartAt
  }

  // Preferred source for bootstrap hint: planningAnchors.onboardingCycleHint
  // Fallback: seasonMode (compatibility with pre-Slice 4 profiles)
  const cycleHint = pa?.onboardingCycleHint ?? seasonMode

  if (!cycleHint) {
    return Object.keys(base).length > 0 ? base : undefined
  }

  // V2: Only force manualCycleOverride for explicit off_season confirmation
  // (seasonEndedAt anchor present). Without that anchor, off_season from
  // onboardingCycleHint goes through the normal hint path, not manual override.
  // Ne pas écraser un override admin/staff déjà posé sur le profil.
  if (base.seasonEndedAt && cycleHint === 'off_season' && !base.manualCycleOverride) {
    return { ...base, manualCycleOverride: 'off_season' }
  }

  // With matches in calendar, let V2 auto-detect from calendar data — except when
  // the athlete declared off-season at onboarding without an explicit season end:
  // keep onboardingCycleHint + offSeasonStartAt so week 1 is anchored, not S4
  // inferred from stale FFR calendar matches.
  const keepOffSeasonBootstrap =
    cycleHint === 'off_season' &&
    !base.seasonEndedAt &&
    (Boolean(base.offSeasonStartAt) || pa?.onboardingCycleHint === 'off_season')

  if (hasMatchInCalendar && !keepOffSeasonBootstrap) {
    return Object.keys(base).length > 0 ? base : undefined
  }

  return { ...base, onboardingCycleHint: cycleHint }
}

/**
 * Transforme profil + calendrier + historique en entrées du resolver annuel.
 */
export function buildAthletePlanningInputs(
  params: BuildAthletePlanningInputsParams
): BuildAthletePlanningInputsResult {
  const warnings: string[] = []
  const { profile, events, logs, today, fatigue, acwrZone, athleteIdentity, readinessScore, jumpTrend } = params
  const visibleEvents = events.filter((event) => event.user_hidden !== true)

  const resolvedPositionGroup = resolvePositionGroup(profile, warnings)
  const weeklyFrequency = clampWeeklyFrequency(profile, warnings)
  const seasonEnded = !!profile.planningAnchors?.seasonEndedAt
  const baseFatigueLevel = resolveFatigueLevel(fatigue, acwrZone, { seasonEnded })
  // Rampe de reprise (trainingBaseline = 'restart' < 14j) : bump 'normal' → 'high'
  // pour réduire le volume sur les 2 premières semaines (KB population-specific.md §3).
  // Aucune action si fatigue déjà 'high' ou 'very_high' (déjà couvert par ACWR/RPE).
  const rampUpActive = isRestartRampUpActive(profile, new Date(`${today}T12:00:00`))
  const fatigueLevel: typeof baseFatigueLevel =
    rampUpActive && baseFatigueLevel === 'normal' ? 'high' : baseFatigueLevel
  if (rampUpActive && baseFatigueLevel === 'normal') {
    warnings.push('Mode reprise actif : volume W1-W2 réduit (-40 à 50%).')
  }

  const completedSessionsLast7d = countCompletedInRollingDays(logs, today, 7)
  const completedSessionsLast28d = countCompletedInRollingDays(logs, today, 28)
  const latestRpeLoad = latestRpeLoadFromLogs(logs)
  const painFlags = painFlagsFromInjuries(profile.injuries ?? [])

  const monitoringSnapshot: AthletePlanningInputs['monitoringSnapshot'] = {
    completedSessionsLast7d,
    completedSessionsLast28d,
    painFlags: painFlags.length > 0 ? painFlags : undefined,
    latestRpeLoad,
    readinessScore,
    jumpTrend,
    hasHistoricalLogs: logs.length > 0,
  }

  const identity = buildIdentity(profile, athleteIdentity)

  const hasMatchInCalendar = visibleEvents.some((e) => e.type === 'match')
  const hasFutureMatch = visibleEvents.some((e) => e.type === 'match' && e.date >= today)

  // Current ISO week boundaries (Mon–Sun) — matches here are visible in the timeline
  const todayD = new Date(`${today}T12:00:00`)
  const mondayOffset = (todayD.getDay() + 6) % 7
  const weekMon = new Date(todayD)
  weekMon.setDate(weekMon.getDate() - mondayOffset)
  const weekSun = new Date(weekMon)
  weekSun.setDate(weekSun.getDate() + 6)
  const weekMonIso = weekMon.toISOString().slice(0, 10)
  const weekSunIso = weekSun.toISOString().slice(0, 10)
  const hasMatchThisWeek = visibleEvents.some(
    (e) => e.type === 'match' && e.date >= weekMonIso && e.date <= weekSunIso,
  )

  let resolvedAnchors = resolvePlanningAnchors(profile, hasMatchInCalendar, hasFutureMatch, hasMatchThisWeek)
  if (shouldAutoManualPlayoffsFromCalendar(profile, visibleEvents, today)) {
    resolvedAnchors = { ...(resolvedAnchors ?? {}), manualPlayoffs: true }
  }
  const skipRecoveryIntro = profile.planningAnchors?.skipOffSeasonRecoveryIntro === true
  const planningAnchors: AthletePlanningInputs['planningAnchors'] =
    resolvedAnchors || skipRecoveryIntro
      ? {
          ...(resolvedAnchors ?? {}),
          ...(skipRecoveryIntro ? { skipOffSeasonRecoveryIntro: true as const } : {}),
        }
      : undefined

  const inputs: AthletePlanningInputs = {
    events: visibleEvents.map((e) => ({
      date: e.date,
      type: e.type,
      ...(e.match_kind ? { match_kind: e.match_kind } : {}),
    })),
    today,
    weeklyFrequency,
    positionGroup: resolvedPositionGroup,
    equipment: profile.equipment,
    fatigueLevel,
    trainingBaseline: profile.trainingBaseline,
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

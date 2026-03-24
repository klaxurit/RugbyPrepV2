import type {
  AnnualCycle,
  AnnualPlanningContext,
  AthletePlanningInputs,
  OffSeasonPhase,
  PreSeasonPhase,
} from '../../types/annualPlanning'
import type { CalendarEvent } from '../../types/training'

type MatchInput = Pick<CalendarEvent, 'date' | 'type'>
type TraceMode = AnnualPlanningContext['planningTrace']['resolutionMode']

const MS_PER_DAY = 24 * 60 * 60 * 1000
const PRE_SEASON_WEEKS = 12
const OFF_SEASON_WEEKS_V1 = 10
const OFF_SEASON_BACKFILL_WEEKS = 10
const DAYS_PER_WEEK = 7

const MODE_RANK: Record<TraceMode, number> = {
  manual_override: 5,
  explicit_anchors: 4,
  calendar_inferred: 3,
  onboarding_hint: 2,
  backfilled: 1,
}

class TraceAcc {
  /** 0 = aucune résolution encore ; le premier `bump` définit le mode. */
  private rank = 0
  private dominant: TraceMode = 'calendar_inferred'
  readonly rulesApplied: string[] = []
  readonly warnings: string[] = []

  bump(mode: TraceMode): void {
    if (MODE_RANK[mode] > this.rank) {
      this.rank = MODE_RANK[mode]
      this.dominant = mode
    }
  }

  rule(id: string): void {
    this.rulesApplied.push(id)
  }

  warn(msg: string): void {
    this.warnings.push(msg)
  }

  freeze(): AnnualPlanningContext['planningTrace'] {
    return {
      resolutionMode: this.rank === 0 ? 'calendar_inferred' : this.dominant,
      rulesApplied: [...this.rulesApplied],
      warnings: [...this.warnings],
    }
  }
}

function parseLocalDateOnly(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return dt
}

function requireIsoDate(label: string, value: string | undefined): Date {
  if (value === undefined || value.trim() === '') {
    throw new Error(`detectAnnualPlanningContext: ${label} requis ou absent.`)
  }
  const d = parseLocalDateOnly(value)
  if (!d) {
    throw new Error(
      `detectAnnualPlanningContext: ${label} invalide (${JSON.stringify(value)}). Attendu YYYY-MM-DD.`
    )
  }
  return d
}

function normalizeToday(today: Date | string): Date {
  if (typeof today === 'string') {
    const p = parseLocalDateOnly(today)
    if (p) return p
    throw new Error(
      `detectAnnualPlanningContext: today invalide (${JSON.stringify(today)}). Attendu YYYY-MM-DD.`
    )
  }
  if (Number.isNaN(today.getTime())) {
    throw new Error('detectAnnualPlanningContext: today Date invalide (NaN).')
  }
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0)
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfIsoWeekMonday(d: Date): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
  const dow = c.getDay()
  const daysFromMonday = (dow + 6) % 7
  c.setDate(c.getDate() - daysFromMonday)
  return c
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d.getTime())
  c.setDate(c.getDate() + n)
  return c
}

function wholeDaysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

function endOfIsoWeekSunday(monday: Date): Date {
  return addDays(monday, 6)
}

function collectMatchDates(events: MatchInput[]): string[] {
  const out: string[] = []
  for (const e of events) {
    if (e.type !== 'match') continue
    if (!parseLocalDateOnly(e.date)) continue
    out.push(e.date)
  }
  out.sort()
  return out
}

function lastMatchDateOverall(dates: string[]): string | null {
  if (dates.length === 0) return null
  return dates[dates.length - 1]
}

function nextMatchOnOrAfter(dates: string[], todayIso: string): string | null {
  for (const d of dates) {
    if (d >= todayIso) return d
  }
  return null
}

function isDateInClosedRange(iso: string, startIso: string, endIso: string): boolean {
  return iso >= startIso && iso <= endIso
}

function preSeasonPhaseFromWeek(weekNumber: number): PreSeasonPhase {
  if (weekNumber <= 4) return 1
  if (weekNumber <= 8) return 2
  return 3
}

function preSeasonWeekLabel(weekNumber: number, phase: PreSeasonPhase): string {
  return `Pre-season Phase ${phase} - S${weekNumber}`
}

function offSeasonPhaseFromWeek(weekNumber: number): OffSeasonPhase {
  if (weekNumber <= 2) return 1
  if (weekNumber <= 4) return 2
  if (weekNumber <= 8) return 3
  return 4
}

function offSeasonPhaseName(phase: OffSeasonPhase): string {
  switch (phase) {
    case 1:
      return 'Recovery'
    case 2:
      return 'Transition'
    case 3:
      return 'Hypertrophy'
    case 4:
      return 'Force-Bridge'
  }
}

function offSeasonWeekLabel(weekNumber: number, phase: OffSeasonPhase): string {
  return `Off-season ${offSeasonPhaseName(phase)} - S${weekNumber}`
}

function baseContextFields(
  inputs: AthletePlanningInputs,
  todayDate: Date,
  todayIso: string,
  matchDates: string[],
  firstMatchDate: string | null,
  trace: AnnualPlanningContext['planningTrace']
): Pick<
  AnnualPlanningContext,
  | 'fatigueLevel'
  | 'weeklyFrequency'
  | 'positionGroup'
  | 'identity'
  | 'monitoringSnapshot'
  | 'firstMatchDate'
  | 'lastMatchDate'
  | 'daysUntilNextMatch'
  | 'isMatchWeek'
  | 'planningTrace'
> {
  const todayWeekMonday = startOfIsoWeekMonday(todayDate)
  const weekStartIso = toIsoDate(todayWeekMonday)
  const weekEndIso = toIsoDate(endOfIsoWeekSunday(todayWeekMonday))
  const isMatchWeek = matchDates.some((d) => isDateInClosedRange(d, weekStartIso, weekEndIso))
  let daysUntilNextMatch: number | null = null
  const next = nextMatchOnOrAfter(matchDates, todayIso)
  if (next) {
    const nextD = parseLocalDateOnly(next)!
    daysUntilNextMatch = wholeDaysBetween(todayDate, nextD)
  }

  return {
    fatigueLevel: inputs.fatigueLevel ?? 'normal',
    weeklyFrequency: inputs.weeklyFrequency,
    positionGroup: inputs.positionGroup,
    identity: inputs.identity,
    monitoringSnapshot: inputs.monitoringSnapshot,
    firstMatchDate,
    lastMatchDate: lastMatchDateOverall(matchDates),
    daysUntilNextMatch,
    isMatchWeek,
    planningTrace: trace,
  }
}

function buildOffSeasonContext(
  weekNumber: number,
  offSeasonStartIso: string,
  base: ReturnType<typeof baseContextFields>
): AnnualPlanningContext {
  const phase = offSeasonPhaseFromWeek(weekNumber)
  return {
    cycle: 'off_season',
    offSeasonPhase: phase,
    weekNumber,
    weekLabel: offSeasonWeekLabel(weekNumber, phase),
    isDeloadWeek: false,
    offSeasonStartAt: offSeasonStartIso,
    ...base,
  }
}

function resolveManualCycle(
  inputs: AthletePlanningInputs,
  todayDate: Date,
  todayIso: string,
  todayWeekMonday: Date,
  matchDates: string[],
  firstMatchDate: string | null,
  cycle: AnnualCycle,
  acc: TraceAcc
): AnnualPlanningContext {
  const anchors = inputs.planningAnchors ?? {}
  const base = (t: AnnualPlanningContext['planningTrace']) =>
    baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, t)

  if (cycle === 'off_season') {
    let wn = anchors.manualOffSeasonWeekOverride ?? 1
    wn = Math.min(OFF_SEASON_WEEKS_V1, Math.max(1, wn))
    let offStartMonday: Date
    if (anchors.offSeasonStartAt) {
      offStartMonday = startOfIsoWeekMonday(parseLocalDateOnly(anchors.offSeasonStartAt)!)
    } else if (firstMatchDate) {
      const firstMatchWeekMonday = startOfIsoWeekMonday(parseLocalDateOnly(firstMatchDate)!)
      const preSeasonStartMonday = addDays(firstMatchWeekMonday, -PRE_SEASON_WEEKS * DAYS_PER_WEEK)
      offStartMonday = addDays(preSeasonStartMonday, -OFF_SEASON_BACKFILL_WEEKS * DAYS_PER_WEEK)
      acc.warn(
        'Cycle off-season manuel : début d’off-season dérivé du premier match (−22 sem.) faute d’ancre explicite.'
      )
    } else {
      offStartMonday = todayWeekMonday
      acc.warn(
        'Cycle off-season manuel sans calendrier : ancrage du début d’off-season sur la semaine ISO courante.'
      )
    }
    return buildOffSeasonContext(wn, toIsoDate(offStartMonday), base(acc.freeze()))
  }

  if (cycle === 'pre_season') {
    if (!firstMatchDate) {
      throw new Error(
        'detectAnnualPlanningContext: cycle pre_season manuel sans firstMatchDate (calendrier ou override).'
      )
    }
    const firstMatchWeekMonday = startOfIsoWeekMonday(parseLocalDateOnly(firstMatchDate)!)
    const preSeasonStartMonday = addDays(firstMatchWeekMonday, -PRE_SEASON_WEEKS * DAYS_PER_WEEK)
    let wn =
      anchors.manualPreSeasonWeekOverride ??
      Math.min(
        PRE_SEASON_WEEKS,
        Math.max(
          1,
          Math.floor(wholeDaysBetween(preSeasonStartMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
        )
      )
    wn = Math.min(PRE_SEASON_WEEKS, Math.max(1, wn))
    const phase = preSeasonPhaseFromWeek(wn)
    const isDeload = wn === 4 || wn === 8 || wn === 12
    const offSeasonStartIso = toIsoDate(
      addDays(preSeasonStartMonday, -OFF_SEASON_BACKFILL_WEEKS * DAYS_PER_WEEK)
    )
    return {
      cycle: 'pre_season',
      preSeasonPhase: phase,
      weekNumber: wn,
      weekLabel: preSeasonWeekLabel(wn, phase),
      isDeloadWeek: isDeload,
      offSeasonStartAt: offSeasonStartIso,
      ...base(acc.freeze()),
    }
  }

  if (!firstMatchDate) {
    throw new Error(
      'detectAnnualPlanningContext: cycle in_season manuel sans firstMatchDate (calendrier ou override).'
    )
  }
  const firstMatchWeekMonday = startOfIsoWeekMonday(parseLocalDateOnly(firstMatchDate)!)
  const wIn = Math.max(
    1,
    Math.floor(wholeDaysBetween(firstMatchWeekMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
  )
  const offSeasonStartIso = toIsoDate(
    addDays(
      addDays(firstMatchWeekMonday, -PRE_SEASON_WEEKS * DAYS_PER_WEEK),
      -OFF_SEASON_BACKFILL_WEEKS * DAYS_PER_WEEK
    )
  )
  return {
    cycle: 'in_season',
    weekNumber: wIn,
    weekLabel: `In-season - W${wIn}`,
    isDeloadWeek: false,
    offSeasonStartAt: offSeasonStartIso,
    ...base(acc.freeze()),
  }
}

/**
 * Contexte annuel pur : aucune horloge système, aucune dépendance UI / React.
 */
export function detectAnnualPlanningContext(inputs: AthletePlanningInputs): AnnualPlanningContext {
  const todayDate = normalizeToday(inputs.today)
  const todayIso = toIsoDate(todayDate)
  const todayWeekMonday = startOfIsoWeekMonday(todayDate)

  const acc = new TraceAcc()
  const anchors = inputs.planningAnchors ?? {}

  if (anchors.firstMatchDateOverride !== undefined && anchors.firstMatchDateOverride !== '') {
    requireIsoDate('firstMatchDateOverride', anchors.firstMatchDateOverride)
    acc.rule('anchor:first_match_date_override_validated')
  }
  if (anchors.offSeasonStartAt) {
    requireIsoDate('offSeasonStartAt', anchors.offSeasonStartAt)
    acc.rule('anchor:off_season_start_at_validated')
  }
  if (anchors.seasonEndedAt) {
    requireIsoDate('seasonEndedAt', anchors.seasonEndedAt)
    acc.rule('anchor:season_ended_at_validated')
  }
  if (anchors.returnToTeamTrainingAt) {
    requireIsoDate('returnToTeamTrainingAt', anchors.returnToTeamTrainingAt)
    acc.rule('anchor:return_to_team_training_validated')
  }

  const matchDates = collectMatchDates(inputs.events)
  const firstMatchCalendar = matchDates.length > 0 ? matchDates[0] : null
  const firstMatchDate = anchors.firstMatchDateOverride ?? firstMatchCalendar

  if (anchors.manualPlayoffs === true || anchors.manualCycleOverride === 'playoffs') {
    acc.bump('manual_override')
    acc.rule('rule:manual_playoffs')
    const trace = acc.freeze()
    return {
      cycle: 'playoffs',
      weekNumber: 1,
      weekLabel: 'Playoffs - W1',
      isDeloadWeek: false,
      offSeasonStartAt: null,
      ...baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, trace),
    }
  }

  if (anchors.manualCycleOverride) {
    acc.bump('manual_override')
    acc.rule(`rule:manual_cycle=${anchors.manualCycleOverride}`)
    return resolveManualCycle(
      inputs,
      todayDate,
      todayIso,
      todayWeekMonday,
      matchDates,
      firstMatchDate,
      anchors.manualCycleOverride,
      acc
    )
  }

  // Bootstrap first-run : si aucun match et hint onboarding présent, utiliser le hint.
  // Ce hint est injecté uniquement quand events=0 et logs=0 (voir buildAthletePlanningInputs).
  if (!firstMatchDate && anchors.onboardingCycleHint) {
    acc.bump('onboarding_hint')
    acc.rule('rule:onboarding_cycle_hint')
    const hintCycle = anchors.onboardingCycleHint

    if (hintCycle === 'in_season') {
      const trace = acc.freeze()
      return {
        cycle: 'in_season',
        weekNumber: 1,
        weekLabel: 'En saison - S1',
        isDeloadWeek: false,
        offSeasonStartAt: null,
        ...baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace),
      }
    }

    if (hintCycle === 'pre_season') {
      const trace = acc.freeze()
      return {
        cycle: 'pre_season',
        preSeasonPhase: 1,
        weekNumber: 1,
        weekLabel: preSeasonWeekLabel(1, 1),
        isDeloadWeek: false,
        offSeasonStartAt: null,
        ...baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace),
      }
    }

    if (hintCycle === 'off_season') {
      const trace = acc.freeze()
      return buildOffSeasonContext(
        1,
        toIsoDate(todayWeekMonday),
        baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace)
      )
    }

    // playoffs hint ignoré (pas de sens sans calendrier) → tombe dans le backfill.
  }

  if (!firstMatchDate) {
    acc.bump('backfilled')
    acc.rule('rule:no_first_match_calendar')
    acc.warn(
      'Aucune date de premier match (calendrier ni override) : contexte off-season synthétique sur la semaine courante.'
    )
    const trace = acc.freeze()
    return buildOffSeasonContext(
      1,
      toIsoDate(todayWeekMonday),
      baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace)
    )
  }

  const firstMatchParsed = parseLocalDateOnly(firstMatchDate)!
  const firstMatchWeekMonday = startOfIsoWeekMonday(firstMatchParsed)
  const preSeasonStartMonday = addDays(firstMatchWeekMonday, -PRE_SEASON_WEEKS * DAYS_PER_WEEK)
  const preSeasonStartIso = toIsoDate(preSeasonStartMonday)

  let offSeasonStartMonday: Date
  let offSeasonBackfilled = false

  if (anchors.offSeasonStartAt) {
    offSeasonStartMonday = startOfIsoWeekMonday(parseLocalDateOnly(anchors.offSeasonStartAt)!)
    acc.bump('explicit_anchors')
    acc.rule('rule:off_season_start_at')
  } else if (anchors.seasonEndedAt) {
    const ended = parseLocalDateOnly(anchors.seasonEndedAt)!
    offSeasonStartMonday = addDays(startOfIsoWeekMonday(ended), DAYS_PER_WEEK)
    acc.bump('explicit_anchors')
    acc.rule('rule:season_ended_next_monday')
  } else {
    const pastBeforePre = matchDates.filter((d) => d < preSeasonStartIso)
    const lastPast = pastBeforePre.length > 0 ? pastBeforePre[pastBeforePre.length - 1] : null
    if (lastPast && todayIso < preSeasonStartIso) {
      const lastD = parseLocalDateOnly(lastPast)!
      offSeasonStartMonday = addDays(startOfIsoWeekMonday(lastD), DAYS_PER_WEEK)
      acc.bump('calendar_inferred')
      acc.rule('rule:off_season_after_last_match_before_pre')
    } else if (todayWeekMonday < preSeasonStartMonday) {
      offSeasonStartMonday = addDays(preSeasonStartMonday, -OFF_SEASON_BACKFILL_WEEKS * DAYS_PER_WEEK)
      offSeasonBackfilled = true
      acc.bump('backfilled')
      acc.rule('rule:off_season_backfill_pre_season_minus_10w')
      acc.warn(
        'Début d’off-season reconstruit : 10 semaines avant le début de pré-saison (ancre calendrier insuffisante).'
      )
    } else {
      offSeasonStartMonday = addDays(preSeasonStartMonday, -OFF_SEASON_BACKFILL_WEEKS * DAYS_PER_WEEK)
      offSeasonBackfilled = true
      acc.bump('backfilled')
      acc.rule('rule:off_season_start_reporting_backfill')
    }
  }

  const offSeasonStartIso = toIsoDate(offSeasonStartMonday)

  if (todayWeekMonday < preSeasonStartMonday) {
    let rawOffWeek =
      Math.floor(wholeDaysBetween(offSeasonStartMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
    let clamped = false
    if (anchors.manualOffSeasonWeekOverride !== undefined) {
      acc.bump('manual_override')
      acc.rule('rule:manual_off_season_week')
      rawOffWeek = anchors.manualOffSeasonWeekOverride
    }
    if (rawOffWeek < 1) {
      rawOffWeek = 1
      clamped = true
    }
    if (rawOffWeek > OFF_SEASON_WEEKS_V1) {
      rawOffWeek = OFF_SEASON_WEEKS_V1
      clamped = true
      acc.warn(
        'Semaine off-season hors fenêtre V1 (S1–S10) : valeur ramenée à S10 (Force-Bridge).'
      )
    }
    if (clamped && anchors.manualOffSeasonWeekOverride === undefined) {
      acc.warn('Semaine off-season bornée au modèle annuel V1.')
    }
    if (anchors.offSeasonStartAt || anchors.seasonEndedAt) {
      acc.bump('explicit_anchors')
    } else if (offSeasonBackfilled) {
      acc.bump('backfilled')
    } else {
      acc.bump('calendar_inferred')
    }
    const trace = acc.freeze()
    return buildOffSeasonContext(
      rawOffWeek,
      offSeasonStartIso,
      baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, trace)
    )
  }

  if (todayWeekMonday < firstMatchWeekMonday) {
    const rawWeek =
      Math.floor(wholeDaysBetween(preSeasonStartMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
    let wn = Math.min(PRE_SEASON_WEEKS, Math.max(1, rawWeek))
    if (anchors.manualPreSeasonWeekOverride !== undefined) {
      acc.bump('manual_override')
      acc.rule('rule:manual_pre_season_week')
      wn = Math.min(PRE_SEASON_WEEKS, Math.max(1, anchors.manualPreSeasonWeekOverride))
    } else {
      acc.bump('calendar_inferred')
      acc.rule('rule:pre_season_from_calendar')
    }
    const phase = preSeasonPhaseFromWeek(wn)
    const isDeload = wn === 4 || wn === 8 || wn === 12
    const trace = acc.freeze()
    return {
      cycle: 'pre_season',
      preSeasonPhase: phase,
      weekNumber: wn,
      weekLabel: preSeasonWeekLabel(wn, phase),
      isDeloadWeek: isDeload,
      offSeasonStartAt: offSeasonStartIso,
      ...baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, trace),
    }
  }

  const inSeasonWeekNumber =
    Math.floor(wholeDaysBetween(firstMatchWeekMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
  const wIn = Math.max(1, inSeasonWeekNumber)
  acc.bump('calendar_inferred')
  acc.rule('rule:in_season_from_calendar')
  const trace = acc.freeze()
  return {
    cycle: 'in_season',
    weekNumber: wIn,
    weekLabel: `In-season - W${wIn}`,
    isDeloadWeek: false,
    offSeasonStartAt: offSeasonStartIso,
    ...baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, trace),
  }
}

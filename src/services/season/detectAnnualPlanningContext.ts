import type {
  AnnualCycle,
  AnnualPlanningContext,
  AthletePlanningInputs,
  InSeasonSubMode,
  OffSeasonPhase,
  PlayoffTaperPhase,
  PreSeasonPhase,
} from '../../types/annualPlanning'
import type { CalendarEvent } from '../../types/training'
import { parseLocalDateOnly } from '../dates/localIsoDate'

type MatchInput = Pick<CalendarEvent, 'date' | 'type' | 'match_kind'>
type TraceMode = AnnualPlanningContext['planningTrace']['resolutionMode']

const MS_PER_DAY = 24 * 60 * 60 * 1000
const PRE_SEASON_WEEKS = 12
const OFF_SEASON_WEEKS_V1 = 10
const OFF_SEASON_BACKFILL_WEEKS = 10
const DAYS_PER_WEEK = 7

const MIN_PRE_SEASON_WEEKS = 6
const MAX_PRE_SEASON_WEEKS = 12
const MIN_OFF_SEASON_WEEKS = 6
const MAX_OFF_SEASON_WEEKS = 12

/**
 * Option joueur : ne pas suivre les 2 semaines « Récupération » (S1–S2) — passer au bloc Transition (à partir de S3).
 * Ignoré si une semaine manuelle est imposée.
 */
function bumpOffSeasonWeekSkipRecoveryIntro(
  calendarWeek: number,
  effectiveMaxWeeks: number,
  anchors: NonNullable<AthletePlanningInputs['planningAnchors']>,
): number {
  const capped = Math.min(effectiveMaxWeeks, Math.max(1, calendarWeek))
  if (anchors.manualOffSeasonWeekOverride !== undefined) return capped
  // Sans « skip récup », ne pas borner au max du bloc planifié : au-delà → phase Entretien (5).
  if (!anchors.skipOffSeasonRecoveryIntro) return Math.max(1, calendarWeek)
  const w = capped
  if (w > 2) return w
  return Math.min(effectiveMaxWeeks, w + 2)
}

const MODE_RANK: Record<TraceMode, number> = {
  manual_override: 5,
  explicit_anchors: 4,
  calendar_inferred: 3,
  onboarding_hint: 2,
  backfilled: 1,
}

/** In-season 3:1 mesocycle: 3 weeks loading + 1 week deload. */
function computeInSeasonMesocycle(weekNumber: number) {
  const mesocycleBlock = Math.ceil(weekNumber / 4)
  const mesocycleWeek = (((weekNumber - 1) % 4) + 1) as 1 | 2 | 3 | 4
  return {
    mesocycleWeek,
    mesocycleBlock,
    isDeloadWeek: mesocycleWeek === 4,
  }
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

function resolvePreSeasonStart(
  firstMatchWeekMonday: Date,
  anchors: NonNullable<AthletePlanningInputs['planningAnchors']>,
  acc: TraceAcc
): { preSeasonStartMonday: Date; effectivePreSeasonWeeks: number } {
  if (anchors.returnToTeamTrainingAt) {
    const returnDate = parseLocalDateOnly(anchors.returnToTeamTrainingAt)
    if (returnDate) {
      const returnMonday = startOfIsoWeekMonday(returnDate)
      const availableWeeks = Math.floor(
        wholeDaysBetween(returnMonday, firstMatchWeekMonday) / DAYS_PER_WEEK
      )
      const effective = Math.min(MAX_PRE_SEASON_WEEKS, Math.max(MIN_PRE_SEASON_WEEKS, availableWeeks))
      acc.bump('explicit_anchors')
      acc.rule('rule:pre_season_anchored_return_to_team')
      if (availableWeeks < MIN_PRE_SEASON_WEEKS) {
        acc.warn(`Pré-saison compressée : ${availableWeeks} semaines disponibles, minimum ${MIN_PRE_SEASON_WEEKS} appliqué.`)
      }
      return {
        preSeasonStartMonday: addDays(firstMatchWeekMonday, -effective * DAYS_PER_WEEK),
        effectivePreSeasonWeeks: effective,
      }
    }
  }
  // Fallback V1 (12 semaines)
  return {
    preSeasonStartMonday: addDays(firstMatchWeekMonday, -PRE_SEASON_WEEKS * DAYS_PER_WEEK),
    effectivePreSeasonWeeks: PRE_SEASON_WEEKS,
  }
}

function resolveOffSeasonDuration(
  offSeasonStartMonday: Date,
  preSeasonStartMonday: Date,
  acc: TraceAcc
): number {
  const availableWeeks = Math.floor(
    wholeDaysBetween(offSeasonStartMonday, preSeasonStartMonday) / DAYS_PER_WEEK
  )
  const effective = Math.min(MAX_OFF_SEASON_WEEKS, Math.max(MIN_OFF_SEASON_WEEKS, availableWeeks))
  if (availableWeeks < MIN_OFF_SEASON_WEEKS) {
    acc.warn(`Off-season compressée : ${availableWeeks} semaines disponibles, minimum ${MIN_OFF_SEASON_WEEKS} appliqué.`)
  }
  return effective
}

function taperPhaseLabel(phase: PlayoffTaperPhase): string {
  switch (phase) {
    case 'taper_1': return 'Phase 1 — Maintien'
    case 'taper_2': return 'Phase 2 — Affûtage'
    case 'match_week': return 'Semaine de match'
  }
}

function resolveInSeasonSubMode(
  daysUntilNextMatch: number | null,
  daysSinceLastMatch: number | null,
  acc: TraceAcc
): InSeasonSubMode {
  if (daysUntilNextMatch != null && daysUntilNextMatch > 21) {
    acc.rule('rule:treve_deep_detected')
    return 'treve_deep'
  }
  if (
    daysUntilNextMatch != null && daysUntilNextMatch >= 8 && daysUntilNextMatch <= 14 &&
    daysSinceLastMatch != null && daysSinceLastMatch >= 14
  ) {
    acc.rule('rule:treve_return_detected')
    return 'treve_return'
  }
  if (
    daysUntilNextMatch != null && daysUntilNextMatch <= 7 &&
    daysSinceLastMatch != null && daysSinceLastMatch >= 14
  ) {
    acc.rule('rule:treve_rampup_detected')
    return 'treve_rampup'
  }
  // Queue de saison : aucun match futur ET dernier match il y a >= 14j (la saison
  // s'éteint réellement), mais avant la bascule auto en inter-saison (gérée plus haut
  // au-delà de AUTO_SEASON_END_DAYS=28). Fenêtre de décompression. On exige 14j pour
  // ne PAS basculer un athlète qui n'a simplement pas encore saisi son prochain match.
  if (daysUntilNextMatch == null && daysSinceLastMatch != null && daysSinceLastMatch >= 14) {
    acc.rule('rule:end_of_season_detected')
    return 'end_of_season'
  }
  return 'competition'
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

function hasFutureCupFinalMatch(events: MatchInput[], todayIso: string): boolean {
  return events.some(
    (e) =>
      e.type === 'match' &&
      e.match_kind === 'cup_final' &&
      e.date >= todayIso,
  )
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

function preSeasonPhaseFromWeek(weekNumber: number, totalWeeks: number = PRE_SEASON_WEEKS): PreSeasonPhase {
  const third = totalWeeks / 3
  if (weekNumber <= Math.ceil(third)) return 1
  if (weekNumber <= Math.ceil(third * 2)) return 2
  return 3
}

function preSeasonWeekLabel(weekNumber: number, phase: PreSeasonPhase): string {
  return `Pré-saison Phase ${phase} - S${weekNumber}`
}

function offSeasonPhaseFromWeek(weekNumber: number, totalWeeks: number = OFF_SEASON_WEEKS_V1): OffSeasonPhase {
  if (weekNumber <= 2) return 1  // Recovery : toujours 2 semaines
  if (weekNumber <= 4) return 2  // Transition : toujours 2 semaines
  if (weekNumber <= totalWeeks - 2) return 3  // Hypertrophy : absorbe le delta
  if (weekNumber <= totalWeeks) return 4  // Force-Bridge : 2 dernières semaines
  return 5  // Maintenance — beyond planned off-season
}

function offSeasonPhaseName(phase: OffSeasonPhase): string {
  switch (phase) {
    case 1:
      return 'Récupération'
    case 2:
      return 'Transition'
    case 3:
      return 'Hypertrophie'
    case 4:
      return 'Force-Pont'
    case 5:
      return 'Entretien'
  }
}

function offSeasonWeekLabel(weekNumber: number, phase: OffSeasonPhase): string {
  if (phase === 5) {
    const ab = weekNumber % 2 === 1 ? 'A' : 'B'
    return `Inter-saison Entretien — Semaine ${ab}`
  }
  return `Inter-saison ${offSeasonPhaseName(phase)} - S${weekNumber}`
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
  | 'daysSinceLastMatch'
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

  // Compute days since last match (last match strictly before today)
  let daysSinceLastMatch: number | null = null
  const pastMatches = matchDates.filter((d) => d < todayIso)
  if (pastMatches.length > 0) {
    const lastPast = pastMatches[pastMatches.length - 1]
    const lastPastD = parseLocalDateOnly(lastPast)!
    daysSinceLastMatch = wholeDaysBetween(lastPastD, todayDate)
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
    daysSinceLastMatch,
    isMatchWeek,
    planningTrace: trace,
  }
}

function buildOffSeasonContext(
  weekNumber: number,
  offSeasonStartIso: string,
  base: ReturnType<typeof baseContextFields>,
  effectiveOffSeasonWeeks?: number
): AnnualPlanningContext {
  const totalWeeks = effectiveOffSeasonWeeks ?? OFF_SEASON_WEEKS_V1
  const phase = offSeasonPhaseFromWeek(weekNumber, totalWeeks)
  return {
    cycle: 'off_season',
    offSeasonPhase: phase,
    weekNumber,
    weekLabel: offSeasonWeekLabel(weekNumber, phase),
    isDeloadWeek: false,
    offSeasonStartAt: offSeasonStartIso,
    effectiveOffSeasonWeeks: totalWeeks,
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
    let offStartMonday: Date
    if (anchors.offSeasonStartAt) {
      offStartMonday = startOfIsoWeekMonday(parseLocalDateOnly(anchors.offSeasonStartAt)!)
      acc.bump('explicit_anchors')
      acc.rule('rule:manual_off_season_start_at')
    } else if (anchors.seasonEndedAt) {
      // V2: derive off-season start from the real season-end anchor
      const ended = parseLocalDateOnly(anchors.seasonEndedAt)!
      offStartMonday = addDays(startOfIsoWeekMonday(ended), DAYS_PER_WEEK)
      acc.bump('explicit_anchors')
      acc.rule('rule:manual_off_season_from_season_ended')
    } else if (firstMatchDate) {
      const firstMatchWeekMonday = startOfIsoWeekMonday(parseLocalDateOnly(firstMatchDate)!)
      const preSeasonStartMonday = addDays(firstMatchWeekMonday, -PRE_SEASON_WEEKS * DAYS_PER_WEEK)
      offStartMonday = addDays(preSeasonStartMonday, -OFF_SEASON_BACKFILL_WEEKS * DAYS_PER_WEEK)
      acc.warn(
        'Cycle off-season manuel : debut d\'off-season derive du premier match (-22 sem.) faute d\'ancre explicite.'
      )
    } else {
      offStartMonday = todayWeekMonday
      acc.warn(
        'Cycle off-season manuel sans calendrier : ancrage du debut d\'off-season sur la semaine ISO courante.'
      )
    }
    // Compute the week number from the off-season start
    let wn = anchors.manualOffSeasonWeekOverride ??
      Math.max(1, Math.floor(wholeDaysBetween(offStartMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1)
    wn = Math.min(OFF_SEASON_WEEKS_V1, Math.max(1, wn))
    wn = bumpOffSeasonWeekSkipRecoveryIntro(wn, OFF_SEASON_WEEKS_V1, anchors)
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
  const meso = computeInSeasonMesocycle(wIn)
  if (meso.isDeloadWeek) acc.rule('rule:in_season_deload_3_1')
  return {
    cycle: 'in_season',
    weekNumber: wIn,
    weekLabel: `En saison - S${wIn} (${meso.mesocycleWeek}/4)`,
    isDeloadWeek: meso.isDeloadWeek,
    mesocycleWeek: meso.mesocycleWeek,
    mesocycleBlock: meso.mesocycleBlock,
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
    if (parseLocalDateOnly(anchors.returnToTeamTrainingAt)) {
      acc.rule('anchor:return_to_team_training_validated')
    } else {
      acc.warn(
        `returnToTeamTrainingAt ignoré (invalide) : ${JSON.stringify(anchors.returnToTeamTrainingAt)}`,
      )
    }
  }

  const matchDates = collectMatchDates(inputs.events)
  const firstMatchCalendar = matchDates.length > 0 ? matchDates[0] : null
  const firstMatchDate = anchors.firstMatchDateOverride ?? firstMatchCalendar

  // Playoffs : only honour the flag during April-May (FFR season).
  // After June the flag is stale — fall through to normal cycle detection.
  const playoffsMonthGuard = todayDate.getMonth() + 1 <= 5 // Jan–May
  const cupFinalBypass = hasFutureCupFinalMatch(inputs.events, todayIso)
  if (
    (playoffsMonthGuard || cupFinalBypass) &&
    (anchors.manualPlayoffs === true || anchors.manualCycleOverride === 'playoffs')
  ) {
    acc.bump('manual_override')
    acc.rule('rule:manual_playoffs')

    // Compute taper phase based on daysUntilNextMatch
    const nextMatch = nextMatchOnOrAfter(matchDates, todayIso)
    const dun = nextMatch ? wholeDaysBetween(todayDate, parseLocalDateOnly(nextMatch)!) : null

    let taperPhase: PlayoffTaperPhase = 'taper_1'
    if (dun != null) {
      if (dun <= 5) {
        taperPhase = 'match_week'
        acc.rule('rule:playoffs_match_week')
      } else if (dun <= 10) {
        taperPhase = 'taper_2'
        acc.rule('rule:playoffs_taper_2')
      } else {
        acc.rule('rule:playoffs_taper_1')
      }
    }

    const trace = acc.freeze()
    return {
      cycle: 'playoffs',
      weekNumber: 1,
      weekLabel: `Playoffs — ${taperPhaseLabel(taperPhase)}`,
      playoffTaperPhase: taperPhase,
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
    const baseline = inputs.trainingBaseline

    // KB: population-specific.md §3 + periodization.md §4.2
    // peak → skip la phase d'intro (général/recovery) ; active/restart/unset → démarrage standard.
    if (baseline === 'peak') acc.rule('rule:training_baseline_peak')
    if (baseline === 'restart') acc.rule('rule:training_baseline_restart')

    if (hintCycle === 'in_season') {
      const mesoHint = computeInSeasonMesocycle(1)
      const trace = acc.freeze()
      return {
        cycle: 'in_season',
        weekNumber: 1,
        weekLabel: 'En saison - S1 (1/4)',
        isDeloadWeek: mesoHint.isDeloadWeek,
        mesocycleWeek: mesoHint.mesocycleWeek,
        mesocycleBlock: mesoHint.mesocycleBlock,
        offSeasonStartAt: null,
        ...baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace),
      }
    }

    if (hintCycle === 'pre_season') {
      // peak → démarre phase 2 (force) au lieu de phase 1 (préparation générale).
      const startPhase: PreSeasonPhase = baseline === 'peak' ? 2 : 1
      const trace = acc.freeze()
      return {
        cycle: 'pre_season',
        preSeasonPhase: startPhase,
        weekNumber: 1,
        weekLabel: preSeasonWeekLabel(1, startPhase),
        isDeloadWeek: false,
        offSeasonStartAt: null,
        ...baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace),
      }
    }

    if (hintCycle === 'off_season') {
      // peak → skip phase 1 (Récupération W1-W2) + phase 2 (Transition W3-W4), démarre W5 (Hypertrophy).
      const startWeekBase = baseline === 'peak' ? 5 : 1
      const startWeek = bumpOffSeasonWeekSkipRecoveryIntro(startWeekBase, OFF_SEASON_WEEKS_V1, anchors)
      const trace = acc.freeze()
      return buildOffSeasonContext(
        startWeek,
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
      bumpOffSeasonWeekSkipRecoveryIntro(1, OFF_SEASON_WEEKS_V1, anchors),
      toIsoDate(todayWeekMonday),
      baseContextFields(inputs, todayDate, todayIso, matchDates, null, trace)
    )
  }

  const firstMatchParsed = parseLocalDateOnly(firstMatchDate)!
  const firstMatchWeekMonday = startOfIsoWeekMonday(firstMatchParsed)

  // V2: Resolve pre-season start (flexible anchoring via returnToTeamTrainingAt)
  const { preSeasonStartMonday, effectivePreSeasonWeeks } = resolvePreSeasonStart(
    firstMatchWeekMonday, anchors, acc
  )
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
        'Début d\'off-season reconstruit : 10 semaines avant le début de pré-saison (ancre calendrier insuffisante).'
      )
    } else {
      offSeasonStartMonday = addDays(preSeasonStartMonday, -OFF_SEASON_BACKFILL_WEEKS * DAYS_PER_WEEK)
      offSeasonBackfilled = true
      acc.bump('backfilled')
      acc.rule('rule:off_season_start_reporting_backfill')
    }
  }

  const offSeasonStartIso = toIsoDate(offSeasonStartMonday)

  // Explicit season-ended anchor: if the user declared the season over and today is
  // at or past the derived off-season start, force off-season immediately instead of
  // falling through to in-season (preSeasonStartMonday refers to the already-completed
  // current season and would be in the past).
  if (anchors.seasonEndedAt && todayWeekMonday >= offSeasonStartMonday) {
    // If returnToTeamTrainingAt is set, check if we should already be in pre-season.
    // The return date acts as a synthetic "first match" for pre-season calculation.
    if (anchors.returnToTeamTrainingAt) {
      const returnDate = parseLocalDateOnly(anchors.returnToTeamTrainingAt)
      if (returnDate) {
        const returnMonday = startOfIsoWeekMonday(returnDate)
        // Pre-season = 8 weeks before return date (compressed; full team training
        // will cover the remaining sport-specific prep).
        const PRE_SEASON_BEFORE_RETURN = 8
        const preSeasonStart = addDays(returnMonday, -PRE_SEASON_BEFORE_RETURN * DAYS_PER_WEEK)
        if (todayWeekMonday >= preSeasonStart) {
          const rawWeek = Math.floor(wholeDaysBetween(preSeasonStart, todayWeekMonday) / DAYS_PER_WEEK) + 1
          const wn = Math.min(PRE_SEASON_BEFORE_RETURN, Math.max(1, rawWeek))
          const phase = preSeasonPhaseFromWeek(wn, PRE_SEASON_BEFORE_RETURN)
          const isDeload = wn % 4 === 0 || wn === PRE_SEASON_BEFORE_RETURN
          acc.bump('explicit_anchors')
          acc.rule('rule:pre_season_from_return_date')
          const trace = acc.freeze()
          return {
            cycle: 'pre_season',
            preSeasonPhase: phase,
            weekNumber: wn,
            weekLabel: preSeasonWeekLabel(wn, phase),
            isDeloadWeek: isDeload,
            effectivePreSeasonWeeks: PRE_SEASON_BEFORE_RETURN,
            offSeasonStartAt: offSeasonStartIso,
            ...baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, trace),
          }
        }
      }
    }

    const rawWeek = Math.floor(wholeDaysBetween(offSeasonStartMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
    const wn = Math.max(1, rawWeek)
    acc.bump('explicit_anchors')
    acc.rule('rule:season_ended_force_off_season')
    const trace = acc.freeze()
    return buildOffSeasonContext(
      bumpOffSeasonWeekSkipRecoveryIntro(wn, MAX_OFF_SEASON_WEEKS, anchors),
      offSeasonStartIso,
      baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, trace),
      MAX_OFF_SEASON_WEEKS
    )
  }

  // V2: Elastic off-season duration
  const effectiveOffSeasonWeeks = resolveOffSeasonDuration(offSeasonStartMonday, preSeasonStartMonday, acc)

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
    if (rawOffWeek > effectiveOffSeasonWeeks) {
      rawOffWeek = effectiveOffSeasonWeeks
      clamped = true
      acc.warn(
        `Semaine off-season hors fenêtre (S1–S${effectiveOffSeasonWeeks}) : valeur ramenée à S${effectiveOffSeasonWeeks} (Force-Bridge).`
      )
    }
    if (clamped && anchors.manualOffSeasonWeekOverride === undefined) {
      acc.warn('Semaine off-season bornée au modèle annuel.')
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
      bumpOffSeasonWeekSkipRecoveryIntro(rawOffWeek, effectiveOffSeasonWeeks, anchors),
      offSeasonStartIso,
      baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, trace),
      effectiveOffSeasonWeeks
    )
  }

  if (todayWeekMonday < firstMatchWeekMonday) {
    const rawWeek =
      Math.floor(wholeDaysBetween(preSeasonStartMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
    let wn = Math.min(effectivePreSeasonWeeks, Math.max(1, rawWeek))
    if (anchors.manualPreSeasonWeekOverride !== undefined) {
      acc.bump('manual_override')
      acc.rule('rule:manual_pre_season_week')
      wn = Math.min(effectivePreSeasonWeeks, Math.max(1, anchors.manualPreSeasonWeekOverride))
    } else {
      acc.bump('calendar_inferred')
      acc.rule('rule:pre_season_from_calendar')
    }
    const phase = preSeasonPhaseFromWeek(wn, effectivePreSeasonWeeks)
    // Deload every 4 weeks and at the last week
    const isDeload = wn % 4 === 0 || wn === effectivePreSeasonWeeks
    const trace = acc.freeze()
    return {
      cycle: 'pre_season',
      preSeasonPhase: phase,
      weekNumber: wn,
      weekLabel: preSeasonWeekLabel(wn, phase),
      isDeloadWeek: isDeload,
      effectivePreSeasonWeeks,
      offSeasonStartAt: offSeasonStartIso,
      ...baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, trace),
    }
  }

  // Auto-transition: if no future match and last match > 28 days ago,
  // the season is effectively over — fall back to off-season rather than
  // staying stuck in in_season indefinitely (dead-end after dismiss).
  const AUTO_SEASON_END_DAYS = 28
  const base = baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, acc.freeze())
  if (
    base.daysUntilNextMatch == null &&
    base.daysSinceLastMatch != null &&
    base.daysSinceLastMatch >= AUTO_SEASON_END_DAYS
  ) {
    acc.bump('calendar_inferred')
    acc.rule('rule:auto_season_ended_28d')
    acc.warn('Aucun match futur et dernier match > 28j : basculement automatique en off-season.')
    const autoTrace = acc.freeze()
    return buildOffSeasonContext(
      bumpOffSeasonWeekSkipRecoveryIntro(1, OFF_SEASON_WEEKS_V1, anchors),
      toIsoDate(todayWeekMonday),
      baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, autoTrace)
    )
  }

  const inSeasonWeekNumber =
    Math.floor(wholeDaysBetween(firstMatchWeekMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
  const wIn = Math.max(1, inSeasonWeekNumber)
  acc.bump('calendar_inferred')
  acc.rule('rule:in_season_from_calendar')
  const mesoCal = computeInSeasonMesocycle(wIn)
  if (mesoCal.isDeloadWeek) acc.rule('rule:in_season_deload_3_1')

  // V2: Resolve in-season sub-mode (trêve formalisée)
  const inSeasonSubMode = resolveInSeasonSubMode(base.daysUntilNextMatch, base.daysSinceLastMatch, acc)

  const trace = acc.freeze()
  const weekLabel =
    inSeasonSubMode === 'end_of_season'
      ? `Fin de saison - décompression`
      : `En saison - S${wIn} (${mesoCal.mesocycleWeek}/4)`
  return {
    cycle: 'in_season',
    weekNumber: wIn,
    weekLabel,
    isDeloadWeek: mesoCal.isDeloadWeek,
    mesocycleWeek: mesoCal.mesocycleWeek,
    mesocycleBlock: mesoCal.mesocycleBlock,
    inSeasonSubMode,
    offSeasonStartAt: offSeasonStartIso,
    ...baseContextFields(inputs, todayDate, todayIso, matchDates, firstMatchDate, trace),
  }
}

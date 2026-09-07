/**
 * Diagnostic cycle pour /admin — même moteur que /week (detectAnnualPlanningContext).
 * Objectif : lire où est le joueur et pourquoi, sans ouvrir le code.
 */

import type { AnnualCycle, AthletePlanningInputs } from '../../types/annualPlanning'
import type { CalendarEvent, MatchKind } from '../../types/training'
import { detectAnnualPlanningContext } from '../season/detectAnnualPlanningContext'
import { sanitizePlanningAnchorsForProgression } from '../season/sanitizePlanningAnchors'

export type AdminMatchSummary = {
  date: string
  opponent: string | null
  match_kind: MatchKind | null
  source: string | null
  user_hidden: boolean
}

export type AdminCycleDiagnosticInput = {
  todayIso: string
  seasonMode: string | null
  weeklySessions: number | null
  onboardingComplete: boolean | null
  trainingBaseline: string | null
  planningAnchors: Record<string, unknown> | null
  matches: AdminMatchSummary[]
}

export type AdminCycleFlag = {
  severity: 'info' | 'warn' | 'danger'
  code: string
  message: string
}

export type AdminCycleDiagnostic = {
  ok: boolean
  error: string | null
  /** Cycle réellement utilisé par le programme. */
  liveCycle: AnnualCycle | null
  liveCycleLabel: string
  weekLabel: string | null
  weekNumber: number | null
  isDeloadWeek: boolean
  isMatchWeek: boolean
  firstMatchDate: string | null
  firstMatchOpponent: string | null
  nextMatchDate: string | null
  daysUntilNextMatch: number | null
  daysSinceLastMatch: number | null
  /** Colonne profiles.season_mode (affichage / legacy). */
  storedSeasonMode: string | null
  storedSeasonModeMismatch: boolean
  resolutionMode: string | null
  resolutionModeLabel: string
  why: string
  rulesApplied: string[]
  engineWarnings: string[]
  flags: AdminCycleFlag[]
  anchorsSummary: Array<{ key: string; value: string }>
}

const CYCLE_LABELS: Record<AnnualCycle, string> = {
  off_season: 'Inter-saison',
  pre_season: 'Pré-saison',
  in_season: 'En saison',
  playoffs: 'Playoffs',
}

const RESOLUTION_LABELS: Record<string, string> = {
  manual_override: 'Override manuel (force le cycle)',
  explicit_anchors: 'Ancres explicites (reprise / début inter-saison)',
  calendar_inferred: 'Calendrier de matchs',
  onboarding_hint: 'Hint onboarding (sans match)',
  default_ffr_clock: 'Horloge amateur FFR (sans match)',
  backfilled: 'Début inter-saison reconstruit',
}

function asAnnualCycle(value: unknown): AnnualCycle | undefined {
  if (
    value === 'off_season' ||
    value === 'pre_season' ||
    value === 'in_season' ||
    value === 'playoffs'
  ) {
    return value
  }
  return undefined
}

function clampWeeklyFrequency(n: number | null): 2 | 3 | 4 {
  if (n === 2 || n === 3 || n === 4) return n
  if (n != null && n >= 4) return 4
  if (n != null && n <= 2) return 2
  return 3
}

function anchorsToPlanning(
  raw: Record<string, unknown> | null,
): NonNullable<AthletePlanningInputs['planningAnchors']> {
  const a = raw ?? {}
  const out: NonNullable<AthletePlanningInputs['planningAnchors']> = {}
  if (typeof a.firstMatchDateOverride === 'string' && a.firstMatchDateOverride) {
    out.firstMatchDateOverride = a.firstMatchDateOverride
  }
  if (typeof a.offSeasonStartAt === 'string' && a.offSeasonStartAt) {
    out.offSeasonStartAt = a.offSeasonStartAt.slice(0, 10)
  }
  if (typeof a.seasonEndedAt === 'string' && a.seasonEndedAt) {
    out.seasonEndedAt = a.seasonEndedAt.slice(0, 10)
  }
  if (typeof a.returnToTeamTrainingAt === 'string' && a.returnToTeamTrainingAt) {
    out.returnToTeamTrainingAt = a.returnToTeamTrainingAt.slice(0, 10)
  }
  const manual = asAnnualCycle(a.manualCycleOverride)
  if (manual) out.manualCycleOverride = manual
  if (typeof a.manualOffSeasonWeekOverride === 'number') {
    out.manualOffSeasonWeekOverride = a.manualOffSeasonWeekOverride
  }
  if (typeof a.manualPreSeasonWeekOverride === 'number') {
    out.manualPreSeasonWeekOverride = a.manualPreSeasonWeekOverride
  }
  if (a.manualPlayoffs === true) out.manualPlayoffs = true
  const hint = asAnnualCycle(a.onboardingCycleHint)
  if (hint) out.onboardingCycleHint = hint
  if (a.skipOffSeasonRecoveryIntro === true) out.skipOffSeasonRecoveryIntro = true
  if (a.seasonEndedSource === 'manual' || a.seasonEndedSource === 'derived') {
    out.seasonEndedSource = a.seasonEndedSource
  }
  return out
}

function visibleMatchEvents(matches: AdminMatchSummary[]): Array<Pick<CalendarEvent, 'date' | 'type' | 'match_kind'>> {
  return matches
    .filter((m) => !m.user_hidden)
    .map((m) => ({
      date: m.date,
      type: 'match' as const,
      ...(m.match_kind ? { match_kind: m.match_kind } : {}),
    }))
}

function eventsAndOpponents(matches: AdminMatchSummary[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const m of matches) {
    if (m.user_hidden || !m.opponent) continue
    if (!map.has(m.date)) map.set(m.date, m.opponent)
  }
  return map
}

function buildWhy(params: {
  resolutionMode: string
  liveCycle: AnnualCycle
  weekLabel: string
  manualOverride: AnnualCycle | undefined
  firstMatchDate: string | null
  returnToTeam: string | undefined
  offSeasonStart: string | undefined
}): string {
  const bits: string[] = []
  bits.push(RESOLUTION_LABELS[params.resolutionMode] ?? params.resolutionMode)

  if (params.manualOverride) {
    bits.push(
      `manualCycleOverride = ${params.manualOverride} (priorité max — le calendrier de matchs est contourné)`,
    )
  } else if (params.firstMatchDate) {
    bits.push(`1er match retenu = ${params.firstMatchDate}`)
    if (params.returnToTeam) bits.push(`reprise club = ${params.returnToTeam}`)
    if (params.offSeasonStart) bits.push(`début inter-saison = ${params.offSeasonStart}`)
  } else {
    bits.push('aucun match visible au calendrier')
  }

  bits.push(`→ ${CYCLE_LABELS[params.liveCycle]} · ${params.weekLabel}`)
  return bits.join(' · ')
}

function collectFlags(input: AdminCycleDiagnosticInput, live: {
  cycle: AnnualCycle
  firstMatchDate: string | null
  daysUntilNextMatch: number | null
  isDeloadWeek: boolean
  resolutionMode: string
}): AdminCycleFlag[] {
  const flags: AdminCycleFlag[] = []
  const anchors = input.planningAnchors ?? {}

  if (anchors.manualCycleOverride) {
    flags.push({
      severity: 'danger',
      code: 'manual_cycle_override',
      message: `Override manuel actif (${String(anchors.manualCycleOverride)}). Le programme ne suit plus uniquement le calendrier.`,
    })
  }

  if (
    input.seasonMode &&
    input.seasonMode !== live.cycle &&
    !(input.seasonMode === 'playoffs' && live.cycle === 'in_season')
  ) {
    flags.push({
      severity: 'warn',
      code: 'season_mode_mismatch',
      message: `season_mode stocké = ${input.seasonMode}, cycle live = ${live.cycle}. Le programme suit le live ; season_mode est surtout legacy / onboarding.`,
    })
  }

  if (input.onboardingComplete === false) {
    flags.push({
      severity: 'info',
      code: 'onboarding_incomplete',
      message: 'Onboarding incomplet — certaines ancres peuvent venir du premier run.',
    })
  }

  if (
    live.cycle === 'in_season' &&
    live.daysUntilNextMatch != null &&
    live.daysUntilNextMatch > 14 &&
    live.isDeloadWeek
  ) {
    flags.push({
      severity: 'warn',
      code: 'early_in_season_deload',
      message: `En saison + décharge, alors que le prochain match est dans ${live.daysUntilNextMatch} j. Vérifier un override ou une mauvaise ancre de reprise.`,
    })
  }

  const offStart =
    typeof anchors.offSeasonStartAt === 'string' ? anchors.offSeasonStartAt.slice(0, 10) : null
  const leftoverVisible = input.matches.filter(
    (m) => !m.user_hidden && offStart != null && m.date < offStart,
  )
  if (leftoverVisible.length > 0) {
    const list = leftoverVisible
      .map((m) => `${m.date}${m.opponent ? ` ${m.opponent}` : ''}`)
      .join(' ; ')
    flags.push({
      severity: live.cycle === 'in_season' ? 'danger' : 'warn',
      code: 'leftover_pre_offseason_match',
      message:
        live.cycle === 'in_season'
          ? `Match d’avant-saison encore visible (${list}). Le moteur le prend comme J1 → En saison au lieu de la nouvelle saison.`
          : `Match d’avant-saison encore visible (${list}), avant offSeasonStartAt ${offStart}. Ignoré pour le J1 ; à masquer du calendrier.`,
    })
  }

  if (
    live.cycle === 'in_season' &&
    live.firstMatchDate &&
    live.firstMatchDate < input.todayIso &&
    live.daysUntilNextMatch != null &&
    live.daysUntilNextMatch > 21 &&
    live.firstMatchDate !== input.matches.find((m) => !m.user_hidden && m.date >= input.todayIso)?.date
  ) {
    flags.push({
      severity: 'danger',
      code: 'stale_first_match',
      message: `J1 moteur = ${live.firstMatchDate}, alors que le prochain match est dans ${live.daysUntilNextMatch} j. Un vieux match fait office de début de saison.`,
    })
  }

  if (anchors.manualOffSeasonWeekOverride != null && !anchors.offSeasonStartAt && !anchors.returnToTeamTrainingAt) {
    flags.push({
      severity: 'warn',
      code: 'frozen_off_week',
      message: `Semaine inter-saison figée (S${String(anchors.manualOffSeasonWeekOverride)}) sans ancre calendaire — la semaine ne progressera pas.`,
    })
  }

  if (live.resolutionMode === 'backfilled') {
    flags.push({
      severity: 'info',
      code: 'off_season_backfilled',
      message: 'Début d’inter-saison reconstruit (pas d’ancre explicite).',
    })
  }

  return flags
}

function anchorsSummary(raw: Record<string, unknown> | null): Array<{ key: string; value: string }> {
  if (!raw) return []
  const keys = [
    'manualCycleOverride',
    'offSeasonStartAt',
    'returnToTeamTrainingAt',
    'seasonEndedAt',
    'onboardingCycleHint',
    'skipOffSeasonRecoveryIntro',
    'manualOffSeasonWeekOverride',
    'manualPreSeasonWeekOverride',
    'manualPlayoffs',
    'firstMatchDateOverride',
  ] as const
  const rows: Array<{ key: string; value: string }> = []
  for (const key of keys) {
    const v = raw[key]
    if (v === undefined || v === null || v === '') continue
    rows.push({
      key,
      value:
        typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : String(v),
    })
  }
  return rows
}

/**
 * Calcule le diagnostic admin à partir du profil + matchs renvoyés par admin-panel.
 */
export function buildAdminCycleDiagnostic(input: AdminCycleDiagnosticInput): AdminCycleDiagnostic {
  const empty = (error: string | null): AdminCycleDiagnostic => ({
    ok: false,
    error,
    liveCycle: null,
    liveCycleLabel: '—',
    weekLabel: null,
    weekNumber: null,
    isDeloadWeek: false,
    isMatchWeek: false,
    firstMatchDate: null,
    firstMatchOpponent: null,
    nextMatchDate: null,
    daysUntilNextMatch: null,
    daysSinceLastMatch: null,
    storedSeasonMode: input.seasonMode,
    storedSeasonModeMismatch: false,
    resolutionMode: null,
    resolutionModeLabel: '—',
    why: error ?? 'Diagnostic indisponible',
    rulesApplied: [],
    engineWarnings: [],
    flags: [],
    anchorsSummary: anchorsSummary(input.planningAnchors),
  })

  try {
    const planningAnchors = sanitizePlanningAnchorsForProgression(
      anchorsToPlanning(input.planningAnchors),
      input.todayIso,
    )
    const events = visibleMatchEvents(input.matches)
    const baseline =
      input.trainingBaseline === 'restart' ||
      input.trainingBaseline === 'active' ||
      input.trainingBaseline === 'peak'
        ? input.trainingBaseline
        : undefined

    const ctx = detectAnnualPlanningContext({
      events,
      today: input.todayIso,
      weeklyFrequency: clampWeeklyFrequency(input.weeklySessions),
      positionGroup: 'front_row',
      trainingBaseline: baseline,
      planningAnchors,
    })

    const stored = input.seasonMode
    const mismatch = Boolean(stored && stored !== ctx.cycle)
    const nextMatchDate =
      ctx.daysUntilNextMatch != null && ctx.firstMatchDate
        ? events
            .map((e) => e.date)
            .filter((d) => d >= input.todayIso)
            .sort()[0] ?? null
        : events.map((e) => e.date).filter((d) => d >= input.todayIso).sort()[0] ?? null

    const why = buildWhy({
      resolutionMode: ctx.planningTrace.resolutionMode,
      liveCycle: ctx.cycle,
      weekLabel: ctx.weekLabel,
      manualOverride: planningAnchors?.manualCycleOverride,
      firstMatchDate: ctx.firstMatchDate,
      returnToTeam: planningAnchors?.returnToTeamTrainingAt,
      offSeasonStart: planningAnchors?.offSeasonStartAt ?? ctx.offSeasonStartAt ?? undefined,
    })

    return {
      ok: true,
      error: null,
      liveCycle: ctx.cycle,
      liveCycleLabel: CYCLE_LABELS[ctx.cycle],
      weekLabel: ctx.weekLabel,
      weekNumber: ctx.weekNumber ?? null,
      isDeloadWeek: ctx.isDeloadWeek,
      isMatchWeek: ctx.isMatchWeek,
      firstMatchDate: ctx.firstMatchDate,
      firstMatchOpponent:
        ctx.firstMatchDate != null
          ? eventsAndOpponents(input.matches).get(ctx.firstMatchDate) ?? null
          : null,
      nextMatchDate,
      daysUntilNextMatch: ctx.daysUntilNextMatch,
      daysSinceLastMatch: ctx.daysSinceLastMatch,
      storedSeasonMode: stored,
      storedSeasonModeMismatch: mismatch,
      resolutionMode: ctx.planningTrace.resolutionMode,
      resolutionModeLabel: RESOLUTION_LABELS[ctx.planningTrace.resolutionMode] ?? ctx.planningTrace.resolutionMode,
      why,
      rulesApplied: ctx.planningTrace.rulesApplied,
      engineWarnings: ctx.planningTrace.warnings,
      flags: collectFlags(input, {
        cycle: ctx.cycle,
        firstMatchDate: ctx.firstMatchDate,
        daysUntilNextMatch: ctx.daysUntilNextMatch,
        isDeloadWeek: ctx.isDeloadWeek,
        resolutionMode: ctx.planningTrace.resolutionMode,
      }),
      anchorsSummary: anchorsSummary(input.planningAnchors),
    }
  } catch (e) {
    return empty(e instanceof Error ? e.message : 'Erreur de détection')
  }
}

export function formatAdminCycleLabel(cycle: string | null | undefined): string {
  if (!cycle) return '—'
  if (cycle === 'off_season' || cycle === 'pre_season' || cycle === 'in_season' || cycle === 'playoffs') {
    return CYCLE_LABELS[cycle]
  }
  return cycle
}

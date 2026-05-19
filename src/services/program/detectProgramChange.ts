/**
 * Detect upcoming or active program changes that warrant a Monday-morning
 * blocking notice. Pure function — no I/O, no React state.
 *
 * Compares the annual planning context for `today` vs. for `nextMonday` and
 * surfaces the highest-priority change among:
 *   - cycle change (off → pre → in)            [warning, postponable]
 *   - mesocycle phase shift                    [info,    postponable]
 *   - ACWR critical/danger zone                [critical, not postponable]
 *   - upcoming match within 7 days             [info,    not postponable]
 *
 * The caller (the React hook) is responsible for filtering against
 * acknowledged/postponed state.
 */

import type { AnnualPlanningContext, AthletePlanningInputs } from '../../types/annualPlanning'
import type { CalendarEvent } from '../../types/training'
import type { ACWRZone } from '../../hooks/useACWR'
import type { ProgramChangeNotice, ProgramChangeSeverity } from '../../types/programChange'
import type { Lang } from '../../i18n/appLabels'
import {
  cycleChangeSummary,
  cycleChangeTitle,
  describeCycleChangeBullets,
  phaseBulletsForNotice,
  programNoticeAcwrCritical,
  programNoticeAcwrDanger,
  programNoticeDeloadBullets,
  programNoticeDeloadSummary,
  programNoticeDeloadTitle,
  programNoticeMatchWeek,
  programNoticeOffSeasonPhaseSummary,
  programNoticeOffSeasonPhaseTitle,
  programNoticePreSeasonPhaseSummary,
  programNoticePreSeasonPhaseTitle,
} from '../../i18n/programSurfaces'
import { detectAnnualPlanningContext } from '../season/detectAnnualPlanningContext'

const SEVERITY_RANK: Record<ProgramChangeSeverity, number> = {
  info: 1,
  warning: 2,
  critical: 3,
}

export type DetectProgramChangeInputs = Omit<AthletePlanningInputs, 'today' | 'events'> & {
  today: string
  acwrZone: ACWRZone | null
  /** Visible (non-hidden) calendar events. */
  calendarEvents: CalendarEvent[]
  /** UI language for notice copy. */
  lang?: Lang
}

/** Add `days` to an ISO date string (YYYY-MM-DD). Pure local-date arithmetic. */
function addDaysIso(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Invalid date: ${iso}`)
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  date.setDate(date.getDate() + days)
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

/** Days until next Monday (1..7). If today IS Monday, returns 7 (next Monday). */
function daysUntilNextMonday(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Invalid date: ${iso}`)
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  const dow = date.getDay() // 0=Sun, 1=Mon, ...
  const delta = ((1 - dow + 7) % 7) || 7
  return delta
}

function safeDetect(inputs: AthletePlanningInputs): AnnualPlanningContext | null {
  try {
    return detectAnnualPlanningContext(inputs)
  } catch {
    return null
  }
}

function buildCycleNotice(
  current: AnnualPlanningContext,
  next: AnnualPlanningContext,
  effectiveDate: string,
  lang: Lang,
): ProgramChangeNotice | null {
  if (current.cycle === next.cycle) return null
  const year = effectiveDate.slice(0, 4)
  return {
    id: `cycle:${current.cycle}_to_${next.cycle}:${year}`,
    type: 'cycle',
    severity: 'warning',
    title: cycleChangeTitle(next.cycle, lang),
    summary: cycleChangeSummary(current.cycle, next.cycle, lang),
    bullets: describeCycleChangeBullets(current.cycle, next.cycle, lang),
    postponable: true,
    effectiveDate,
  }
}

function buildPhaseNotice(
  current: AnnualPlanningContext,
  next: AnnualPlanningContext,
  effectiveDate: string,
  lang: Lang,
): ProgramChangeNotice | null {
  if (current.cycle !== next.cycle) return null

  const year = effectiveDate.slice(0, 4)

  if (current.cycle === 'off_season' && current.offSeasonPhase !== next.offSeasonPhase) {
    const fromPhase = current.offSeasonPhase
    const toPhase = next.offSeasonPhase
    if (!fromPhase || !toPhase) return null
    return {
      id: `phase:offseason_${fromPhase}_to_${toPhase}:${year}`,
      type: 'phase',
      severity: 'info',
      title: programNoticeOffSeasonPhaseTitle(lang),
      summary: programNoticeOffSeasonPhaseSummary(fromPhase, toPhase, lang),
      bullets: phaseBulletsForNotice('off_season', toPhase, lang),
      postponable: true,
      effectiveDate,
    }
  }

  if (current.cycle === 'pre_season' && current.preSeasonPhase !== next.preSeasonPhase) {
    const fromPhase = current.preSeasonPhase
    const toPhase = next.preSeasonPhase
    if (!fromPhase || !toPhase) return null
    return {
      id: `phase:preseason_${fromPhase}_to_${toPhase}:${year}`,
      type: 'phase',
      severity: 'info',
      title: programNoticePreSeasonPhaseTitle(lang),
      summary: programNoticePreSeasonPhaseSummary(fromPhase, toPhase, lang),
      bullets: phaseBulletsForNotice('pre_season', toPhase, lang),
      postponable: true,
      effectiveDate,
    }
  }

  if (current.cycle === 'in_season' && !current.isDeloadWeek && next.isDeloadWeek) {
    return {
      id: `phase:inseason_deload:${isoWeekKey(effectiveDate)}`,
      type: 'phase',
      severity: 'info',
      title: programNoticeDeloadTitle(lang),
      summary: programNoticeDeloadSummary(lang),
      bullets: programNoticeDeloadBullets(lang),
      postponable: true,
      effectiveDate,
    }
  }

  return null
}

function buildAcwrNotice(zone: ACWRZone | null, today: string, lang: Lang): ProgramChangeNotice | null {
  if (zone !== 'critical' && zone !== 'danger') return null
  const isoWeek = isoWeekKey(today)
  if (zone === 'critical') {
    const copy = programNoticeAcwrCritical(lang)
    return {
      id: `acwr:critical:${isoWeek}`,
      type: 'acwr',
      severity: 'critical',
      title: copy.title,
      summary: copy.summary,
      bullets: copy.bullets,
      postponable: false,
      effectiveDate: today,
    }
  }
  const copy = programNoticeAcwrDanger(lang)
  return {
    id: `acwr:danger:${isoWeek}`,
    type: 'acwr',
    severity: 'warning',
    title: copy.title,
    summary: copy.summary,
    bullets: copy.bullets,
    postponable: false,
    effectiveDate: today,
  }
}

function buildMatchNotice(
  events: CalendarEvent[],
  today: string,
  lang: Lang,
): ProgramChangeNotice | null {
  const inSevenDays = addDaysIso(today, 7)
  const upcomingMatch = events.find(
    (e) => e.type === 'match' && e.date >= today && e.date <= inSevenDays,
  )
  if (!upcomingMatch) return null
  const copy = programNoticeMatchWeek(upcomingMatch.date, lang)
  return {
    id: `match:${upcomingMatch.date}`,
    type: 'match',
    severity: 'info',
    title: copy.title,
    summary: copy.summary,
    bullets: copy.bullets,
    postponable: false,
    effectiveDate: today,
  }
}

function isoWeekKey(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  const dow = date.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  date.setDate(date.getDate() + offset)
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

/**
 * Compute the highest-priority program-change notice for the given inputs.
 * Returns `null` when nothing notable is happening or when the planning
 * context cannot be resolved (missing season anchors, etc.).
 */
export function detectProgramChange(inputs: DetectProgramChangeInputs): ProgramChangeNotice | null {
  const { today, acwrZone, calendarEvents, lang = 'fr', ...rest } = inputs

  const baseInputs: AthletePlanningInputs = {
    ...rest,
    events: calendarEvents.map((e) => ({ date: e.date, type: e.type })),
    today,
  }

  const current = safeDetect(baseInputs)
  const nextMonday = addDaysIso(today, daysUntilNextMonday(today))
  const next = safeDetect({ ...baseInputs, today: nextMonday })

  const candidates: ProgramChangeNotice[] = []

  if (current && next) {
    const cycleNotice = buildCycleNotice(current, next, nextMonday, lang)
    if (cycleNotice) candidates.push(cycleNotice)

    const phaseNotice = buildPhaseNotice(current, next, nextMonday, lang)
    if (phaseNotice) candidates.push(phaseNotice)
  }

  const acwrNotice = buildAcwrNotice(acwrZone, today, lang)
  if (acwrNotice) candidates.push(acwrNotice)

  const matchNotice = buildMatchNotice(calendarEvents, today, lang)
  if (matchNotice) candidates.push(matchNotice)

  if (candidates.length === 0) return null
  candidates.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
  return candidates[0]
}

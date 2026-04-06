import type { CalendarEvent } from '../../types/training'

/** Entrée minimale : seuls les `type === 'match'` sont pris en compte */
export type CalendarMatchInput = Pick<CalendarEvent, 'date' | 'type'>

export type SeasonCycle = 'off_season' | 'pre_season' | 'in_season' | 'playoffs'

export interface SeasonPhaseInfo {
  cycle: SeasonCycle
  phase?: 1 | 2 | 3
  weekNumber?: number
  weekLabel: string
  isDeloadWeek: boolean
  firstMatchDate: string | null
  daysUntilNextMatch: number | null
  isMatchWeek: boolean
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const PRE_SEASON_WEEKS = 12
const DAYS_PER_WEEK = 7

/** Parse YYYY-MM-DD en Date locale à midi (évite les glissements DST sur les différences de jours). */
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

/**
 * Normalise le jour courant à midi local. Aucun fallback sur l’horloge système.
 * Chaîne : uniquement `YYYY-MM-DD` calendaire valide (pas de parsing `Date` libre).
 */
function normalizeToday(today: Date | string): Date {
  if (typeof today === 'string') {
    const p = parseLocalDateOnly(today)
    if (p) return p
    throw new Error(
      `detectSeasonPhaseInfo: paramètre today invalide (${JSON.stringify(today)}). ` +
        'Attendu : une date calendaire stricte YYYY-MM-DD (ex. 2025-03-15).'
    )
  }
  if (Number.isNaN(today.getTime())) {
    throw new Error(
      'detectSeasonPhaseInfo: paramètre today est une Date invalide (NaN). Fournir une Date constructible.'
    )
  }
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0)
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Lundi 00:00 local → même jour midi pour stabilité */
function startOfIsoWeekMonday(d: Date): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
  const dow = c.getDay() // 0 = dimanche … 6 = samedi
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

function preSeasonPhaseFromWeek(weekNumber: number): 1 | 2 | 3 {
  if (weekNumber <= 4) return 1
  if (weekNumber <= 8) return 2
  return 3
}

function preSeasonWeekLabel(weekNumber: number, phase: 1 | 2 | 3): string {
  return `Pré-saison Phase ${phase} - S${weekNumber}`
}

function collectMatchDates(events: CalendarMatchInput[]): string[] {
  const out: string[] = []
  for (const e of events) {
    if (e.type !== 'match') continue
    if (!parseLocalDateOnly(e.date)) continue
    out.push(e.date)
  }
  out.sort()
  return out
}

function earliestDate(dates: string[]): string | null {
  if (dates.length === 0) return null
  return dates[0]
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

/**
 * Calcule la phase de saison, la semaine courante et des indicateurs matchs.
 * Aucun accès au temps système : `today` est toujours passé explicitement.
 * Si `today` est une string, elle doit être une date calendaire valide `YYYY-MM-DD` ;
 * sinon une erreur est levée (pas de repli sur la date du jour ni sur `new Date(string)`).
 */
export function detectSeasonPhaseInfo(
  events: CalendarMatchInput[],
  today: Date | string
): SeasonPhaseInfo {
  const matchDates = collectMatchDates(events)
  const firstMatch = earliestDate(matchDates)

  const todayDate = normalizeToday(today)
  const todayIso = toIsoDate(todayDate)

  const base: Pick<
    SeasonPhaseInfo,
    'firstMatchDate' | 'daysUntilNextMatch' | 'isMatchWeek'
  > = {
    firstMatchDate: firstMatch,
    daysUntilNextMatch: null,
    isMatchWeek: false,
  }

  if (!firstMatch) {
    return {
      cycle: 'off_season',
      weekLabel: 'Inter-saison',
      isDeloadWeek: false,
      ...base,
    }
  }

  const firstMatchDateParsed = parseLocalDateOnly(firstMatch)!
  const firstMatchWeekMonday = startOfIsoWeekMonday(firstMatchDateParsed)
  const preSeasonStartMonday = addDays(firstMatchWeekMonday, -PRE_SEASON_WEEKS * DAYS_PER_WEEK)
  const todayWeekMonday = startOfIsoWeekMonday(todayDate)

  const weekStartIso = toIsoDate(todayWeekMonday)
  const weekEndIso = toIsoDate(endOfIsoWeekSunday(todayWeekMonday))
  base.isMatchWeek = matchDates.some((d) => isDateInClosedRange(d, weekStartIso, weekEndIso))

  const next = nextMatchOnOrAfter(matchDates, todayIso)
  if (next) {
    const nextD = parseLocalDateOnly(next)!
    base.daysUntilNextMatch = wholeDaysBetween(todayDate, nextD)
  }

  if (todayWeekMonday < preSeasonStartMonday) {
    return {
      cycle: 'off_season',
      weekLabel: 'Inter-saison',
      isDeloadWeek: false,
      ...base,
    }
  }

  if (todayWeekMonday < firstMatchWeekMonday) {
    const rawWeek =
      Math.floor(wholeDaysBetween(preSeasonStartMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
    const wn = Math.min(PRE_SEASON_WEEKS, Math.max(1, rawWeek))
    const phase = preSeasonPhaseFromWeek(wn)
    const isDeload = wn === 4 || wn === 8 || wn === 12
    return {
      cycle: 'pre_season',
      phase,
      weekNumber: wn,
      weekLabel: preSeasonWeekLabel(wn, phase),
      isDeloadWeek: isDeload,
      ...base,
    }
  }

  const inSeasonWeekNumber =
    Math.floor(wholeDaysBetween(firstMatchWeekMonday, todayWeekMonday) / DAYS_PER_WEEK) + 1
  const wIn = Math.max(1, inSeasonWeekNumber)

  return {
    cycle: 'in_season',
    weekNumber: wIn,
    weekLabel: `En saison - S${wIn}`,
    isDeloadWeek: false,
    ...base,
  }
}

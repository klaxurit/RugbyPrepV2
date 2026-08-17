/**
 * Horloge saisonnière amateur FFR — filet quand aucun calendrier de match
 * n’existe. Ne crée **aucun** match synthétique : les semaines de match,
 * J-2 et primers restent déclenchés uniquement par de vrais events.
 *
 * Année type (hémisphère nord, club amateur, 1 match/sem) :
 * - 1er lundi ≥ 1er juin → transition (récup + activité libre, max 4 sem.)
 * - 1er lundi ≥ 1er juillet → pré-saison 1 (force + hypertrophie + base)
 * - 1er lundi ≥ 1er août → pré-saison 2–3 (force → puissance + conditioning)
 * - 1er lundi ≥ 1er septembre → en saison jusqu’au 1er juin suivant
 * - 15 déc. → 4 janv. → deload de trêve (pas un faux match, pas treve_deep)
 *
 * Les blessures / douleur ne pilotent pas cette horloge (stores).
 * Décision produit : `product-decisions.md`.
 */

import { toIsoDateLocal } from '../dates/localIsoDate'
import type { PreSeasonPhase } from '../../types/annualPlanning'

export type DefaultFfrClockCycle = 'off_season' | 'pre_season' | 'in_season'

/** Transition juin–début juillet : récup + activité libre, jamais d’hypertrophie. */
export const FFR_TRANSITION_MAX_WEEKS = 4

export interface DefaultFfrSeasonClock {
  cycle: DefaultFfrClockCycle
  weekNumber: number
  offSeasonStartMondayIso: string
  preSeasonStartMondayIso: string
  inSeasonStartMondayIso: string
  effectiveOffSeasonWeeks: number
  effectivePreSeasonWeeks: number
  /** Juillet = 1 ; 2 premières semaines d’août = 2 ; reste d’août = 3. */
  preSeasonPhase?: PreSeasonPhase
  /** Trêve de fin d’année amateur (~15 déc.–4 janv.). */
  forceDeload?: boolean
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DAYS_PER_WEEK = 7

function atNoon(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
}

function startOfIsoWeekMonday(d: Date): Date {
  const c = atNoon(d)
  const dow = c.getDay()
  const daysFromMonday = (dow + 6) % 7
  c.setDate(c.getDate() - daysFromMonday)
  return c
}

function firstMondayOnOrAfter(year: number, month: number, day: number): Date {
  const d = new Date(year, month - 1, day, 12, 0, 0, 0)
  const dow = d.getDay()
  const daysUntilMonday = dow === 1 ? 0 : (8 - dow) % 7
  d.setDate(d.getDate() + daysUntilMonday)
  return d
}

function wholeDaysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

function weekIndex(startMonday: Date, todayMonday: Date): number {
  return Math.max(1, Math.floor(wholeDaysBetween(startMonday, todayMonday) / DAYS_PER_WEEK) + 1)
}

function weeksBetweenMondays(fromMonday: Date, toMonday: Date): number {
  return Math.max(1, Math.floor(wholeDaysBetween(fromMonday, toMonday) / DAYS_PER_WEEK))
}

function isChristmasDeloadIso(todayIso: string, championshipYear: number): boolean {
  return todayIso >= `${championshipYear}-12-15` && todayIso <= `${championshipYear + 1}-01-04`
}

function preSeasonPhaseFromCalendar(
  todayMonday: Date,
  augStart: Date,
): PreSeasonPhase {
  if (todayMonday < augStart) return 1
  if (weekIndex(augStart, todayMonday) <= 2) return 2
  return 3
}

/**
 * Année du 1er septembre qui ouvre (ou a ouvert) la saison amateur courante.
 * Juin–décembre : saison qui commence / commencera en septembre de cette année civile.
 * Janvier–mai : saison ouverte en septembre de l’année précédente.
 */
export function ffrChampionshipAnchorYear(today: Date): number {
  const month = today.getMonth() + 1
  return month >= 6 ? today.getFullYear() : today.getFullYear() - 1
}

export function resolveDefaultFfrSeasonClock(today: Date): DefaultFfrSeasonClock {
  const todayNoon = atNoon(today)
  const todayMonday = startOfIsoWeekMonday(todayNoon)
  const todayIso = toIsoDateLocal(todayNoon)
  const y = ffrChampionshipAnchorYear(todayNoon)

  const offStart = firstMondayOnOrAfter(y, 6, 1)
  const preStart = firstMondayOnOrAfter(y, 7, 1)
  const augStart = firstMondayOnOrAfter(y, 8, 1)
  const inStart = firstMondayOnOrAfter(y, 9, 1)

  const rawOffWeeks = weeksBetweenMondays(offStart, preStart)
  const effectiveOffSeasonWeeks = Math.min(FFR_TRANSITION_MAX_WEEKS, rawOffWeeks)
  const effectivePreSeasonWeeks = weeksBetweenMondays(preStart, inStart)

  const base = {
    offSeasonStartMondayIso: toIsoDateLocal(offStart),
    preSeasonStartMondayIso: toIsoDateLocal(preStart),
    inSeasonStartMondayIso: toIsoDateLocal(inStart),
    effectiveOffSeasonWeeks,
    effectivePreSeasonWeeks,
  }

  if (todayMonday < preStart) {
    return {
      ...base,
      cycle: 'off_season',
      weekNumber: Math.min(FFR_TRANSITION_MAX_WEEKS, weekIndex(offStart, todayMonday)),
    }
  }

  if (todayMonday < inStart) {
    return {
      ...base,
      cycle: 'pre_season',
      weekNumber: Math.min(effectivePreSeasonWeeks, weekIndex(preStart, todayMonday)),
      preSeasonPhase: preSeasonPhaseFromCalendar(todayMonday, augStart),
    }
  }

  return {
    ...base,
    cycle: 'in_season',
    weekNumber: weekIndex(inStart, todayMonday),
    forceDeload: isChristmasDeloadIso(todayIso, y),
  }
}

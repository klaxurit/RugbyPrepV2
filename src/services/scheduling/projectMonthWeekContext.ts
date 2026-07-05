/**
 * Projection linéaire des phases pour la vue mois :
 * S7 → S8 → … → S10 → Entretien → Pré-saison → En saison.
 * La date de reprise club ne coupe pas l'inter-saison avant S10.
 */
import type {
  AnnualCycle,
  AnnualPlanningContext,
  OffSeasonPhase,
  PreSeasonPhase,
} from '../../types/annualPlanning'
import { addDaysISO, startOfIsoWeek } from '../weeklyBilan/computeWeeklyBilan'
import type { UserProfile } from '../../types/training'

export const OFF_SEASON_STRUCTURED_WEEKS = 10
export const PRE_SEASON_WEEKS_BEFORE_RETURN = 8

export type MonthWeekProjection = Pick<
  AnnualPlanningContext,
  'cycle' | 'weekNumber' | 'offSeasonPhase' | 'preSeasonPhase' | 'isDeloadWeek'
> & {
  weekLabel?: string
}

export function isoWeeksBetween(fromMonday: string, toMonday: string): number {
  const from = new Date(`${fromMonday}T12:00:00`).getTime()
  const to = new Date(`${toMonday}T12:00:00`).getTime()
  return Math.round((to - from) / (7 * 24 * 60 * 60 * 1000))
}

export function offSeasonPhaseFromWeekNumber(
  weekNumber: number,
  totalWeeks: number = OFF_SEASON_STRUCTURED_WEEKS,
): OffSeasonPhase {
  if (weekNumber <= 2) return 1
  if (weekNumber <= 4) return 2
  if (weekNumber <= totalWeeks - 2) return 3
  if (weekNumber <= totalWeeks) return 4
  return 5
}

export function preSeasonPhaseFromWeekNumber(
  weekNumber: number,
  totalWeeks: number = PRE_SEASON_WEEKS_BEFORE_RETURN,
): PreSeasonPhase {
  const third = totalWeeks / 3
  if (weekNumber <= Math.ceil(third)) return 1
  if (weekNumber <= Math.ceil(third * 2)) return 2
  return 3
}

export function resolvePreSeasonStartMonday(profile: UserProfile): string | null {
  const returnAt = profile.planningAnchors?.returnToTeamTrainingAt
  if (!returnAt) return null
  const returnMonday = startOfIsoWeek(returnAt)
  return addDaysISO(returnMonday, -PRE_SEASON_WEEKS_BEFORE_RETURN * 7)
}

function entretienWeekLabel(weekNumber: number): string {
  const ab = weekNumber % 2 === 1 ? 'A' : 'B'
  return `Entretien — Semaine ${ab}`
}

function inSeasonFromPreSeasonOverflow(preSeasonWeek: number): MonthWeekProjection {
  const inWn = preSeasonWeek - PRE_SEASON_WEEKS_BEFORE_RETURN
  const mesoWeek = (((inWn - 1) % 4) + 1) as 1 | 2 | 3 | 4
  return {
    cycle: 'in_season',
    weekNumber: inWn,
    isDeloadWeek: mesoWeek === 4,
  }
}

function preSeasonProjection(preSeasonWeek: number): MonthWeekProjection {
  if (preSeasonWeek > PRE_SEASON_WEEKS_BEFORE_RETURN) {
    return inSeasonFromPreSeasonOverflow(preSeasonWeek)
  }
  const phase = preSeasonPhaseFromWeekNumber(preSeasonWeek)
  return {
    cycle: 'pre_season',
    weekNumber: preSeasonWeek,
    preSeasonPhase: phase,
    isDeloadWeek: preSeasonWeek % 4 === 0 || preSeasonWeek === PRE_SEASON_WEEKS_BEFORE_RETURN,
  }
}

/**
 * @returns null si la projection linéaire ne s'applique pas (ex. déjà en saison).
 */
export function projectMonthWeekContext(
  anchorCtx: AnnualPlanningContext,
  currentMonday: string,
  weekMonday: string,
  preSeasonStartMonday: string | null,
): MonthWeekProjection | null {
  if (anchorCtx.cycle !== 'off_season' || anchorCtx.weekNumber == null) {
    return null
  }

  const projectedWn = anchorCtx.weekNumber + isoWeeksBetween(currentMonday, weekMonday)

  if (projectedWn >= 1 && projectedWn <= OFF_SEASON_STRUCTURED_WEEKS) {
    return {
      cycle: 'off_season',
      weekNumber: projectedWn,
      offSeasonPhase: offSeasonPhaseFromWeekNumber(projectedWn),
      isDeloadWeek: false,
    }
  }

  // Fin du bloc S1–S10 : au moins une semaine Entretien avant la pré-saison.
  const firstEntretienMonday = addDaysISO(
    currentMonday,
    (OFF_SEASON_STRUCTURED_WEEKS + 1 - anchorCtx.weekNumber) * 7,
  )

  if (!preSeasonStartMonday) {
    return {
      cycle: 'off_season',
      weekNumber: projectedWn,
      offSeasonPhase: 5,
      isDeloadWeek: false,
      weekLabel: entretienWeekLabel(projectedWn),
    }
  }

  const preBegin =
    preSeasonStartMonday > firstEntretienMonday
      ? preSeasonStartMonday
      : addDaysISO(firstEntretienMonday, 7)

  if (weekMonday < preBegin) {
    return {
      cycle: 'off_season',
      weekNumber: projectedWn,
      offSeasonPhase: 5,
      isDeloadWeek: false,
      weekLabel: entretienWeekLabel(projectedWn),
    }
  }

  const preSeasonWeek = isoWeeksBetween(preBegin, weekMonday) + 1
  return preSeasonProjection(preSeasonWeek)
}

export function monthProjectionToPlanningContext(
  projection: MonthWeekProjection,
): AnnualPlanningContext {
  return projection as AnnualPlanningContext
}

export function applyMonthProjectionToWeekParams<T extends { profile: UserProfile }>(
  weekParams: T,
  projection: MonthWeekProjection | null,
): T {
  if (!projection) return weekParams

  const anchors = { ...(weekParams.profile.planningAnchors ?? {}) }
  delete anchors.manualOffSeasonWeekOverride
  delete anchors.manualPreSeasonWeekOverride

  if (projection.cycle === 'off_season' && projection.weekNumber != null) {
    if (projection.offSeasonPhase === 5) {
      anchors.manualOffSeasonWeekOverride = OFF_SEASON_STRUCTURED_WEEKS
    } else if (projection.offSeasonPhase != null && projection.offSeasonPhase <= 4) {
      anchors.manualOffSeasonWeekOverride = projection.weekNumber
    }
  } else if (projection.cycle === 'pre_season' && projection.weekNumber != null) {
    anchors.manualPreSeasonWeekOverride = projection.weekNumber
    if (anchors.returnToTeamTrainingAt) {
      anchors.firstMatchDateOverride = addDaysISO(
        startOfIsoWeek(anchors.returnToTeamTrainingAt),
        7,
      )
      anchors.manualCycleOverride = 'pre_season'
    }
  } else if (projection.cycle === 'in_season' && anchors.returnToTeamTrainingAt) {
    anchors.firstMatchDateOverride = addDaysISO(
      startOfIsoWeek(anchors.returnToTeamTrainingAt),
      7,
    )
    anchors.manualCycleOverride = 'in_season'
  }

  return {
    ...weekParams,
    profile: { ...weekParams.profile, planningAnchors: anchors },
  }
}

/** Pré-saison / en saison uniquement après S10, jamais pendant l'inter-saison structurée. */
export function offSeasonWeekCompleteForPreSeason(offSeasonWeek: number): boolean {
  return offSeasonWeek > OFF_SEASON_STRUCTURED_WEEKS
}

export function resolvePreSeasonWeekFromReturn(
  preSeasonStart: Date,
  todayWeekMonday: Date,
  preSeasonMaxWeeks: number = PRE_SEASON_WEEKS_BEFORE_RETURN,
): { cycle: AnnualCycle; weekNumber: number; preSeasonPhase?: PreSeasonPhase; isDeloadWeek: boolean } {
  const rawWeek = Math.floor(wholeDaysBetween(preSeasonStart, todayWeekMonday) / 7) + 1
  if (rawWeek > preSeasonMaxWeeks) {
    const inWn = rawWeek - preSeasonMaxWeeks
    const mesoWeek = (((inWn - 1) % 4) + 1) as 1 | 2 | 3 | 4
    return { cycle: 'in_season', weekNumber: inWn, isDeloadWeek: mesoWeek === 4 }
  }
  const wn = Math.max(1, rawWeek)
  const phase = preSeasonPhaseFromWeekNumber(wn, preSeasonMaxWeeks)
  return {
    cycle: 'pre_season',
    weekNumber: wn,
    preSeasonPhase: phase,
    isDeloadWeek: wn % 4 === 0 || wn === preSeasonMaxWeeks,
  }
}

function wholeDaysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

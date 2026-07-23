import type { AthletePlanningInputs } from '../../types/annualPlanning'
import { addDaysISO, startOfIsoWeek } from '../weeklyBilan/computeWeeklyBilan'

type PlanningAnchors = NonNullable<AthletePlanningInputs['planningAnchors']>

/** Ancres qui permettent de faire avancer la semaine avec le calendrier. */
export function hasCalendarOffSeasonAnchor(
  anchors: PlanningAnchors | undefined,
): boolean {
  return Boolean(anchors?.seasonEndedAt || anchors?.offSeasonStartAt)
}

/**
 * Ancres qui imposent une progression temporelle réelle (pas un preset QA figé).
 * `returnToTeamTrainingAt` compte : la reprise club ancre la pré-saison.
 */
export function hasProgressionCalendarAnchor(
  anchors: PlanningAnchors | undefined,
): boolean {
  return (
    hasCalendarOffSeasonAnchor(anchors) || Boolean(anchors?.returnToTeamTrainingAt)
  )
}

/**
 * Override manuel de semaine (presets admin QA) — ne doit pas bloquer la progression
 * quand l'utilisateur a une ancre calendrier (fin de saison / début inter-saison / reprise).
 */
export function shouldFreezeOffSeasonWeek(
  anchors: PlanningAnchors | undefined,
): boolean {
  return (
    anchors?.manualOffSeasonWeekOverride !== undefined &&
    !hasProgressionCalendarAnchor(anchors)
  )
}

export interface SanitizePlanningAnchorsResult {
  anchors: PlanningAnchors | undefined
  /** True si un freeze QA a été converti en `offSeasonStartAt` calendaire. */
  didMigrateFrozenWeek: boolean
}

/**
 * Retire / migre les overrides de semaine figés lorsqu'une ancre de progression
 * est présente.
 *
 * Cas Hugo : `manualOffSeasonWeekOverride: 9` + `returnToTeamTrainingAt` sans
 * `offSeasonStartAt` → convertit en ancre calendaire pour que la semaine
 * courante = S(override+1) (ex. S9 figé → S10 Force-Pont), sans sauter en
 * pré-saison avant la fin du bloc S1–S10.
 */
export function sanitizePlanningAnchorsForProgression(
  anchors: PlanningAnchors | undefined,
  todayISO?: string,
): PlanningAnchors | undefined {
  return sanitizePlanningAnchorsForProgressionDetailed(anchors, todayISO).anchors
}

export function sanitizePlanningAnchorsForProgressionDetailed(
  anchors: PlanningAnchors | undefined,
  todayISO?: string,
): SanitizePlanningAnchorsResult {
  if (!anchors || !hasProgressionCalendarAnchor(anchors)) {
    return { anchors, didMigrateFrozenWeek: false }
  }

  const frozenWeek = anchors.manualOffSeasonWeekOverride
  const needsMigration =
    frozenWeek != null &&
    frozenWeek >= 1 &&
    !anchors.offSeasonStartAt &&
    !anchors.seasonEndedAt &&
    Boolean(anchors.returnToTeamTrainingAt) &&
    Boolean(todayISO)

  if (needsMigration && todayISO) {
    // Semaine courante = freeze + 1 (la semaine figée est considérée comme « terminée »).
    const currentMonday = startOfIsoWeek(todayISO)
    const offSeasonStartAt = addDaysISO(currentMonday, -frozenWeek! * 7)
    const rest = { ...anchors }
    delete rest.manualOffSeasonWeekOverride
    delete rest.manualPreSeasonWeekOverride
    return {
      anchors: { ...rest, offSeasonStartAt },
      didMigrateFrozenWeek: true,
    }
  }

  const hadFrozenOverride =
    anchors.manualOffSeasonWeekOverride !== undefined ||
    anchors.manualPreSeasonWeekOverride !== undefined
  if (!hadFrozenOverride) {
    return { anchors, didMigrateFrozenWeek: false }
  }

  const rest = { ...anchors }
  delete rest.manualOffSeasonWeekOverride
  delete rest.manualPreSeasonWeekOverride
  return { anchors: rest, didMigrateFrozenWeek: false }
}

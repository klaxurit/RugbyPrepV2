import type { AthletePlanningInputs } from '../../types/annualPlanning'

type PlanningAnchors = NonNullable<AthletePlanningInputs['planningAnchors']>

/** Ancres calendrier réelles : la semaine doit avancer avec le temps, pas rester figée. */
export function hasCalendarOffSeasonAnchor(
  anchors: PlanningAnchors | undefined,
): boolean {
  return Boolean(anchors?.seasonEndedAt || anchors?.offSeasonStartAt)
}

/**
 * Override manuel de semaine (presets admin QA) — ne doit pas bloquer la progression
 * quand l'utilisateur a une ancre calendrier (fin de saison / début inter-saison).
 */
export function shouldFreezeOffSeasonWeek(
  anchors: PlanningAnchors | undefined,
): boolean {
  return (
    anchors?.manualOffSeasonWeekOverride !== undefined &&
    !hasCalendarOffSeasonAnchor(anchors)
  )
}

/**
 * Retire les overrides de semaine figés lorsqu'une ancre calendrier est présente.
 * Évite qu'un preset admin (ex. S7 Hypertrophie) bloque indéfiniment la progression.
 */
export function sanitizePlanningAnchorsForProgression(
  anchors: PlanningAnchors | undefined,
): PlanningAnchors | undefined {
  if (!anchors || !hasCalendarOffSeasonAnchor(anchors)) return anchors

  const {
    manualOffSeasonWeekOverride: _off,
    manualPreSeasonWeekOverride: _pre,
    ...rest
  } = anchors

  if (_off === undefined && _pre === undefined) return anchors
  return rest
}

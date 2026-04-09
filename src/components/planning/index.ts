/**
 * Composants métier planning (semaine, statuts séance, dual-mode…).
 * Voir docs/ui-implementation-plan.md.
 */

export {
  SessionStatusIndicator,
  type SessionStatus,
  type SessionStatusIndicatorProps,
} from './SessionStatusIndicator'

export { SessionTypeMarker, type SessionPlanKind, type SessionTypeMarkerProps } from './SessionTypeMarker'

export { WeekPlanningLegend, type WeekPlanningLegendProps } from './WeekPlanningLegend'

export { WeekTimelineRow, type WeekTimelineRowProps } from './WeekTimelineRow'

export { PlanningContextBanner, type PlanningContextBannerTone, type PlanningContextBannerProps } from './PlanningContextBanner'
export {
  planningContextBannerCopyForMode,
  isPlanningContextBannerDuplicateOfSummary,
  resolvePlanningContextBannerModel,
} from './planningContextBannerModel'

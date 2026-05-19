import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { MatchKind, TransitionEntry, UserProfile } from '../../types/training'
import { appendTransitionEntry } from './transitionJournal'

function transitionFrom(
  ctx: AnnualPlanningContext,
  schedulingMode: 'calendar' | 'sequential',
): TransitionEntry['from'] {
  const base: TransitionEntry['from'] = {
    cycle: ctx.cycle,
    weekNumber: ctx.weekNumber ?? 1,
    schedulingMode,
  }
  if (ctx.cycle === 'off_season' && ctx.offSeasonPhase != null) {
    return { ...base, phase: ctx.offSeasonPhase }
  }
  if (ctx.cycle === 'pre_season' && ctx.preSeasonPhase != null) {
    return { ...base, phase: ctx.preSeasonPhase }
  }
  if (ctx.cycle === 'in_season' && ctx.mesocycleWeek != null) {
    return { ...base, phase: ctx.mesocycleWeek }
  }
  return base
}

/**
 * Effets profil après choix du type de match (ajout manuel).
 * À garder aligné avec les bannières Home (`match_detected_in_offseason`, playoffs).
 */
export function buildProfileUpdatesForManualMatchKind(params: {
  kind: MatchKind
  eventId: string
  profile: UserProfile
  today: string
  planningContext: AnnualPlanningContext
  schedulingMode: 'calendar' | 'sequential'
}): Partial<UserProfile> {
  const { kind, eventId, profile, today, planningContext: ctx, schedulingMode } = params
  const prevAnchors = { ...(profile.planningAnchors ?? {}) }
  const from = transitionFrom(ctx, schedulingMode)

  if (kind === 'friendly') {
    const entry: TransitionEntry = {
      id: `t-${Date.now()}`,
      at: today,
      trigger: 'match_kind_friendly',
      from,
      anchorsSnapshot: prevAnchors,
      to: ctx.cycle,
    }
    return {
      seasonTransitionState: {
        ...appendTransitionEntry(profile.seasonTransitionState, entry),
        offseasonMatchResumeAckEventId: eventId,
        activeDeferral: undefined,
      },
    }
  }

  if (kind === 'cup_final') {
    const entry: TransitionEntry = {
      id: `t-${Date.now()}`,
      at: today,
      trigger: 'match_kind_playoffs',
      from,
      anchorsSnapshot: prevAnchors,
      to: 'playoffs',
    }
    return {
      seasonMode: 'in_season',
      planningAnchors: { ...prevAnchors, manualPlayoffs: true },
      seasonTransitionState: {
        ...appendTransitionEntry(profile.seasonTransitionState, entry),
        offseasonMatchResumeAckEventId: eventId,
        activeDeferral: undefined,
      },
    }
  }

  // league — reprise compétition : enlève fin de saison / playoffs taper si besoin
  const cleanAnchors = { ...prevAnchors }
  delete cleanAnchors.manualPlayoffs

  if (ctx.cycle === 'off_season' || profile.seasonMode === 'off_season') {
    delete cleanAnchors.seasonEndedAt
    delete cleanAnchors.seasonEndedSource
    const entry: TransitionEntry = {
      id: `t-${Date.now()}`,
      at: today,
      trigger: 'match_kind_league',
      from,
      anchorsSnapshot: prevAnchors,
      to: 'pre_season',
    }
    return {
      planningAnchors: cleanAnchors,
      seasonTransitionState: {
        ...appendTransitionEntry(profile.seasonTransitionState, entry),
        offseasonMatchResumeAckEventId: eventId,
        activeDeferral: undefined,
      },
    }
  }

  const entry: TransitionEntry = {
    id: `t-${Date.now()}`,
    at: today,
    trigger: 'match_kind_league',
    from,
    anchorsSnapshot: prevAnchors,
    to: ctx.cycle === 'pre_season' ? 'pre_season' : 'in_season',
  }
  return {
    planningAnchors: cleanAnchors,
    seasonTransitionState: {
      ...appendTransitionEntry(profile.seasonTransitionState, entry),
      offseasonMatchResumeAckEventId: eventId,
      activeDeferral: undefined,
    },
  }
}

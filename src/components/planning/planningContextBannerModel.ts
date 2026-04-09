import type { WeeklyProgramSurfaceResult } from '../../services/program/resolveWeeklyProgramSurface'
import type { SchedulingMode, WeekExplanation } from '../../types/scheduling'

/** Libellés courts issus du mode déjà résolu (pas de calcul moteur). */
export function planningContextBannerCopyForMode(mode: SchedulingMode): { title: string; body: string } {
  if (mode === 'calendar') {
    return {
      title: 'Vue calendrier',
      body: 'Les séances et matchs sont positionnés sur les jours de la semaine.',
    }
  }
  return {
    title: 'Vue programme',
    body: 'Les séances sont proposées dans l’ordre du bloc actuel.',
  }
}

/** Évite un doublon avec la ligne dominante de la carte « Pourquoi ». */
export function isPlanningContextBannerDuplicateOfSummary(summaryLine: string, bannerBody: string): boolean {
  return summaryLine.trim() === bannerBody.trim()
}

/**
 * Décide si le bandeau contextuel doit s’afficher (Week / Home).
 * `suppressForTransitionBanner` : pas d’empilement avec un bandeau scheduling ou saisonnier prioritaire.
 */
export function resolvePlanningContextBannerModel(params: {
  surface: WeeklyProgramSurfaceResult | null | undefined
  explanation: WeekExplanation | null | undefined
  suppressForTransitionBanner?: boolean
}): { title: string; body: string } | null {
  const { surface, explanation, suppressForTransitionBanner = false } = params
  if (!surface || !explanation) return null
  if (suppressForTransitionBanner) return null

  const { title, body } = planningContextBannerCopyForMode(surface.schedulingMode)
  if (isPlanningContextBannerDuplicateOfSummary(explanation.summaryLine, body)) return null
  return { title, body }
}

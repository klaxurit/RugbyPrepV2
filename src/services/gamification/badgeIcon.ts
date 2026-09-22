import type { IconName } from '../../components/ui/Icon'
import type { Lang } from '../../i18n/appLabels'
import type { AthleteFormCue } from './resolveAthleteFormCue'

/**
 * Mapping badge / form cue → glyphe brand.
 *
 * Interim : SVG dans `Icon` (pas d'émoji). Les assets graphiste du brief
 * pourront remplacer ces noms sans changer les `badgeId` en base.
 */

export type BadgeIconFamily = 'plan' | 'streak' | 'deload' | 'level'

export function badgeIconFamily(badgeId: string): BadgeIconFamily {
  if (badgeId.startsWith('plan_')) return 'plan'
  if (badgeId.startsWith('streak_')) return 'streak'
  if (badgeId.startsWith('deload_')) return 'deload'
  if (badgeId.startsWith('level_')) return 'level'
  return 'plan'
}

const FAMILY_ICON: Record<BadgeIconFamily, IconName> = {
  plan: 'badge-plan',
  streak: 'badge-streak',
  deload: 'badge-deload',
  level: 'badge-level',
}

export function badgeIconName(badgeId: string): IconName {
  return FAMILY_ICON[badgeIconFamily(badgeId)]
}

export function formCueIconName(cue: AthleteFormCue): IconName {
  return cue === 'hot' ? 'form-hot' : 'form-dormant'
}

export function formCueAriaLabel(cue: AthleteFormCue, lang: Lang): string {
  if (cue === 'hot') return lang === 'fr' ? 'Enchaîne bien' : 'On a streak'
  return lang === 'fr' ? 'Peu actif récemment' : 'Quiet lately'
}

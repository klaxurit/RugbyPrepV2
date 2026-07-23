import type { Lang } from '../../i18n/appLabels'

/** Focus qualité physique dérivé de l’id mother session. */
export type SessionShareFocus =
  | 'force'
  | 'hypertrophy'
  | 'power'
  | 'bridge'
  | 'recovery'
  | 'primer'
  | 'transition'
  | 'speed'
  | 'general'

export type SessionShareBodyRegion = 'upper' | 'lower' | 'full'

export interface SessionShareIntent {
  focus: SessionShareFocus
  bodyRegion: SessionShareBodyRegion
  /** Phrase courte hors-image (félicitation + objectif). */
  congratLine: string
  /** Recap « à quoi servait la séance ». */
  purposeLine: string
}

function detectBodyRegion(idUpper: string): SessionShareBodyRegion {
  if (idUpper.includes('UPPER')) return 'upper'
  if (idUpper.includes('LOWER')) return 'lower'
  return 'full'
}

function detectFocus(idUpper: string): SessionShareFocus {
  if (idUpper.includes('FORCE_BRIDGE') || idUpper.includes('BRIDGE')) return 'bridge'
  if (idUpper.includes('HYPERTROPHY')) return 'hypertrophy'
  if (idUpper.includes('RECOVERY')) return 'recovery'
  if (idUpper.includes('TRANSITION')) return 'transition'
  if (idUpper.includes('PRIMER') || idUpper.includes('LIGHT_PRIMER')) return 'primer'
  if (idUpper.includes('SPEED')) return 'speed'
  if (idUpper.includes('POWER')) return 'power'
  if (idUpper.includes('FORCE')) return 'force'
  return 'general'
}

function bodyRegionLabel(region: SessionShareBodyRegion, lang: Lang): string {
  if (lang === 'en') {
    if (region === 'upper') return 'upper body'
    if (region === 'lower') return 'lower body'
    return 'full body'
  }
  if (region === 'upper') return 'haut du corps'
  if (region === 'lower') return 'bas du corps'
  return 'corps complet'
}

function purposeForFocus(
  focus: SessionShareFocus,
  region: SessionShareBodyRegion,
  lang: Lang,
): string {
  const zone = bodyRegionLabel(region, lang)
  if (lang === 'en') {
    switch (focus) {
      case 'force':
        return `This session builds strength for your ${zone}.`
      case 'hypertrophy':
        return `This session builds muscle size and work capacity (${zone}).`
      case 'power':
        return `This session develops power and explosiveness (${zone}).`
      case 'bridge':
        return `Strength bridge — ramping loads on your ${zone}.`
      case 'recovery':
        return `Active recovery to bounce back without losing fitness.`
      case 'primer':
        return `Light primer to wake up the system before match intensity.`
      case 'transition':
        return `Transition block — ease back into structured lifting.`
      case 'speed':
        return `Speed and intent for rugby-specific explosiveness.`
      default:
        return `Solid rugby prep session for your ${zone}.`
    }
  }
  switch (focus) {
    case 'force':
      return `Cette séance développe la force (${zone}).`
    case 'hypertrophy':
      return `Cette séance construit le volume musculaire et la capacité de travail (${zone}).`
    case 'power':
      return `Cette séance développe la puissance et l’explosivité (${zone}).`
    case 'bridge':
      return `Pont force — montée en charge sur le ${zone}.`
    case 'recovery':
      return `Récupération active pour rebondir sans perdre le niveau.`
    case 'primer':
      return `Préparation légère pour réveiller le système avant l’intensité match.`
    case 'transition':
      return `Bloc de transition — reprise progressive de la musculation structurée.`
    case 'speed':
      return `Vitesse et intention pour l’explosivité rugby.`
    default:
      return `Séance de prépa rugby solide pour le ${zone}.`
  }
}

/**
 * Intent éditorial à partir de l’id mother session (FORCE / POWER / BRIDGE…).
 */
export function buildSessionShareIntent(
  motherSessionId: string | null | undefined,
  lang: Lang,
): SessionShareIntent {
  const idUpper = (motherSessionId ?? '').toUpperCase()
  const focus = detectFocus(idUpper)
  const bodyRegion = detectBodyRegion(idUpper)
  const purposeLine = purposeForFocus(focus, bodyRegion, lang)
  const congratLine =
    lang === 'en' ? 'Nice work — session done.' : 'Bravo pour ta séance !'

  return { focus, bodyRegion, congratLine, purposeLine }
}

/**
 * Famille de contenu mother (Lower/Upper in-season).
 * Distincte du binôme planning `front_row | back_three` et des packs accent.
 */

import type { RugbyPositionGroup } from '../types/training'

export type ContentFamily =
  | 'front_row'
  | 'second_row'
  | 'back_row'
  | 'half_backs'
  | 'centers'
  | 'back_three'

/** Cluster de lanes (variantes B / Lower) partagé. */
export type ContentFamilyCluster = 'pack' | 'backs'

export const CONTENT_FAMILIES: readonly ContentFamily[] = [
  'front_row',
  'second_row',
  'back_row',
  'half_backs',
  'centers',
  'back_three',
] as const

const FAMILY_TOKEN: Record<ContentFamily, string> = {
  front_row: 'FRONT_ROW',
  second_row: 'SECOND_ROW',
  back_row: 'BACK_ROW',
  half_backs: 'HALF_BACKS',
  centers: 'CENTERS',
  back_three: 'BACK_THREE',
}

const ONBOARDING_TO_FAMILY: Record<string, ContentFamily> = {
  PROP: 'front_row',
  HOOKER: 'front_row',
  FRONT_ROW: 'front_row',
  SECOND_ROW: 'second_row',
  BACK_ROW: 'back_row',
  HALF_BACKS: 'half_backs',
  CENTERS: 'centers',
  BACK_THREE: 'back_three',
}

function normalizePositionToken(raw: string | undefined | null): string | undefined {
  if (!raw || !String(raw).trim()) return undefined
  return String(raw).trim().toUpperCase().replace(/\s+/g, '_')
}

/**
 * Résout la famille mother depuis le poste profil.
 * Fallback `back_three` si absent/inconnu (aligné planning legacy).
 */
export function resolveContentFamily(
  rugbyPosition?: RugbyPositionGroup | string | null,
  positionLegacy?: string | null,
): { family: ContentFamily; warning?: string } {
  const token =
    normalizePositionToken(rugbyPosition as string | undefined) ??
    normalizePositionToken(positionLegacy ?? undefined)

  if (!token) {
    return {
      family: 'back_three',
      warning:
        'Poste rugby non renseigné : famille back_three utilisée par défaut pour les mother sessions.',
    }
  }

  const family = ONBOARDING_TO_FAMILY[token]
  if (family) return { family }

  return {
    family: 'back_three',
    warning: `Poste « ${token} » non mappé : famille back_three utilisée par défaut.`,
  }
}

export function contentFamilyCluster(family: ContentFamily): ContentFamilyCluster {
  if (family === 'front_row' || family === 'second_row' || family === 'back_row') {
    return 'pack'
  }
  return 'backs'
}

/** Binôme planning legacy (templates fréquence / Primer / Full). */
export function contentFamilyToPositionGroup(
  family: ContentFamily,
): 'front_row' | 'back_three' {
  return contentFamilyCluster(family) === 'pack' ? 'front_row' : 'back_three'
}

export function contentFamilyToken(family: ContentFamily): string {
  return FAMILY_TOKEN[family]
}

/** Libellé joueur (FR/EN) — jamais l’id technique BACK_ROW. */
export function contentFamilyLabel(family: ContentFamily, lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    switch (family) {
      case 'front_row':
        return 'Front row'
      case 'second_row':
        return 'Second row'
      case 'back_row':
        return 'Back row'
      case 'half_backs':
        return 'Half-backs'
      case 'centers':
        return 'Centres'
      case 'back_three':
        return 'Back three'
    }
  }
  switch (family) {
    case 'front_row':
      return '1ère ligne'
    case 'second_row':
      return '2ème ligne'
    case 'back_row':
      return '3ème ligne'
    case 'half_backs':
      return 'Demis'
    case 'centers':
      return 'Centres'
    case 'back_three':
      return 'Arrières'
  }
}

/** Intent lane Upper B (sous-titre UI). */
export function upperContrastLaneLabel(
  laneToken: string | null | undefined,
  lang: 'fr' | 'en' = 'fr',
): string | null {
  if (!laneToken) return null
  const t = laneToken.toUpperCase()
  const mapFr: Record<string, string> = {
    PLYO: 'Contraste plyo poussée',
    CHESTPASS: 'Contraste projection horizontale',
    LANDMINE: 'Contraste landmine',
    SUPINE: 'Contraste throw supine',
    ROTATIONAL: 'Contraste rotation',
    PUSHPRESS: 'Contraste push press',
    BASE: 'Contraste plyo poussée',
  }
  const mapEn: Record<string, string> = {
    PLYO: 'Plyo push contrast',
    CHESTPASS: 'Horizontal projection contrast',
    LANDMINE: 'Landmine contrast',
    SUPINE: 'Supine throw contrast',
    ROTATIONAL: 'Rotational contrast',
    PUSHPRESS: 'Push-press contrast',
    BASE: 'Plyo push contrast',
  }
  const map = lang === 'en' ? mapEn : mapFr
  if (map[t]) return map[t]
  // Lane 0 IDs without suffix → base plyo / landmine selon cluster géré à l’appel
  return null
}

export function parseUpperLaneTokenFromSessionId(sessionId: string): string | null {
  const m = sessionId.match(
    /^UPPER_IN_SEASON_(?:FRONT_ROW|SECOND_ROW|BACK_ROW|HALF_BACKS|CENTERS|BACK_THREE)(?:_([A-Z]+))?_V1$/i,
  )
  if (!m) return null
  return m[1] ? m[1].toUpperCase() : 'BASE'
}

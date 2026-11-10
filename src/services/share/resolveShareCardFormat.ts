/**
 * Format d’export carte : carré 1:1 pour record / séance / match.
 * Progression reste en Story 9:16 (pas d’artboard carré).
 * Auto : carré pour record/séance, Story pour match (frise plus lisible).
 */
import type { ShareHero } from './selectShareHero'
import {
  SESSION_SHARE_HEIGHT,
  SESSION_SHARE_SQUARE_HEIGHT,
  SESSION_SHARE_WIDTH,
  type ShareCardFormat,
} from './sessionShareTypes'

export function shareCardAllowsSquare(heroKind: ShareHero['kind']): boolean {
  return heroKind === 'record' || heroKind === 'session' || heroKind === 'match'
}

/**
 * `preference` = choix UI (story/square). Absent → auto selon le héros.
 */
export function resolveShareCardFormat(
  heroKind: ShareHero['kind'],
  preference: ShareCardFormat | null | undefined = null,
): ShareCardFormat {
  if (!shareCardAllowsSquare(heroKind)) return 'story'
  if (preference === 'story' || preference === 'square') return preference
  return heroKind === 'match' ? 'story' : 'square'
}

export function shareCardDimensions(format: ShareCardFormat): {
  width: number
  height: number
} {
  return {
    width: SESSION_SHARE_WIDTH,
    height: format === 'square' ? SESSION_SHARE_SQUARE_HEIGHT : SESSION_SHARE_HEIGHT,
  }
}

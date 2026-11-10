/**
 * Format d’export carte : carré 1:1 réservé aux héros record / séance (défaut).
 * Match et progression restent en Story 9:16.
 */
import type { ShareHero } from './selectShareHero'
import {
  SESSION_SHARE_HEIGHT,
  SESSION_SHARE_SQUARE_HEIGHT,
  SESSION_SHARE_WIDTH,
  type ShareCardFormat,
} from './sessionShareTypes'

export function shareCardAllowsSquare(heroKind: ShareHero['kind']): boolean {
  return heroKind === 'record' || heroKind === 'session'
}

/**
 * `preference` = choix UI (story/square). Absent → auto :
 * square si le héros l’autorise, sinon story.
 */
export function resolveShareCardFormat(
  heroKind: ShareHero['kind'],
  preference: ShareCardFormat | null | undefined = null,
): ShareCardFormat {
  if (!shareCardAllowsSquare(heroKind)) return 'story'
  if (preference === 'story' || preference === 'square') return preference
  return 'square'
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

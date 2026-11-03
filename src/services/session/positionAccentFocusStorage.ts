/**
 * Persistance locale du micro-choix « Focus du jour » (accent poste A/B).
 * Clé = mother session + jour ISO — ne survit pas au profil cloud.
 */

import type { PositionAccentFocus } from '../equipment/positionAccentTheme'

const PREFIX = 'rp:accentFocus:'

export function positionAccentFocusStorageKey(
  motherSessionId: string,
  dayIso: string,
): string {
  return `${PREFIX}${motherSessionId}:${dayIso}`
}

export function readPositionAccentFocus(
  motherSessionId: string,
  dayIso: string,
): PositionAccentFocus {
  if (typeof localStorage === 'undefined') return 'a'
  try {
    const raw = localStorage.getItem(positionAccentFocusStorageKey(motherSessionId, dayIso))
    return raw === 'b' ? 'b' : 'a'
  } catch {
    return 'a'
  }
}

export function writePositionAccentFocus(
  motherSessionId: string,
  dayIso: string,
  focus: PositionAccentFocus,
): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(positionAccentFocusStorageKey(motherSessionId, dayIso), focus)
  } catch {
    // quota / private mode — ignore
  }
}

/**
 * OverlayGate Plan A — une seule surface bloquante à la fois.
 *
 * Aligné usage fitness (Strong / HIG) : priorité + claim/release,
 * soft (toast / nudge / update PWA) ne claim pas, se taisent si bloquant actif.
 */

export type OverlayKind =
  | 'password_upgrade'
  | 'cookie_consent'
  | 'program_evolution'
  | 'return_to_club'
  | 'founding_offer'
  | 'newsletter'
  | 'gamification_intro'
  | 'notification_opt_in'

/** Plus haut = plus prioritaire. */
export const OVERLAY_PRIORITY: Record<OverlayKind, number> = {
  password_upgrade: 100,
  cookie_consent: 95,
  program_evolution: 90,
  return_to_club: 70,
  founding_offer: 50,
  newsletter: 50,
  gamification_intro: 30,
  notification_opt_in: 30,
}

export function overlayPriority(kind: OverlayKind): number {
  return OVERLAY_PRIORITY[kind]
}

/**
 * `candidate` peut-il prendre le slot bloquant face à `active` ?
 * Même kind = déjà à nous (idempotent).
 */
export function canClaimOverlay(
  active: OverlayKind | null,
  candidate: OverlayKind,
): boolean {
  if (active == null) return true
  if (active === candidate) return true
  return overlayPriority(candidate) > overlayPriority(active)
}

/**
 * Applique un claim : retourne le nouvel actif.
 * Si refus → actif inchangé.
 */
export function applyOverlayClaim(
  active: OverlayKind | null,
  candidate: OverlayKind,
): OverlayKind | null {
  return canClaimOverlay(active, candidate) ? candidate : active
}

/**
 * Libère uniquement si `kind` détient le slot.
 */
export function applyOverlayRelease(
  active: OverlayKind | null,
  kind: OverlayKind,
): OverlayKind | null {
  return active === kind ? null : active
}

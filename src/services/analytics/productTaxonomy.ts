/**
 * Taxonomie produit stable — voir docs/product-analytics.md.
 * Helpers partagés en `.ts` (pas d’export depuis un composant .tsx).
 */

/** Jours signup → 1ʳᵉ séance pour le KPI d’activation. */
export const ACTIVATION_WINDOW_DAYS = 7

/** Bump si un event change de sémantique (pas juste une prop optionnelle). */
export const PRODUCT_ANALYTICS_SCHEMA_VERSION = 1

export const PRODUCT_CORE_EVENTS = [
  'signup_completed',
  'onboarding_step',
  'onboarding_completed',
  'session_viewed',
  'session_started',
  'session_abandoned',
  'friction_feedback',
  'session_completed',
  'first_session_completed',
] as const

export type ProductCoreEvent = (typeof PRODUCT_CORE_EVENTS)[number]

export const FRICTION_TRIGGERS = [
  'session_abandon',
  'never_trained_nudge',
  'manual',
] as const

export type FrictionTrigger = (typeof FRICTION_TRIGGERS)[number]

export const FRICTION_REASONS = [
  'too_long',
  'too_hard',
  'equipment_mismatch',
  'unclear_ui',
  'bug',
  'no_time',
  'other',
] as const

export type FrictionReason = (typeof FRICTION_REASONS)[number]

export const FRICTION_REASON_LABELS_FR: Record<FrictionReason, string> = {
  too_long: 'Trop long',
  too_hard: 'Trop dur / charge',
  equipment_mismatch: 'Pas le bon matos',
  unclear_ui: 'UI / consignes floues',
  bug: 'Bug / plantage',
  no_time: 'Pas le temps',
  other: 'Autre',
}

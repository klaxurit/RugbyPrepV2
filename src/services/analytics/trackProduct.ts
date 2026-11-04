import { posthog } from './posthog'
import {
  PRODUCT_ANALYTICS_SCHEMA_VERSION,
  type FrictionReason,
  type FrictionTrigger,
  type ProductCoreEvent,
} from './productTaxonomy'

export type ProductEventProps = Record<
  string,
  string | number | boolean | null | undefined
>

/**
 * Capture typée pour les events cœur produit.
 * Toujours safe si PostHog non initialisé / opted-out.
 */
export function trackProduct(
  event: ProductCoreEvent,
  props?: ProductEventProps,
): void {
  try {
    posthog.capture?.(event, {
      schema_version: PRODUCT_ANALYTICS_SCHEMA_VERSION,
      ...props,
    })
  } catch {
    /* analytics optional */
  }
}

export function trackFrictionFeedback(input: {
  trigger: FrictionTrigger
  reason: FrictionReason
  note?: string
  sessionIndex?: number
  sessionId?: string
}): void {
  const note =
    input.note && input.note.trim().length > 0
      ? input.note.trim().slice(0, 280)
      : undefined
  trackProduct('friction_feedback', {
    trigger: input.trigger,
    reason: input.reason,
    ...(note ? { note } : {}),
    ...(input.sessionIndex != null ? { index: input.sessionIndex } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
  })
}

/** Props personne stables pour filtrer replays / cohorts PostHog. */
export function syncProductPersonProperties(input: {
  onboardingComplete?: boolean
  trainingLevel?: string | null
  weeklySessions?: number | null
  equipmentBucket?: string | null
}): void {
  try {
    const props: Record<string, string | number | boolean> = {
      analytics_schema_version: PRODUCT_ANALYTICS_SCHEMA_VERSION,
    }
    if (input.onboardingComplete != null) {
      props.onboarding_complete = input.onboardingComplete
    }
    if (input.trainingLevel) props.training_level = input.trainingLevel
    if (input.weeklySessions != null) props.weekly_sessions = input.weeklySessions
    if (input.equipmentBucket) props.equipment_bucket = input.equipmentBucket
    posthog.setPersonProperties?.(props)
  } catch {
    /* ignore */
  }
}

export function equipmentBucketFromProfile(
  equipment: unknown,
): 'gym_leaning' | 'bw_leaning' | 'mixed' | 'unknown' {
  if (equipment == null) return 'unknown'
  const text = typeof equipment === 'string' ? equipment : JSON.stringify(equipment)
  if (/barbell|rack|dumbbell/i.test(text)) return 'gym_leaning'
  if (text === '[]' || text === 'null' || /bodyweight/i.test(text)) return 'bw_leaning'
  return 'mixed'
}

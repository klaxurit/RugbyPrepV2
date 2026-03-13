import type {
  HealthConsentAuditEvent,
  HealthConsentSource,
  HealthConsentStatus,
  UserProfile,
} from '../../types/training'

interface ApplyHealthConsentLifecycleInput {
  current: UserProfile
  patch: Partial<UserProfile>
  source?: HealthConsentSource
  now?: string
}

const CONSENT_AUDIT_LIMIT = 50

const isMinorProfile = (
  ageBand: UserProfile['ageBand'] | undefined,
  populationSegment: UserProfile['populationSegment'] | undefined
): boolean => {
  if (ageBand === 'u18') return true
  return populationSegment === 'u18_female' || populationSegment === 'u18_male'
}

const inferStatus = (profile: UserProfile): HealthConsentStatus => {
  if (!isMinorProfile(profile.ageBand, profile.populationSegment)) {
    return 'not_required'
  }
  if (profile.parentalConsentHealthData === true) return 'granted'
  if (profile.parentalConsentHealthData === false) return 'revoked'
  return 'unknown'
}

const appendAuditEvent = (
  trail: UserProfile['healthConsentAuditTrail'],
  event: HealthConsentAuditEvent
): HealthConsentAuditEvent[] => {
  const next = [...(trail ?? []), event]
  if (next.length <= CONSENT_AUDIT_LIMIT) return next
  return next.slice(next.length - CONSENT_AUDIT_LIMIT)
}

export const applyHealthConsentLifecycle = ({
  current,
  patch,
  source = 'profile',
  now = new Date().toISOString(),
}: ApplyHealthConsentLifecycleInput): UserProfile => {
  const next: UserProfile = { ...current, ...patch }
  const previousStatus = inferStatus(current)
  const minor = isMinorProfile(next.ageBand, next.populationSegment)

  let nextStatus: HealthConsentStatus
  if (!minor) {
    nextStatus = 'not_required'
    next.parentalConsentHealthData = false
    next.healthConsentGrantedAt = undefined
    next.healthConsentRevokedAt = undefined
    next.healthDataRetentionState = 'active'
  } else if (next.parentalConsentHealthData === true) {
    nextStatus = 'granted'
    next.healthConsentGrantedAt = next.healthConsentGrantedAt ?? now
    next.healthConsentRevokedAt = undefined
    next.healthDataRetentionState = 'active'
  } else if (next.parentalConsentHealthData === false) {
    nextStatus = 'revoked'
    next.healthConsentRevokedAt = now
    next.healthDataRetentionState = 'pending_purge'
    // Minimize retained health data when consent is revoked.
    next.rehabInjury = undefined
    next.injuries = []
    next.cycleTrackingOptIn = false
    next.cycleSymptomScoreToday = undefined
    next.weeklyLoadContext = undefined
    next.preventionSessionsWeek = undefined
  } else {
    nextStatus = 'unknown'
    next.parentalConsentHealthData = false
    next.healthConsentGrantedAt = undefined
    next.healthConsentRevokedAt = undefined
    next.healthDataRetentionState = 'active'
  }

  next.healthConsentStatus = nextStatus
  next.healthConsentSource = source

  const shouldAudit =
    nextStatus !== previousStatus ||
    (patch.parentalConsentHealthData !== undefined &&
      patch.parentalConsentHealthData !== current.parentalConsentHealthData)

  if (shouldAudit) {
    next.healthConsentAuditTrail = appendAuditEvent(next.healthConsentAuditTrail, {
      at: now,
      action: nextStatus,
      source,
      actor: 'user',
    })
  }

  return next
}


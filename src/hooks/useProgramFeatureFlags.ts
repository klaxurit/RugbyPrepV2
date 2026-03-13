import { useMemo } from 'react'
import type { ProgramFeatureFlags } from '../services/program/policies/featureFlags'
import { resolveProgramFeatureFlags } from '../services/program/policies/featureFlags'
import { posthog } from '../services/analytics/posthog'
import { useAuth } from './useAuth'

type RolloutSource = 'forced' | 'remote+hash' | 'local-hash'

export interface ProgramFeatureRollout {
  enabled: boolean
  source: RolloutSource
  canaryPercent: number
  bucket: number
}

interface ResolveCanaryProgramFlagsInput {
  userId: string
  canaryPercent?: number
  forceMode?: string
  remoteEnabled?: boolean | null
}

const V2_CANARY_FLAGS: Partial<ProgramFeatureFlags> = {
  populationProfileV1: true,
  u18HardCapsV1: true,
  microcycleArchetypesV2: true,
  sessionIdentityV2: true,
  qualityGatesV2: true,
  qualityScorecardV2: true,
  enforceMatchProximityGateV2: true,
}

const clampPercent = (value?: number): number => {
  if (!Number.isFinite(value)) return 10
  return Math.max(0, Math.min(100, Math.round(value!)))
}

const toForceMode = (value?: string): boolean | null => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (['on', '1', 'true', 'enabled', 'force_on'].includes(normalized)) return true
  if (['off', '0', 'false', 'disabled', 'force_off'].includes(normalized)) return false
  return null
}

const fnv1a = (value: string): number => {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

const bucketFromUserId = (userId: string): number => fnv1a(userId) % 100

export const resolveCanaryProgramFlags = (
  input: ResolveCanaryProgramFlagsInput
): {
  featureFlags: ProgramFeatureFlags
  rollout: ProgramFeatureRollout
} => {
  const canaryPercent = clampPercent(input.canaryPercent)
  const bucket = bucketFromUserId(input.userId)
  const hashEligible = bucket < canaryPercent
  const forced = toForceMode(input.forceMode)

  let enabled = hashEligible
  let source: RolloutSource = 'local-hash'

  if (forced !== null) {
    enabled = forced
    source = 'forced'
  } else if (input.remoteEnabled !== null && input.remoteEnabled !== undefined) {
    enabled = input.remoteEnabled && hashEligible
    source = 'remote+hash'
  }

  const featureFlags = enabled
    ? resolveProgramFeatureFlags(V2_CANARY_FLAGS)
    : resolveProgramFeatureFlags()

  return {
    featureFlags,
    rollout: {
      enabled,
      source,
      canaryPercent,
      bucket,
    },
  }
}

const parseRemoteFlagValue = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'on', 'enabled', 'v2'].includes(normalized)) return true
    if (['0', 'false', 'off', 'disabled'].includes(normalized)) return false
  }
  return null
}

export const useProgramFeatureFlags = (): {
  featureFlags: ProgramFeatureFlags
  rollout: ProgramFeatureRollout
} => {
  const { authState } = useAuth()

  return useMemo(() => {
    const userId =
      authState.status === 'authenticated' && authState.user?.id
        ? authState.user.id
        : 'anonymous'

    const canaryPercent = Number(import.meta.env.VITE_PROGRAM_V2_CANARY_PERCENT ?? '10')
    const forceMode = import.meta.env.VITE_PROGRAM_V2_FORCE as string | undefined
    const remoteKey = (import.meta.env.VITE_POSTHOG_PROGRAM_V2_FLAG_KEY as string | undefined) ?? 'program_engine_v2'

    let remoteEnabled: boolean | null = null
    if (remoteKey) {
      remoteEnabled = parseRemoteFlagValue(posthog.getFeatureFlag?.(remoteKey))
      if (remoteEnabled === null) {
        remoteEnabled = parseRemoteFlagValue(posthog.isFeatureEnabled?.(remoteKey))
      }
    }

    return resolveCanaryProgramFlags({
      userId,
      canaryPercent,
      forceMode,
      remoteEnabled,
    })
  }, [authState.status, authState.user?.id])
}


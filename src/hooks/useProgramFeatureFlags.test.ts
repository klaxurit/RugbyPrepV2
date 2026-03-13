import { describe, expect, it } from 'vitest'
import { resolveCanaryProgramFlags } from './useProgramFeatureFlags'

describe('resolveCanaryProgramFlags', () => {
  it('forces V2 flags when force mode is on', () => {
    const result = resolveCanaryProgramFlags({
      userId: 'u-1',
      canaryPercent: 10,
      forceMode: 'on',
      remoteEnabled: false,
    })

    expect(result.rollout.enabled).toBe(true)
    expect(result.rollout.source).toBe('forced')
    expect(result.featureFlags.microcycleArchetypesV2).toBe(true)
    expect(result.featureFlags.qualityGatesV2).toBe(true)
  })

  it('uses remote + hash when remote flag is available', () => {
    const enabled = resolveCanaryProgramFlags({
      userId: 'u-1',
      canaryPercent: 100,
      remoteEnabled: true,
    })
    const disabled = resolveCanaryProgramFlags({
      userId: 'u-1',
      canaryPercent: 100,
      remoteEnabled: false,
    })

    expect(enabled.rollout.source).toBe('remote+hash')
    expect(enabled.rollout.enabled).toBe(true)
    expect(disabled.rollout.source).toBe('remote+hash')
    expect(disabled.rollout.enabled).toBe(false)
    expect(disabled.featureFlags.microcycleArchetypesV2).toBe(false)
  })

  it('falls back to deterministic local hash split when remote is missing', () => {
    const off = resolveCanaryProgramFlags({
      userId: 'u-1',
      canaryPercent: 0,
      remoteEnabled: null,
    })
    const on = resolveCanaryProgramFlags({
      userId: 'u-1',
      canaryPercent: 100,
      remoteEnabled: null,
    })

    expect(off.rollout.source).toBe('local-hash')
    expect(off.rollout.enabled).toBe(false)
    expect(on.rollout.source).toBe('local-hash')
    expect(on.rollout.enabled).toBe(true)
  })
})


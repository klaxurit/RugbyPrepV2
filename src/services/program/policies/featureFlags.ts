export interface ProgramFeatureFlags {
  populationProfileV1: boolean
  safetyContractsV1: boolean
  u18HardCapsV1: boolean
  microcycleArchetypesV2: boolean
  sessionIdentityV2: boolean
  qualityGatesV2: boolean
  qualityScorecardV2: boolean
  enforceMatchProximityGateV2: boolean
}

// H4: populationProfileV1 & u18HardCapsV1 enabled by default for safety.
// U18 hard caps must always be evaluated — legal/safety requirement.
export const DEFAULT_PROGRAM_FEATURE_FLAGS: ProgramFeatureFlags = {
  populationProfileV1: true,
  safetyContractsV1: true,
  u18HardCapsV1: true,
  microcycleArchetypesV2: false,
  sessionIdentityV2: false,
  qualityGatesV2: false,
  qualityScorecardV2: false,
  enforceMatchProximityGateV2: false,
}

export const resolveProgramFeatureFlags = (
  overrides?: Partial<ProgramFeatureFlags>
): ProgramFeatureFlags => ({
  ...DEFAULT_PROGRAM_FEATURE_FLAGS,
  ...overrides,
})

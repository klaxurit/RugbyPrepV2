# Level Modifiers Technical Schema

This document translates the level-modifier product model into an app-ready technical schema.

Goal:
- keep one shared annual training library
- store a richer level profile than the current `trainingLevel` label
- apply level modifiers after mother-session selection
- stay compatible with the current profile model and legacy program engine during migration

Important:
- this document defines the **runtime integration model**
- it does **not** replace the coach-authored mother sessions
- it does **not** require parallel `Starter` / `Builder` / `Performance` session libraries

---

## 1. Scope

This schema covers:
- onboarding scoring output
- persisted level-modifier profile
- runtime transformation pipeline
- integration points with annual planning and mother-session resolution
- migration from the current `trainingLevel` / `level` fields

This schema does **not** cover:
- equipment substitution implementation details
- injury substitution implementation details
- UI copy for the onboarding flow
- legacy recipe/block engine redesign

---

## 2. Core Integration Principle

The engine should work in this order:

1. normalize the athlete profile
2. resolve annual context
3. resolve weekly template
4. resolve base mother sessions
5. build or load the level-modifier profile
6. apply level modifiers to each resolved mother session
7. apply equipment substitutions
8. apply injury substitutions
9. apply weekly fatigue / slot overrides
10. map the adapted result to UI-ready session data

Important:
- mother-session selection stays **phase-first**
- level modifiers do **not** decide which mother session is selected
- level modifiers only adapt the selected session safely

This stays aligned with:
- [LEVEL_MODIFIERS_FRAMEWORK.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LEVEL_MODIFIERS_FRAMEWORK.md)
- [LEVEL_ONBOARDING_SCORECARD.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LEVEL_ONBOARDING_SCORECARD.md)
- [LEVEL_MODIFIERS_MAPPING_TABLE.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LEVEL_MODIFIERS_MAPPING_TABLE.md)

---

## 3. Current System Constraints

Today the codebase already has:
- `UserProfile.trainingLevel?: 'starter' | 'builder' | 'performance'`
- legacy `UserProfile.level?: 'beginner' | 'intermediate'`
- annual planning inputs built through [buildAthletePlanningInputs.ts](/Users/junca/Projets/RugbyPrepV2/src/services/annualPlanning/buildAthletePlanningInputs.ts)
- weekly mother-session resolution through [resolveMotherSessionsForWeek.ts](/Users/junca/Projets/RugbyPrepV2/src/services/motherSession/resolveMotherSessionsForWeek.ts)
- legacy block filtering through [selectEligibleBlocks.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/selectEligibleBlocks.ts)

Important constraint:
- the current `trainingLevel` is only a **single visible label**
- the new model needs a **richer internal profile**
- the old field should remain temporarily for backward compatibility

---

## 4. Proposed Runtime Model

### 4.1 Primary product rule

Persist:
- one visible label for UX
- one granular modifier profile for runtime behavior

Do **not** persist:
- a separate full program library per level

### 4.2 V1 scored vs derived axes

Scored at onboarding:
1. `exercise_complexity`
2. `volume_tolerance`
3. `explosive_readiness`

Derived in engine:
4. `intensity_tolerance`
5. `optional_block_tolerance`

---

## 5. TypeScript Data Model

### 5.1 Shared states

```ts
export type LevelAxisState = 'starter' | 'builder' | 'performance'

export type LevelPrimaryAxis =
  | 'exercise_complexity'
  | 'volume_tolerance'
  | 'explosive_readiness'

export type LevelDerivedAxis =
  | 'intensity_tolerance'
  | 'optional_block_tolerance'

export type LevelAxisName = LevelPrimaryAxis | LevelDerivedAxis

export type LevelVisibleLabel = 'starter' | 'builder' | 'performance'
```

### 5.2 Raw onboarding answer set

This object is an onboarding-flow artifact.
It can be kept in UI state and does not need to be permanently persisted in V1.

```ts
export interface LevelOnboardingAnswersV1 {
  trainingAge: 1 | 2 | 3
  patternConfidence: 1 | 2 | 3
  recentConsistency: 1 | 2 | 3
  recoveryCapacity: 1 | 2 | 3
  explosiveExposure: 1 | 2 | 3
  currentPain: 1 | 2 | 3
}
```

### 5.3 Axis score

```ts
export interface LevelAxisScore {
  average: 1 | 1.5 | 2 | 2.5 | 3
  state: LevelAxisState
  source: 'onboarding' | 'derived' | 'usage_refined'
}
```

### 5.4 Safety caps

```ts
export type LevelSafetyCapCode =
  | 'pain_caps_explosive'
  | 'true_beginner_caps_complexity'
  | 'inconsistent_recovery_caps_volume'

export interface LevelSafetyCap {
  code: LevelSafetyCapCode
  appliedTo: LevelAxisName[]
  note: string
}
```

### 5.5 Persisted modifier profile

This is the main object the engine should consume.

```ts
export interface LevelModifierProfileV1 {
  schemaVersion: 'v1'
  visibleLabel: LevelVisibleLabel
  axes: {
    exerciseComplexity: LevelAxisScore
    volumeTolerance: LevelAxisScore
    explosiveReadiness: LevelAxisScore
    intensityTolerance: LevelAxisScore
    optionalBlockTolerance: LevelAxisScore
  }
  safetyCaps: LevelSafetyCap[]
  source: 'onboarding_only' | 'onboarding_plus_usage'
  scoredAt: string
  lastRefinedAt?: string
}
```

### 5.6 User profile extension

Recommended addition to [training.ts](/Users/junca/Projets/RugbyPrepV2/src/types/training.ts):

```ts
export interface UserProfile {
  // existing fields...
  trainingLevel?: TrainingLevel
  levelModifierProfile?: LevelModifierProfileV1
}
```

Important:
- `trainingLevel` remains the visible and compatibility field
- `levelModifierProfile.visibleLabel` becomes the source of truth
- `trainingLevel` should mirror `levelModifierProfile.visibleLabel`

---

## 6. Persistence Strategy

### 6.1 V1 recommendation

Persist:
- `training_level` as today
- one JSON field for the modifier profile

Recommended profile row addition:

```ts
type ProfileRow = {
  // existing fields...
  training_level: string | null
  level_modifier_profile: LevelModifierProfileV1 | null
}
```

### 6.2 Why JSON is correct here

The level profile is:
- nested
- versioned
- still likely to evolve

A JSON field avoids:
- premature column explosion
- brittle migrations for every axis tweak

### 6.3 Raw answer storage

V1 recommendation:
- do **not** persist the raw 6 onboarding answers in the main profile row
- persist only the derived `LevelModifierProfileV1`

Reason:
- less privacy sensitivity
- smaller payload
- cleaner migration path

If raw answers are ever needed later:
- store them in a separate analytics or assessment event table
- not in the main user profile object

---

## 7. Scoring Service Boundary

Create a dedicated service layer, separate from mother-session parsing.

Recommended folder:
- `src/services/levelModifiers/`

Recommended files:
- `scoreOnboardingLevelProfile.ts`
- `deriveLevelModifierProfile.ts`
- `applyLevelModifiersToMotherSession.ts`
- `levelModifierTypes.ts`
- `levelModifierRules.ts`

### 7.1 Scoring function

```ts
export interface ScoreOnboardingLevelProfileResult {
  profile: LevelModifierProfileV1
  visibleLabel: LevelVisibleLabel
}

export function scoreOnboardingLevelProfile(
  answers: LevelOnboardingAnswersV1,
  nowIso: string
): ScoreOnboardingLevelProfileResult
```

Responsibilities:
- compute 3 primary averages
- band each axis
- apply safety caps
- derive the 2 secondary axes
- derive the visible label from the lowest scored primary axis

### 7.2 Compatibility helper

For legacy users with no modifier profile yet:

```ts
export function inferLevelModifierProfileFromLegacyTrainingLevel(
  trainingLevel: TrainingLevel | undefined,
  nowIso: string
): LevelModifierProfileV1
```

Default inference:
- `starter` -> all axes `starter`
- `builder` -> all axes `builder`
- `performance` -> all axes `performance`

This is intentionally coarse and temporary.

---

## 8. Mother-Session Adaptation Model

The app should not mutate the stored mother session.
It should build an adapted runtime view.

### 8.1 Adaptation result

```ts
export interface AdaptedMotherSession {
  baseSessionId: string
  visibleLabel: LevelVisibleLabel
  appliedOperations: LevelAdaptationOperation[]
  session: MotherSession
}
```

### 8.2 Operation model

Avoid a fully open-ended DSL in V1.
Use a short list of typed operations.

```ts
export type LevelAdaptationOperation =
  | {
      kind: 'replace_exercise'
      reason: 'complexity' | 'explosive'
      matchNames: string[]
      replaceWith: string[]
    }
  | {
      kind: 'reduce_block_rounds'
      reason: 'volume'
      blockNumber: number
      delta: number
      floor: number
    }
  | {
      kind: 'drop_optional_blocks'
      reason: 'optional_block_tolerance'
    }
  | {
      kind: 'cap_total_blocks'
      reason: 'volume'
      maxBlocks: number
    }
  | {
      kind: 'downgrade_explosive_block'
      reason: 'explosive'
      blockNumber: number
      replacementCue: string
    }
  | {
      kind: 'append_coaching_note'
      reason: 'complexity' | 'volume' | 'explosive'
      note: string
    }
```

This gives:
- deterministic behavior
- auditability
- easy testability

---

## 9. Adaptation Pipeline

### 9.1 Source selection

Use the existing annual resolver stack:

1. [buildAthletePlanningInputs.ts](/Users/junca/Projets/RugbyPrepV2/src/services/annualPlanning/buildAthletePlanningInputs.ts)
2. [resolveMotherSessionsForWeek.ts](/Users/junca/Projets/RugbyPrepV2/src/services/motherSession/resolveMotherSessionsForWeek.ts)

At this stage the app has:
- cycle
- phase or match context
- frequency
- position group
- resolved mother sessions

### 9.2 Adaptation order per session

For each resolved session slot:

1. read `session.metadata.sessionType`
2. read current cycle context:
   - off-season phase
   - pre-season phase
   - in-season match context
3. load `LevelModifierProfileV1`
4. compute applicable operations from the mapping table
5. apply level operations
6. apply equipment substitutions
7. apply injury substitutions
8. apply slot overrides:
   - `variant`
   - `maxBlocks`
   - late-week light behavior

### 9.3 Why level modifiers come before substitutions

Because:
- level modifiers define the intended difficulty
- equipment and injuries adapt that intended version to real constraints

Example:
- first downgrade `Neutral-Grip Pull-Up` to `Lat Pulldown` because of complexity
- then, if no pulley exists, equipment logic chooses the next fallback

---

## 10. Mapping Engine Design

### 10.1 Inputs

```ts
export interface LevelMappingContext {
  cycle: 'off_season' | 'pre_season' | 'in_season'
  sessionType: MotherSession['metadata']['sessionType']
  visibleLabel: LevelVisibleLabel
  axes: LevelModifierProfileV1['axes']
  offSeasonPhase?: 1 | 2 | 3 | 4
  preSeasonPhase?: 1 | 2 | 3
  matchContext?: 'match_week' | 'no_match_week'
}
```

### 10.2 Output

```ts
export interface LevelAdaptationPlan {
  operations: LevelAdaptationOperation[]
}
```

### 10.3 Rule source

The logic source remains:
- [LEVEL_MODIFIERS_MAPPING_TABLE.md](/Users/junca/Projets/RugbyPrepV2/docs/training/mother-sessions/LEVEL_MODIFIERS_MAPPING_TABLE.md)

But runtime should use:
- a typed TS configuration object
- not ad hoc string parsing of the Markdown file

Recommended implementation:
- encode a V1 ruleset in `src/services/levelModifiers/levelModifierRules.ts`
- keep the Markdown file as human-readable source of truth
- manually sync until the rule set stabilizes

---

## 11. Integration with Existing Profile Logic

### 11.1 `normalizeProfileInput`

Current file:
- [normalizeProfile.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/policies/normalizeProfile.ts)

Recommended update:
- if `profile.levelModifierProfile` exists:
  - trust `visibleLabel`
  - mirror it to `trainingLevel`
- else:
  - keep current fallback behavior

Additional rule:
- `starter` visible label can still clamp default weekly frequency to `2`
- do **not** use `leagueLevel` to infer training level

### 11.2 `useProfile`

Current file:
- [useProfile.ts](/Users/junca/Projets/RugbyPrepV2/src/hooks/useProfile.ts)

Recommended update:
- map `level_modifier_profile` row field into `UserProfile.levelModifierProfile`
- when persisting:
  - write both `training_level`
  - and `level_modifier_profile`

### 11.3 Legacy `level`

Current legacy field:
- `level: 'beginner' | 'intermediate'`

Recommendation:
- keep temporarily for backward compatibility
- stop using it as a decision input for new mother-session logic
- treat it as a migration artifact only

---

## 12. Integration with Current Program Engine

There are now effectively two engines:

1. legacy recipe/block engine
   - [buildWeekProgram.ts](/Users/junca/Projets/RugbyPrepV2/src/services/program/buildWeekProgram.ts)
2. mother-session annual engine
   - [resolveMotherSessionsForWeek.ts](/Users/junca/Projets/RugbyPrepV2/src/services/motherSession/resolveMotherSessionsForWeek.ts)

### V1 recommendation

Implement level modifiers first on the **mother-session path** only.

Reason:
- that is where the new annual training system lives
- retrofitting the same richness into the legacy block engine would slow delivery significantly

### Legacy coexistence rule

Until migration is complete:
- legacy engine continues to use `trainingLevel`
- mother-session engine uses `levelModifierProfile` first, then falls back to `trainingLevel`

This avoids a forced big-bang rewrite.

---

## 13. Suggested Service Graph

```ts
useProfile
  -> UserProfile.trainingLevel
  -> UserProfile.levelModifierProfile

onboarding submit
  -> scoreOnboardingLevelProfile()
  -> persist profile.trainingLevel
  -> persist profile.levelModifierProfile

weekly planning flow
  -> buildAthletePlanningInputs()
  -> resolveMotherSessionsForWeek()
  -> adaptResolvedMotherSessionsForLevel()
  -> applyEquipmentSubstitutions()
  -> applyInjurySubstitutions()
  -> build UI session DTO
```

Recommended orchestrator:

```ts
export function adaptResolvedMotherSessionsForLevel(
  result: ResolveMotherSessionsForWeekResult,
  profile: UserProfile
): AdaptedMotherSession[]
```

---

## 14. Migration Plan

### Phase 1 — Data model and onboarding

- add `levelModifierProfile` to `UserProfile`
- add profile-row persistence field
- build onboarding scoring service
- mirror `visibleLabel` to `trainingLevel`

### Phase 2 — Read-only runtime integration

- load modifier profile in the mother-session flow
- compute adaptation plans
- log applied operations for debugging
- do not yet rewrite UI rendering deeply

### Phase 3 — Session rendering integration

- render adapted session blocks instead of raw base mother sessions
- expose adaptation notes in the UI where useful

### Phase 4 — Legacy convergence

- gradually reduce dependency on legacy `level`
- keep `trainingLevel` only as a visible summary field

---

## 15. Testing Strategy

### Unit tests

- onboarding scorecard scoring
- safety caps
- derived-axis computation
- visible label derivation

### Contract tests

- legacy profile without modifier profile -> safe fallback
- profile with modifier profile -> `trainingLevel` mirror stays coherent

### Adaptation tests

- `starter` lower session trims support volume before anchor
- `starter` explosive profile removes aggressive plyo exposure
- `builder` preserves anchor and only trims density when needed
- `performance` returns session unchanged

### Integration tests

- annual resolver + modifier adapter across:
  - off-season
  - pre-season
  - in-season
- 2x / 3x / 4x frequency scenarios
- front_row / back_three coverage

---

## 16. Open Decisions Kept Explicitly Out of V1

These should stay out of the first implementation:
- automatic promotion/demotion from usage every week
- database persistence of raw onboarding answers
- a generic rule DSL editable by non-dev users
- deep modifier logic for the legacy block engine
- position-specific level scoring at onboarding

Keeping them out protects:
- delivery speed
- explainability
- maintenance cost

---

## 17. Recommended V1 Verdict

The correct V1 architecture is:
- one annual mother-session library
- one persisted `LevelModifierProfileV1`
- one visible `trainingLevel` label kept for compatibility
- one deterministic adaptation layer applied **after** mother-session selection

That gives RugbyPrep:
- safe onboarding
- gradual progression
- no duplication of authored sessions
- a migration path that does not require rewriting the whole engine at once

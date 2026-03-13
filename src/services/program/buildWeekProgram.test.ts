import { describe, expect, it } from 'vitest'
import { buildWeekProgram } from './buildWeekProgram'
import { createProfile, SIMULATION_PROFILES } from './testHelpers'
import { validateSession } from './validateSession'

describe('buildWeekProgram', () => {
  it('TID-ENG-001 falls back to starter recipes and starter blocks for legacy profiles without trainingLevel', () => {
    const legacyProfile = createProfile({
      trainingLevel: undefined,
      weeklySessions: 2,
      equipment: ['dumbbell', 'band', 'bench', 'pullup_bar'],
    })

    const result = buildWeekProgram(legacyProfile, 'W1')

    expect(result.sessions.map((session) => session.recipeId)).toEqual([
      'LOWER_STARTER_V1',
      'UPPER_STARTER_V1',
    ])

    const LEVEL_EXEMPT_INTENTS = new Set(['warmup', 'cooldown', 'mobility'])
    for (const session of result.sessions) {
      for (const builtBlock of session.blocks) {
        if (!LEVEL_EXEMPT_INTENTS.has(builtBlock.block.intent)) {
          expect(builtBlock.block.tags).toContain('starter')
        }
      }
      expect(validateSession(session).isValid).toBe(true)
    }
  })

  it('TID-ENG-002 keeps upper rehab phase 1 sessions valid when prehab falls back to core', () => {
    const rehabProfile = createProfile({
      injuries: ['shoulder_pain'],
      rehabInjury: {
        zone: 'upper',
        phase: 1,
        startDate: '2026-03-01',
        phaseStartDate: '2026-03-01',
        type: 'shoulder_pain',
      },
    })

    const result = buildWeekProgram(rehabProfile, 'W1')
    const rehabSession = result.sessions.find((session) => session.recipeId === 'REHAB_UPPER_P1_V1')

    expect(rehabSession).toBeTruthy()
    expect(validateSession(rehabSession!).isValid).toBe(true)

    const finisherCount = rehabSession!.blocks.filter(
      (builtBlock) =>
        builtBlock.block.intent === 'neck' ||
        builtBlock.block.intent === 'core' ||
        builtBlock.block.intent === 'carry'
    ).length

    expect(finisherCount).toBeLessThanOrEqual(1)
  })

  it('TID-ENG-003 replaces the last session with recovery mobility in ACWR danger and keeps it valid', () => {
    const result = buildWeekProgram(createProfile(), 'W1', {
      fatigueLevel: 'danger',
      hasSufficientACWRData: true,
    })

    expect(result.sessions.map((session) => session.recipeId)).toEqual([
      'LOWER_V1',
      'UPPER_V1',
      'RECOVERY_MOBILITY_V1',
    ])
    expect(result.warnings).toContain('ACWR surcharge : dernière séance remplacée par mobilité.')
    expect(validateSession(result.sessions[2]!).isValid).toBe(true)
  })

  it('TID-ENG-004 reduces the week to one session in ACWR critical', () => {
    const result = buildWeekProgram(createProfile(), 'W1', {
      fatigueLevel: 'critical',
      hasSufficientACWRData: true,
    })

    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0]?.recipeId).toBe('LOWER_V1')
    expect(result.warnings).toContain('ACWR critique : programme réduit à 1 séance. Récupération prioritaire.')
  })

  it('TID-ENG-005 keeps main work blocks stable across weeks, rotates finishers only', () => {
    // KB strength-methods.md §7.1: neural adaptations need 4+ weeks on same movement.
    // KB §8.2: double progression = same exercise, increase reps then load across weeks.
    // Main work intents (neural, contrast, force) must stay FIXED within a cycle.
    // Only finishers (neck, core, carry) rotate by week index for variety.
    const weekOne = buildWeekProgram(createProfile(), 'W1')
    const weekTwo = buildWeekProgram(createProfile(), 'W2')
    const upperWeekOne = weekOne.sessions.find((session) => session.recipeId === 'UPPER_V1')
    const upperWeekTwo = weekTwo.sessions.find((session) => session.recipeId === 'UPPER_V1')

    expect(upperWeekOne).toBeTruthy()
    expect(upperWeekTwo).toBeTruthy()

    // Main work blocks must be identical between W1 and W2
    const MAIN_INTENTS = new Set(['activation', 'neural', 'contrast', 'force', 'hypertrophy'])
    const mainIds = (session: NonNullable<typeof upperWeekOne>) =>
      session.blocks
        .filter((builtBlock) => MAIN_INTENTS.has(builtBlock.block.intent))
        .map((builtBlock) => builtBlock.block.blockId)

    expect(mainIds(upperWeekOne!)).toEqual(mainIds(upperWeekTwo!))

    // Finishers should rotate for variety (at least one differs between weeks)
    const FINISHER_INTENTS = new Set(['neck', 'core', 'carry'])
    const finisherIds = (session: NonNullable<typeof upperWeekOne>) =>
      session.blocks
        .filter((builtBlock) => FINISHER_INTENTS.has(builtBlock.block.intent))
        .map((builtBlock) => builtBlock.block.blockId)

    const f1 = finisherIds(upperWeekOne!)
    const f2 = finisherIds(upperWeekTwo!)
    // With multiple candidates for finisher intents, rotation should produce variation
    if (f1.length > 0 && f2.length > 0) {
      expect(f1).not.toEqual(f2)
    }
  })

  it('TID-ENG-006 H3: warmup is mandatory on all non-mobility/non-rehab-P1 sessions', () => {
    // H3: KB injury-prevention.md §9 — warmup reduces injuries 20-50% (Emery 2015, evidence A)
    const builderProfile = createProfile({
      trainingLevel: 'builder',
      weeklySessions: 2,
    })

    const result = buildWeekProgram(builderProfile, 'W1')

    for (const session of result.sessions) {
      const hasWarmup = session.blocks.some(
        (builtBlock) => builtBlock.block.intent === 'warmup'
      )
      // Builder sessions now include warmup (H3 change)
      expect(hasWarmup).toBe(true)
      expect(validateSession(session).isValid).toBe(true)
    }
  })

  it('TID-ENG-007 attaches session identity and archetype metadata when V2 flags are enabled', () => {
    const result = buildWeekProgram(createProfile(), 'W1', {
      featureFlags: {
        microcycleArchetypesV2: true,
        sessionIdentityV2: true,
      },
    })

    expect(result.selectedArchetypeId).toBe('IN_SEASON_3X_STD')
    expect(result.sessions).toHaveLength(3)
    expect(result.sessions.every((session) => session.identity)).toBe(true)
  })

  it('TID-ENG-008 S4 no longer degrades with quality gates (VC-02 activation blocks fix)', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.S4!, 'W1', {
      featureFlags: {
        microcycleArchetypesV2: true,
        sessionIdentityV2: true,
        qualityGatesV2: true,
      },
    })

    // VC-02: new starter activation blocks (bird dog + glute bridge) fill the previously empty slot
    expect(result.sessions).toHaveLength(2)
    expect(result.qualityGateEvents.filter((e) => e.startsWith('quality:missing-required-slot'))).toHaveLength(0)
  })

  it('TID-ENG-009 computes a scorecard when quality scorecard flag is enabled', () => {
    const result = buildWeekProgram(createProfile(), 'W1', {
      featureFlags: {
        microcycleArchetypesV2: true,
        sessionIdentityV2: true,
        qualityGatesV2: true,
        qualityScorecardV2: true,
      },
    })

    expect(result.qualityScorecard).toBeTruthy()
    expect(result.qualityScorecard?.overall).toBeGreaterThanOrEqual(0)
    expect(result.qualityScorecard?.overall).toBeLessThanOrEqual(100)
  })

  it('TID-ENG-010 generates balanced full-body major blocks (upper + lower)', () => {
    const result = buildWeekProgram(createProfile(), 'W1')
    const fullSession = result.sessions.find((session) => session.recipeId === 'FULL_V1')

    expect(fullSession).toBeTruthy()
    const majorBlocks = fullSession!.blocks.filter((builtBlock) =>
      ['neural', 'force', 'contrast', 'hypertrophy'].includes(builtBlock.block.intent)
    )
    const hasUpperMajor = majorBlocks.some(
      (builtBlock) =>
        builtBlock.block.tags.includes('upper') || builtBlock.block.tags.includes('full')
    )
    const hasLowerMajor = majorBlocks.some(
      (builtBlock) =>
        builtBlock.block.tags.includes('lower') || builtBlock.block.tags.includes('full')
    )

    expect(hasUpperMajor).toBe(true)
    expect(hasLowerMajor).toBe(true)
  })

  it('TID-ENG-011 routes pre-season performance speed focus to speed field session', () => {
    const result = buildWeekProgram(
      createProfile({
        trainingLevel: 'performance',
        seasonMode: 'pre_season',
        weeklySessions: 3,
        performanceFocus: 'speed',
      }),
      'W1'
    )

    expect(result.sessions.map((session) => session.recipeId)).toEqual([
      'LOWER_V1',
      'UPPER_V1',
      'SPEED_FIELD_PRE_V1',
    ])
  })

  it('TID-ENG-012 never routes speed field in-season even when speed focus is selected', () => {
    const result = buildWeekProgram(
      createProfile({
        trainingLevel: 'performance',
        seasonMode: 'in_season',
        weeklySessions: 3,
        performanceFocus: 'speed',
      }),
      'W1'
    )

    expect(result.sessions.some((session) => session.recipeId === 'SPEED_FIELD_PRE_V1')).toBe(false)
  })

  it('TID-ENG-013 satisfies upper/lower blueprint quality contracts on nominal in-season profile', () => {
    const result = buildWeekProgram(createProfile(), 'W1', {
      featureFlags: {
        qualityGatesV2: true,
      },
    })

    expect(
      result.qualityGateEvents.some((event) =>
        event.startsWith('quality:upper-push-pull-imbalance') ||
        event.startsWith('quality:lower-pattern-redundancy') ||
        event.startsWith('quality:upper-missing-major') ||
        event.startsWith('quality:lower-missing-major')
      )
    ).toBe(false)
  })

  // ── DUP (Daily Undulating Periodization) — KB periodization.md §2.2 ──

  it('TID-ENG-014 in-season performance 3x applies DUP: sessions have distinct training qualities', () => {
    const result = buildWeekProgram(createProfile({
      trainingLevel: 'performance',
      seasonMode: 'in_season',
      weeklySessions: 3,
    }), 'W1')

    expect(result.sessions).toHaveLength(3)

    // Under DUP, each session should favour different block types:
    // Session 0 (LOWER): force phase → force/contrast blocks preferred
    // Session 1 (UPPER): power phase → neural/contrast/speed blocks preferred
    // Session 2 (FULL):  hypertrophy phase → volume blocks preferred
    const lowerSession = result.sessions[0]!
    const upperSession = result.sessions[1]!
    const fullSession = result.sessions[2]!

    expect(lowerSession.recipeId).toBe('LOWER_V1')
    expect(upperSession.recipeId).toBe('UPPER_V1')
    expect(fullSession.recipeId).toBe('FULL_V1')

    // Verify sessions have intensity markers aligned with DUP
    expect(lowerSession.intensity).toBe('heavy')
    expect(upperSession.intensity).toBe('medium')
    expect(fullSession.intensity).toBe('light')
  })

  it('TID-ENG-015 in-season performance 2x applies DUP: force + power sessions', () => {
    const result = buildWeekProgram(createProfile({
      trainingLevel: 'performance',
      seasonMode: 'in_season',
      weeklySessions: 2,
    }), 'W1')

    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0]!.recipeId).toBe('LOWER_V1')
    expect(result.sessions[1]!.recipeId).toBe('UPPER_V1')
    expect(result.sessions[0]!.intensity).toBe('heavy')
    expect(result.sessions[1]!.intensity).toBe('medium')
  })

  it('TID-ENG-016 off-season performance always routes hypertrophy recipes (block periodization)', () => {
    // Off-season performance: always hypertrophy-focused per KB §4.2
    // getPerformanceRecipeIds overrides to HYPER + COND_OFF for off_season
    const h1 = buildWeekProgram(createProfile({
      trainingLevel: 'performance',
      seasonMode: 'off_season',
      weeklySessions: 3,
    }), 'H1')

    const w1 = buildWeekProgram(createProfile({
      trainingLevel: 'performance',
      seasonMode: 'off_season',
      weeklySessions: 3,
    }), 'W1')

    // Both H1 and W1 use hypertrophy recipes in off-season (seasonMode overrides week phase)
    expect(h1.sessions.map(s => s.recipeId)).toEqual(['LOWER_HYPER_V1', 'UPPER_HYPER_V1', 'COND_OFF_V1'])
    expect(w1.sessions.map(s => s.recipeId)).toEqual(['LOWER_HYPER_V1', 'UPPER_HYPER_V1', 'COND_OFF_V1'])
  })

  it('TID-ENG-017 builder never gets DUP (consistent moderate load per KB)', () => {
    const result = buildWeekProgram(createProfile({
      trainingLevel: 'builder',
      seasonMode: 'in_season',
      weeklySessions: 2,
    }), 'W1')

    // Builder always uses builder recipes regardless of seasonMode
    expect(result.sessions.map(s => s.recipeId)).toEqual(['LOWER_BUILDER_V1', 'UPPER_BUILDER_V1'])
    // Intensity should be medium/light, not heavy
    expect(result.sessions[0]!.intensity).toBe('medium')
  })
})

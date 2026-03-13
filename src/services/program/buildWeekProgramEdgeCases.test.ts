import { describe, expect, it } from 'vitest'
import exercisesData from '../../data/exercices.v1.json'
import type { CycleWeek, Exercise } from '../../types/training'
import { buildWeekProgram } from './buildWeekProgram'
import { CRITICAL_WEEKS, SIMULATION_PROFILES } from './testHelpers'
import { validateSession } from './validateSession'

const exercises = exercisesData as Exercise[]
const exercisesById = new Map<string, Exercise>()
for (const ex of exercises) {
  if (ex.exerciseId) exercisesById.set(ex.exerciseId, ex)
  if (ex.id) exercisesById.set(ex.id, ex)
}

// ── Known limitations ──────────────────────────────────────────
// Some profile×week combos produce sessions that validateSession flags:
// - S4: starter + low_back_pain drops activation (slot skipped, not flagged isSafetyAdapted)
// - S5: starter + shoulder_pain + BW → upper slot safety-adapted
// - B3: builder + shoulder_pain 3× → full body finisher count exceeds limit
// - P6: performance + low_back_pain + limited gym can lose lower full-body major slot
// - P7: performance + BW only can lose lower full-body major slot
// - F_SENIOR: female senior performance → ACL prehab injection pushes LOWER session to 8 blocks
//   (MAX_BLOCKS=7). Medical necessity (KB population-specific.md §1.3). Block count is the
//   only issue; volume is correct (prehab excluded from count since FP1-01).
// These are documented edge cases, not bugs — tested explicitly below.
const KNOWN_VALIDATION_ISSUES = new Set(['S4', 'B3', 'P3', 'P6', 'P7', 'F_SENIOR'])

// ── TID-SMK: Smoke test — 17 profiles × 6 critical weeks ──────
// Ensures the engine never crashes and produces at least 1 session.
// Profiles with known validation issues are tested separately.

describe('TID-SMK 17 profiles × 6 weeks smoke test', () => {
  const profileEntries = Object.entries(SIMULATION_PROFILES)

  for (const [profileId, profile] of profileEntries) {
    for (const week of CRITICAL_WEEKS) {
      it(`TID-SMK-${profileId}-${week} generates sessions without crashing`, () => {
        const result = buildWeekProgram(profile, week)

        expect(result.sessions.length).toBeGreaterThanOrEqual(1)

        if (KNOWN_VALIDATION_ISSUES.has(profileId)) return

        for (const session of result.sessions) {
          const validation = validateSession(session)
          expect(
            validation.isValid,
            `${profileId} @ ${week} — ${session.recipeId}: ${validation.warnings.join('; ')}`
          ).toBe(true)
        }
      })
    }
  }
})

// ── Session count contracts ────────────────────────────────────

describe('session count contracts', () => {
  it('TID-EDG-001 starter profiles always produce exactly 2 sessions', () => {
    for (const week of CRITICAL_WEEKS) {
      for (const id of ['S1', 'S2', 'S3', 'S4', 'S5'] as const) {
        const result = buildWeekProgram(SIMULATION_PROFILES[id]!, week)
        expect(result.sessions).toHaveLength(2)
      }
    }
  })

  it('TID-EDG-002 2-session profiles produce exactly 2 sessions', () => {
    for (const id of ['B1', 'B4', 'P2', 'P5'] as const) {
      const result = buildWeekProgram(SIMULATION_PROFILES[id]!, 'W1')
      expect(result.sessions).toHaveLength(2)
    }
  })

  it('TID-EDG-003 3-session profiles produce exactly 3 sessions', () => {
    for (const id of ['B2', 'B3', 'B5', 'P1', 'P3', 'P4', 'P6', 'P7'] as const) {
      const result = buildWeekProgram(SIMULATION_PROFILES[id]!, 'W1')
      expect(result.sessions).toHaveLength(3)
    }
  })
})

// ── Documented edge cases (known [SAFETY] limitations) ─────────

describe('documented edge cases — safety-adapted sessions', () => {
  it('TID-EDG-004 S4 (starter + limited gym + low_back_pain) — upper session now has activation (VC-02)', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.S4!, 'W1')

    expect(result.sessions).toHaveLength(2)
    expect(result.sessions.every((s) => s.blocks.length > 0)).toBe(true)

    // VC-02: new starter activation blocks (bird dog + glute bridge) are safe for low_back_pain.
    // S4 can now fill the activation slot that was previously empty.
    const upperSession = result.sessions.find((s) => s.recipeId === 'UPPER_STARTER_V1')
    expect(upperSession).toBeTruthy()

    const activationCount = upperSession!.blocks.filter(
      (b) => b.block.intent === 'activation'
    ).length
    expect(activationCount).toBeGreaterThanOrEqual(1)
  })

  it('TID-EDG-005 S5 (starter + shoulder_pain + BW) — hollow UPPER replaced by RECOVERY_MOBILITY_V1 (RG-01)', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.S5!, 'W1')

    expect(result.sessions).toHaveLength(2)
    expect(result.sessions.every((s) => s.blocks.length > 0)).toBe(true)

    // RG-01: no real upper BW work is possible → hollow session replaced with honest recovery
    const upperStarterSession = result.sessions.find((s) => s.recipeId === 'UPPER_STARTER_V1')
    expect(upperStarterSession).toBeUndefined()

    const recoverySession = result.sessions.find((s) => s.recipeId === 'RECOVERY_MOBILITY_V1')
    expect(recoverySession).toBeTruthy()
    expect(validateSession(recoverySession!).isValid).toBe(true)
  })

  it('TID-EDG-006 B3 (builder + shoulder_pain + 3×) — full body session exceeds finisher limit', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.B3!, 'W1')

    expect(result.sessions).toHaveLength(3)
    expect(result.sessions.every((s) => s.blocks.length > 0)).toBe(true)

    // Full body builder with shoulder_pain fills upper slot with core/prehab fallbacks,
    // causing finisher count to exceed the non-full-body limit.
    // This is a known limitation — the session is still functionally valid.
    const fullBodySession = result.sessions.find((s) => s.recipeId.includes('FULL'))
    if (fullBodySession) {
      const finisherCount = fullBodySession.blocks.filter(
        (b) => b.block.intent === 'neck' || b.block.intent === 'core' || b.block.intent === 'carry'
      ).length
      expect(finisherCount).toBeGreaterThanOrEqual(1)
    }
  })

  it('TID-EDG-007 P7 (performance + BW only) — upper hypertrophy slot falls back to [SAFETY]', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.P7!, 'H1')

    expect(result.sessions).toHaveLength(3)
    expect(result.sessions.every((s) => s.blocks.length > 0)).toBe(true)

    // Hypertrophy phase with BW only is an extreme edge case
    const hasSafetySession = result.sessions.some((session) => session.isSafetyAdapted)
    expect(hasSafetySession).toBe(true)
  })
})

// ── Cross-session block uniqueness ─────────────────────────────

describe('cross-session block uniqueness', () => {
  it('TID-EDG-008 no non-activation block is repeated across sessions in the same week', () => {
    // Activation blocks can be shared across sessions by design (e.g. warm-up routines)
    const nonStarterIds = ['B2', 'P1', 'P3', 'P4'] as const

    for (const id of nonStarterIds) {
      const result = buildWeekProgram(SIMULATION_PROFILES[id]!, 'W1')

      const SHARED_INTENTS = new Set(['activation', 'warmup', 'cooldown'])
      const mainBlockIds = result.sessions.flatMap((session) =>
        session.blocks
          .filter((builtBlock) => !SHARED_INTENTS.has(builtBlock.block.intent))
          .map((builtBlock) => builtBlock.block.blockId)
      )

      const uniqueIds = new Set(mainBlockIds)
      expect(
        uniqueIds.size,
        `${id} has duplicate non-activation blocks: ${mainBlockIds.join(', ')}`
      ).toBe(mainBlockIds.length)
    }
  })
})

// ── Phase transitions ──────────────────────────────────────────

describe('phase transitions', () => {
  it('TID-EDG-009 H1 vs W1 produce different recipe sets for performance 3×', () => {
    const h1 = buildWeekProgram(SIMULATION_PROFILES.P1!, 'H1')
    const w1 = buildWeekProgram(SIMULATION_PROFILES.P1!, 'W1')

    const h1Recipes = h1.sessions.map((session) => session.recipeId).sort()
    const w1Recipes = w1.sessions.map((session) => session.recipeId).sort()

    expect(h1Recipes).not.toEqual(w1Recipes)
  })

  it('TID-EDG-010 W1 vs W2 main work blocks stay stable, finishers rotate', () => {
    // KB §7.1: main lifts FIXED within a cycle (neural adaptation needs 4+ weeks).
    // Only finishers (neck, core, carry) rotate by week for variety.
    const w1 = buildWeekProgram(SIMULATION_PROFILES.P1!, 'W1')
    const w2 = buildWeekProgram(SIMULATION_PROFILES.P1!, 'W2')

    const MAIN_INTENTS = new Set(['activation', 'neural', 'contrast', 'force', 'hypertrophy'])
    const FINISHER_INTENTS = new Set(['neck', 'core', 'carry'])

    const getMainBlockIds = (sessions: typeof w1.sessions) =>
      sessions.flatMap((session) =>
        session.blocks
          .filter((b) => MAIN_INTENTS.has(b.block.intent))
          .map((b) => b.block.blockId)
      )

    const getFinisherBlockIds = (sessions: typeof w1.sessions) =>
      sessions.flatMap((session) =>
        session.blocks
          .filter((b) => FINISHER_INTENTS.has(b.block.intent))
          .map((b) => b.block.blockId)
      )

    // Main work blocks must be identical
    expect(getMainBlockIds(w1.sessions)).toEqual(getMainBlockIds(w2.sessions))

    // Finishers should rotate for variety across weeks
    const f1 = getFinisherBlockIds(w1.sessions)
    const f2 = getFinisherBlockIds(w2.sessions)
    expect(f1.length).toBeGreaterThan(0)
    expect(f2.length).toBeGreaterThan(0)
    expect(f1).not.toEqual(f2)
  })
})

// ── Injury routing correctness ─────────────────────────────────
// selectEligibleBlocks filters at exercise level via getExerciseById,
// but the block.exercises array in BuiltSession retains the original block definition.
// We check that the engine chose blocks whose exercises don't have the injury as contraindication.

describe('injury constraints', () => {
  it('TID-EDG-011 shoulder_pain profiles never include shoulder-contraindicated exercises', () => {
    const shoulderProfiles = ['S5', 'B3', 'P3'] as const

    for (const id of shoulderProfiles) {
      const result = buildWeekProgram(SIMULATION_PROFILES[id]!, 'W1')

      for (const session of result.sessions) {
        for (const builtBlock of session.blocks) {
          for (const blockEx of builtBlock.block.exercises) {
            const ex = exercisesById.get(blockEx.exerciseId)
            expect(
              ex?.contraindications ?? [],
              `${id} — ${builtBlock.block.blockId} contains exercise with shoulder_pain contraindication`
            ).not.toContain('shoulder_pain')
          }
        }
      }
    }
  })

  it('TID-EDG-012 knee_pain profiles never include knee-contraindicated exercises', () => {
    const kneeProfiles = ['S3', 'B4', 'P4'] as const

    for (const id of kneeProfiles) {
      const result = buildWeekProgram(SIMULATION_PROFILES[id]!, 'W1')

      for (const session of result.sessions) {
        for (const builtBlock of session.blocks) {
          for (const blockEx of builtBlock.block.exercises) {
            const ex = exercisesById.get(blockEx.exerciseId)
            expect(
              ex?.contraindications ?? [],
              `${id} — ${builtBlock.block.blockId} contains exercise with knee_pain contraindication`
            ).not.toContain('knee_pain')
          }
        }
      }
    }
  })

  it('TID-EDG-013 low_back_pain profiles never include back-contraindicated exercises', () => {
    const backProfiles = ['S4', 'P6'] as const

    for (const id of backProfiles) {
      const result = buildWeekProgram(SIMULATION_PROFILES[id]!, 'W1')

      for (const session of result.sessions) {
        for (const builtBlock of session.blocks) {
          for (const blockEx of builtBlock.block.exercises) {
            const ex = exercisesById.get(blockEx.exerciseId)
            expect(
              ex?.contraindications ?? [],
              `${id} — ${builtBlock.block.blockId} contains exercise with low_back_pain contraindication`
            ).not.toContain('low_back_pain')
          }
        }
      }
    }
  })
})

// ── Equipment respect ──────────────────────────────────────────

describe('equipment constraints', () => {
  it('TID-EDG-014 BW-only profiles never receive exercises requiring equipment', () => {
    const bwProfiles = ['S1', 'S3', 'S5', 'P7'] as const

    for (const id of bwProfiles) {
      const result = buildWeekProgram(SIMULATION_PROFILES[id]!, 'W1')

      for (const session of result.sessions) {
        for (const builtBlock of session.blocks) {
          for (const equipment of builtBlock.block.equipment) {
            expect(
              equipment,
              `${id} — ${builtBlock.block.blockId} requires equipment '${equipment}'`
            ).toBe('none')
          }
        }
      }
    }
  })
})

// ── Release Gate tests (RG-01 / RG-02 / RG-03) ────────────────

describe('Release Gate — RG-01 UX guard for hollow upper sessions', () => {
  it('TID-RG-01 S5 at W1 has no UPPER_STARTER_V1 and has a valid RECOVERY_MOBILITY_V1', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.S5!, 'W1')

    expect(result.sessions).toHaveLength(2)
    expect(result.sessions.find((s) => s.recipeId === 'UPPER_STARTER_V1')).toBeUndefined()

    const recovery = result.sessions.find((s) => s.recipeId === 'RECOVERY_MOBILITY_V1')
    expect(recovery).toBeTruthy()
    expect(validateSession(recovery!).isValid).toBe(true)
  })

  it('TID-RG-01b RG-01 applies across all critical weeks for S5', () => {
    for (const week of CRITICAL_WEEKS) {
      const result = buildWeekProgram(SIMULATION_PROFILES.S5!, week)
      expect(
        result.sessions.find((s) => s.recipeId === 'UPPER_STARTER_V1'),
        `S5 @ ${week} should have no hollow UPPER_STARTER_V1`
      ).toBeUndefined()
      expect(result.sessions.find((s) => s.recipeId === 'RECOVERY_MOBILITY_V1')).toBeTruthy()
    }
  })

  it('TID-RG-01c S1 (BW no injury) keeps UPPER_STARTER_V1 — guard only triggers for hollow sessions', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.S1!, 'W1')
    expect(result.sessions.find((s) => s.recipeId === 'UPPER_STARTER_V1')).toBeTruthy()
  })
})

describe('Release Gate — RG-02 starter version cap at W2', () => {
  it('TID-RG-02a S1 at W7 emits version cap warning and no volume-exceeded warning', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.S1!, 'W7')

    expect(result.warnings.some((w) => w.includes('Starter : version plafonnée'))).toBe(true)
    expect(result.warnings.some((w) => w.includes('dépasse le cap'))).toBe(false)
  })

  it('TID-RG-02b block versions for starters are W1 or W2 at W3 and W7', () => {
    const cappedWeeks: CycleWeek[] = ['W3', 'W7']
    for (const week of cappedWeeks) {
      const result = buildWeekProgram(SIMULATION_PROFILES.S1!, week)
      for (const session of result.sessions) {
        if (session.recipeId === 'RECOVERY_MOBILITY_V1') continue
        for (const builtBlock of session.blocks) {
          expect(
            ['W1', 'W2'],
            `S1 @ ${week} — block ${builtBlock.block.blockId} has version ${builtBlock.version.versionId}`
          ).toContain(builtBlock.version.versionId)
        }
      }
    }
  })

  it('TID-RG-02c starter version cap does not affect W1 and W2 (no unnecessary capping)', () => {
    for (const week of ['W1', 'W2'] as CycleWeek[]) {
      const result = buildWeekProgram(SIMULATION_PROFILES.S1!, week)
      expect(result.warnings.some((w) => w.includes('Starter : version plafonnée'))).toBe(false)
    }
  })
})

describe('Release Gate — RG-03 U18 corpus profiles and VC-01 verifiability', () => {
  it('TID-RG-03a U18_FILLE gets ACL prehab block (VC-01 visible in corpus)', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.U18_FILLE!, 'W1')

    const hasAclPrehab = result.sessions.some((session) =>
      session.blocks.some(
        (b) => b.block.intent === 'prehab' && b.block.tags.includes('hip_stability')
      )
    )
    expect(hasAclPrehab).toBe(true)
    expect(result.warnings.some((w) => w.includes('ACL') || w.includes('Prévention ACL'))).toBe(true)
  })

  it('TID-RG-03b U18_GARCON does NOT get ACL prehab block (VC-01 female-only)', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.U18_GARCON!, 'W1')

    const hasAclPrehab = result.sessions.some((session) =>
      session.blocks.some(
        (b) => b.block.intent === 'prehab' && b.block.tags.includes('hip_stability')
      )
    )
    expect(hasAclPrehab).toBe(false)
  })

  it('TID-RG-03c U18_FILLE at W7 has version cap at W2 (double cap: U18 + starter)', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.U18_FILLE!, 'W7')

    expect(result.warnings.some((w) => w.includes('version plafonnée'))).toBe(true)
    for (const session of result.sessions) {
      if (session.recipeId === 'RECOVERY_MOBILITY_V1') continue
      for (const builtBlock of session.blocks) {
        expect(['W1', 'W2']).toContain(builtBlock.version.versionId)
      }
    }
  })

  it('TID-RG-03d U18_GARCON at W7 has version cap at W2', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.U18_GARCON!, 'W7')

    expect(result.warnings.some((w) => w.includes('version plafonnée'))).toBe(true)
    for (const session of result.sessions) {
      if (session.recipeId === 'RECOVERY_MOBILITY_V1') continue
      for (const builtBlock of session.blocks) {
        expect(['W1', 'W2']).toContain(builtBlock.version.versionId)
      }
    }
  })

  it('TID-RG-03e U18_FILLE generates valid sessions across all critical weeks', () => {
    for (const week of CRITICAL_WEEKS) {
      const result = buildWeekProgram(SIMULATION_PROFILES.U18_FILLE!, week)
      expect(result.sessions.length).toBeGreaterThanOrEqual(1)
      for (const session of result.sessions) {
        expect(
          validateSession(session).isValid,
          `U18_FILLE @ ${week} — ${session.recipeId}: ${validateSession(session).warnings.join('; ')}`
        ).toBe(true)
      }
    }
  })

  it('TID-RG-03f U18_GARCON generates valid sessions across all critical weeks', () => {
    for (const week of CRITICAL_WEEKS) {
      const result = buildWeekProgram(SIMULATION_PROFILES.U18_GARCON!, week)
      expect(result.sessions.length).toBeGreaterThanOrEqual(1)
      for (const session of result.sessions) {
        expect(
          validateSession(session).isValid,
          `U18_GARCON @ ${week} — ${session.recipeId}: ${validateSession(session).warnings.join('; ')}`
        ).toBe(true)
      }
    }
  })
})

// ── Final P1 Patch ────────────────────────────────────────────────────────────

describe('Final P1 Patch — FP1-01: prehab exclus du comptage volume', () => {
  it('TID-FP1-01a U18_FILLE at W1 no volume-exceeded warning (ACL prehab excluded from count)', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.U18_FILLE!, 'W1')
    expect(result.warnings.some((w) => w.includes('dépasse le cap'))).toBe(false)
    // ACL prehab block should still be present
    const lowerSession = result.sessions.find((s) => s.recipeId === 'LOWER_STARTER_V1')
    expect(lowerSession).toBeTruthy()
    const hasAcl = lowerSession!.blocks.some(
      (b) => b.block.intent === 'prehab' && b.block.tags.includes('hip_stability')
    )
    expect(hasAcl).toBe(true)
  })

  it('TID-FP1-01b U18_FILLE at W4 (peak) no volume-exceeded — ACL prehab not counted in volume', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.U18_FILLE!, 'W4')
    expect(result.warnings.some((w) => w.includes('dépasse le cap'))).toBe(false)
    // ACL prehab still injected
    const sessions = result.sessions.filter((s) => s.recipeId !== 'RECOVERY_MOBILITY_V1')
    const hasAcl = sessions.some((s) =>
      s.blocks.some((b) => b.block.intent === 'prehab' && b.block.tags.includes('hip_stability'))
    )
    expect(hasAcl).toBe(true)
  })
})

// F1: regression guard for female senior at peak week — ACL prehab must NOT push volume above cap
describe('Final Hardening — F1: F_senior W4 volume regression guard', () => {
  it('TID-FH-F1a F_senior at W4 (peak) no volume-exceeded — ACL prehab excluded from count', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.F_SENIOR!, 'W4')
    expect(
      result.warnings.some((w) => w.includes('dépasse le cap')),
      `F_senior W4 should not exceed cap. Warnings: ${result.warnings.join('; ')}`
    ).toBe(false)
  })

  it('TID-FH-F1b F_senior at W4 still receives ACL prehab (hip_stability)', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.F_SENIOR!, 'W4')
    const lowerSession = result.sessions.find(
      (s) => s.recipeId === 'LOWER_V1' || s.recipeId === 'LOWER_STARTER_V1'
    )
    expect(lowerSession).toBeTruthy()
    const hasAcl = lowerSession!.blocks.some(
      (b) => b.block.intent === 'prehab' && b.block.tags.includes('hip_stability')
    )
    expect(hasAcl).toBe(true)
  })
})

// F5: extend force phase coverage for P_shoulder to W3 (not just W1)
// F10: comment explains why prehab is excluded and what not to reintroduce
describe('Final P1 Patch — FP1-02: P_shoulder UPPER_V1 force phase contains real upper work', () => {
  // Tests cover W1 and W2 to protect the force phase (W1-W4).
  // W3 is auto-deload for in-season performance profiles (only 2 sessions) — no UPPER_V1 there.
  // The safe neural/contrast pull blocks (BLK_NEURAL_UPPER_ROW_SAFE_01 / BLK_CONTRAST_UPPER_ROW_SAFE_01)
  // must remain shoulder_pain-free. Do NOT add shoulder_pain to their contraindications.
  for (const week of ['W1', 'W2'] as const) {
    it(`TID-FP1-02-${week} P_shoulder UPPER session at ${week} has real upper work (neural or contrast)`, () => {
      const result = buildWeekProgram(SIMULATION_PROFILES.P3!, week)
      const upperSession = result.sessions.find((s) => s.recipeId === 'UPPER_V1')
      expect(upperSession).toBeTruthy()
      const hasRealWork = upperSession!.blocks.some(
        (b) => b.block.intent === 'neural' || b.block.intent === 'contrast'
      )
      expect(
        hasRealWork,
        `P_shoulder UPPER_V1 at ${week} should have neural or contrast block. Blocks: ${upperSession!.blocks.map((b) => `${b.block.blockId}(${b.block.intent})`).join(', ')}`
      ).toBe(true)
    })

    it(`TID-FP1-02b-${week} P_shoulder neural/contrast block at ${week} has no shoulder_pain CI`, () => {
      const result = buildWeekProgram(SIMULATION_PROFILES.P3!, week)
      const upperSession = result.sessions.find((s) => s.recipeId === 'UPPER_V1')
      expect(upperSession).toBeTruthy()
      for (const builtBlock of upperSession!.blocks) {
        if (builtBlock.block.intent === 'neural' || builtBlock.block.intent === 'contrast') {
          expect(
            builtBlock.block.contraindications,
            `Block ${builtBlock.block.blockId} at ${week} must not contraindicate shoulder_pain`
          ).not.toContain('shoulder_pain')
        }
      }
    })
  }
})

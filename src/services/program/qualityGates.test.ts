import { describe, expect, it } from 'vitest'
import type { BuiltSession } from './buildSessionFromRecipe'
import { createProfile } from './testHelpers'
import { evaluateQualityGates } from './qualityGates'

const makeSession = (overrides?: Partial<BuiltSession>): BuiltSession => ({
  recipeId: 'LOWER_V1',
  title: 'Lower',
  week: 'W1',
  intensity: 'heavy',
  blocks: [],
  warnings: [],
  ...overrides,
})

describe('qualityGates', () => {
  it('flags sessions with missing required intents as invalid', () => {
    const session = makeSession({
      warnings: ["Missing required intent 'activation'."],
    })

    const result = evaluateQualityGates(createProfile(), [session])

    expect(result.invalidSessionIndexes).toEqual([0])
    expect(result.events).toContain('quality:missing-required-slot:LOWER_V1:0')
  })

  it('flags rehab + critical fatigue when no rehab session is present', () => {
    const profile = createProfile({
      rehabInjury: {
        zone: 'lower',
        phase: 3,
        startDate: '2026-03-01',
        phaseStartDate: '2026-03-01',
      },
    })
    const session = makeSession({ recipeId: 'UPPER_V1' })

    const result = evaluateQualityGates(profile, [session], { fatigueLevel: 'critical' })

    expect(result.events).toContain('quality:critical-rehab-missing')
    expect(result.invalidSessionIndexes).toEqual([0])
  })

  it('enforces no heavy session on MD-1 when match proximity gate is enabled', () => {
    const session = makeSession({
      identity: {
        archetypeId: 'IN_SEASON_3X_STD',
        sessionRole: 'upper_strength',
        sessionIntensity: 'heavy',
        matchDayOffset: 'MD-1',
        objectiveLabel: 'Upper',
        whyTodayLabel: 'Test',
      },
    })

    const result = evaluateQualityGates(createProfile(), [session], {
      enforceMatchProximity: true,
    })

    expect(result.events).toContain('quality:heavy-on-md1:LOWER_V1:0')
    expect(result.invalidSessionIndexes).toEqual([0])
  })

  it('reports starter session count mismatches', () => {
    const starter = createProfile({ trainingLevel: 'starter', weeklySessions: 2 })
    const sessions = [makeSession(), makeSession(), makeSession()]

    const result = evaluateQualityGates(starter, sessions)

    expect(result.events).toContain('quality:starter-session-count-mismatch')
  })

  it('flags full-body sessions that miss lower major stimulus', () => {
    const session = makeSession({
      recipeId: 'FULL_V1',
      blocks: [
        {
          block: {
            blockId: 'NEURAL_UPPER',
            name: 'Neural upper',
            intent: 'neural',
            tags: ['upper', 'neural'],
            equipment: ['none'],
            contraindications: [],
            exercises: [],
            versions: [],
            coachingNotes: '',
          },
          version: {
            versionId: 'W1',
            sets: 3,
            scheme: { kind: 'reps', reps: '3' },
            restSeconds: 90,
          },
        },
        {
          block: {
            blockId: 'FORCE_UPPER',
            name: 'Force upper',
            intent: 'force',
            tags: ['upper', 'force'],
            equipment: ['none'],
            contraindications: [],
            exercises: [],
            versions: [],
            coachingNotes: '',
          },
          version: {
            versionId: 'W1',
            sets: 3,
            scheme: { kind: 'reps', reps: '5' },
            restSeconds: 120,
          },
        },
      ],
    })

    const result = evaluateQualityGates(createProfile(), [session])

    expect(result.events).toContain('quality:full-body-imbalance:FULL_V1:0')
    expect(result.invalidSessionIndexes).toContain(0)
  })

  it('flags upper-only carry redundancy on imbalanced full-body sessions', () => {
    const session = makeSession({
      recipeId: 'FULL_V1',
      blocks: [
        {
          block: {
            blockId: 'NEURAL_UPPER',
            name: 'Neural upper',
            intent: 'neural',
            tags: ['upper', 'neural'],
            equipment: ['none'],
            contraindications: [],
            exercises: [],
            versions: [],
            coachingNotes: '',
          },
          version: {
            versionId: 'W1',
            sets: 3,
            scheme: { kind: 'reps', reps: '3' },
            restSeconds: 90,
          },
        },
        {
          block: {
            blockId: 'FORCE_UPPER',
            name: 'Force upper',
            intent: 'force',
            tags: ['upper', 'force'],
            equipment: ['none'],
            contraindications: [],
            exercises: [],
            versions: [],
            coachingNotes: '',
          },
          version: {
            versionId: 'W1',
            sets: 3,
            scheme: { kind: 'reps', reps: '5' },
            restSeconds: 120,
          },
        },
        {
          block: {
            blockId: 'CARRY_OVERHEAD',
            name: 'Carry overhead',
            intent: 'carry',
            tags: ['upper', 'carry', 'core'],
            equipment: ['none'],
            contraindications: [],
            exercises: [],
            versions: [],
            coachingNotes: '',
          },
          version: {
            versionId: 'W1',
            sets: 2,
            scheme: { kind: 'reps', reps: '20m' },
            restSeconds: 60,
          },
        },
      ],
    })

    const result = evaluateQualityGates(createProfile(), [session])

    expect(result.events).toContain('quality:full-body-redundancy:FULL_V1:0')
    expect(result.invalidSessionIndexes).toContain(0)
  })

  it('flags upper blueprint sessions missing push/pull balance', () => {
    const session = makeSession({
      recipeId: 'UPPER_V1',
      blocks: [
        {
          block: {
            blockId: 'NEURAL_ONLY_PULL',
            name: 'Neural pull',
            intent: 'neural',
            tags: ['upper', 'pull', 'neural'],
            equipment: ['none'],
            contraindications: [],
            exercises: [],
            versions: [],
            coachingNotes: '',
          },
          version: {
            versionId: 'W1',
            sets: 3,
            scheme: { kind: 'reps', reps: '3' },
            restSeconds: 90,
          },
        },
        {
          block: {
            blockId: 'FORCE_ONLY_PULL',
            name: 'Force pull',
            intent: 'force',
            tags: ['upper', 'pull', 'force'],
            equipment: ['none'],
            contraindications: [],
            exercises: [],
            versions: [],
            coachingNotes: '',
          },
          version: {
            versionId: 'W1',
            sets: 3,
            scheme: { kind: 'reps', reps: '5' },
            restSeconds: 120,
          },
        },
      ],
    })

    const result = evaluateQualityGates(createProfile(), [session])

    expect(result.events).toContain('quality:upper-push-pull-imbalance:UPPER_V1:0')
    expect(result.invalidSessionIndexes).toContain(0)
  })

  it('flags lower blueprint sessions with redundant lower pattern', () => {
    const session = makeSession({
      recipeId: 'LOWER_V1',
      blocks: [
        {
          block: {
            blockId: 'CONTRAST_LOWER_ONLY_HINGE',
            name: 'Contrast lower',
            intent: 'contrast',
            tags: ['lower', 'hinge', 'contrast'],
            equipment: ['none'],
            contraindications: [],
            exercises: [],
            versions: [],
            coachingNotes: '',
          },
          version: {
            versionId: 'W1',
            sets: 3,
            scheme: { kind: 'reps', reps: '4' },
            restSeconds: 90,
          },
        },
        {
          block: {
            blockId: 'FORCE_LOWER_ONLY_HINGE',
            name: 'Force lower',
            intent: 'force',
            tags: ['lower', 'hinge', 'force'],
            equipment: ['none'],
            contraindications: [],
            exercises: [],
            versions: [],
            coachingNotes: '',
          },
          version: {
            versionId: 'W1',
            sets: 3,
            scheme: { kind: 'reps', reps: '5' },
            restSeconds: 120,
          },
        },
      ],
    })

    const result = evaluateQualityGates(createProfile(), [session])

    expect(result.events).toContain('quality:lower-pattern-redundancy:LOWER_V1:0')
    expect(result.invalidSessionIndexes).toContain(0)
  })
})

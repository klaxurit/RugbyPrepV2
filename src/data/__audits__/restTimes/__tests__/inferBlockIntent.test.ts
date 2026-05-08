/**
 * Lock in the heuristic decisions canonized during B2 Phase C §2.
 *
 * Each test asserts a corpus-coherent intent inference that emerged
 * from refinement passes — the "why" lives in
 * `docs/b2-rest-times-corrections.md`.
 */

import { describe, expect, it } from 'vitest'
import type { Block, MotherSession } from '../../../../types/motherSession'
import { inferBlockIntent } from '../inferBlockIntent'

const STUB_SESSION: MotherSession = {
  metadata: {
    id: 'STUB',
    status: 'validated',
    version: 'V1',
    cycle: 'in_season',
    sessionType: 'full',
    targetLevel: 'performance',
    targetPositionGroup: 'back_three',
    equipment: 'full_gym',
    targetDuration: '60 min',
  },
  goal: [],
  sessionIdentity: [],
  warmUp: { exercises: [], notes: [] },
  blocks: [],
  progressionRules: [],
  positionAccent: [],
  injurySubstitutions: [],
  coachingWarnings: [],
  sourceReferences: [],
}

function block(name: string, format = '', extras: Partial<Block> = {}): Block {
  return {
    number: 1,
    name,
    format,
    exercises: [],
    coachingNotes: [],
    ...extras,
  }
}

describe('inferBlockIntent — Phase C canonized decisions', () => {
  it('matches hypertrophy BEFORE force when both signals coexist', () => {
    // "Main Squat Hypertrophy" with `4 work sets` format would match force
    // via formatPattern alone, but the hypertrophy keyword must win first.
    const b = block('Main Squat Hypertrophy', '`4 work sets`, `2 min` rest between sets')
    expect(inferBlockIntent(b, STUB_SESSION)).toBe('hypertrophy')
  })

  it('"Strength Pair" / "Strength Triplet" → hypertrophy (RE method)', () => {
    expect(inferBlockIntent(block('Pull Strength Pair'), STUB_SESSION)).toBe('hypertrophy')
    expect(inferBlockIntent(block('Lower Strength Triplet'), STUB_SESSION)).toBe('hypertrophy')
  })

  it('"Push/Pull Strength" → hypertrophy (not force)', () => {
    expect(inferBlockIntent(block('Upper Push/Pull Strength'), STUB_SESSION)).toBe('hypertrophy')
  })

  it('"Primer" suffix in block name does NOT trigger activation intent', () => {
    // FULL_LIGHT_PRIMER sessions have working blocks named "X Primer" that
    // are real RE blocks, not warm-ups.
    const b = block('Upper Push Primer', '`3 rounds`, `90-120s` rest after the pair')
    expect(inferBlockIntent(b, STUB_SESSION)).toBe('hypertrophy')
  })

  it('"Neural Pair" → power_contrast (heavy + max-velocity intent in pair)', () => {
    const b = block('Lower Neural Pair', '`3 rounds`, full rest `2-3 min`')
    expect(inferBlockIntent(b, STUB_SESSION)).toBe('power_contrast')
  })

  it('"Force + Projection/Power/Maintenance" → power_contrast', () => {
    expect(inferBlockIntent(block('Lower Force + Horizontal Projection'), STUB_SESSION)).toBe(
      'power_contrast',
    )
    expect(inferBlockIntent(block('Upper Force + Rotational Power'), STUB_SESSION)).toBe(
      'power_contrast',
    )
    expect(inferBlockIntent(block('Posterior Chain Force Maintenance'), STUB_SESSION)).toBe(
      'hypertrophy', // "posterior chain" wins via hypertrophy rule (matched earlier in priority)
    )
  })

  it('"Vertical/Horizontal Press/Row" → hypertrophy', () => {
    expect(inferBlockIntent(block('Vertical Press/Row Strength'), STUB_SESSION)).toBe(
      'hypertrophy',
    )
  })

  it('explicit force-max keywords → force', () => {
    expect(inferBlockIntent(block('Heavy Squat Triple', '`5x3 @ 90%`'), STUB_SESSION)).toBe('force')
    expect(inferBlockIntent(block('Bench Max Effort', '`3x1 @ 95%`'), STUB_SESSION)).toBe('force')
    expect(inferBlockIntent(block('Squat Force Max', '`4x3-4`'), STUB_SESSION)).toBe('force')
  })

  it('format with `full rest 3 min` (no name keyword) → force', () => {
    expect(inferBlockIntent(block('Generic Block', 'full rest 3 min after each round'), STUB_SESSION)).toBe('force')
    expect(inferBlockIntent(block('Generic Block', '`3-4 min` rest between rounds'), STUB_SESSION)).toBe('force')
  })

  it('EMOM/Tabata/AMRAP format → conditioning regardless of name', () => {
    expect(inferBlockIntent(block('Front Row Finisher', '`EMOM 8\'`'), STUB_SESSION)).toBe(
      'conditioning',
    )
    expect(inferBlockIntent(block('Athletic Finisher', '`Tabata 8x 20/10s`'), STUB_SESSION)).toBe(
      'conditioning',
    )
  })

  it('sprint signals win over generic strength signals', () => {
    expect(inferBlockIntent(block('Acceleration Contrast'), STUB_SESSION)).toBe('sprint')
    expect(inferBlockIntent(block('Free Acceleration Sprint'), STUB_SESSION)).toBe('sprint')
    expect(inferBlockIntent(block('5-10-5 Shuttle'), STUB_SESSION)).toBe('sprint')
  })

  it('prehab keywords override core/hypertrophy', () => {
    expect(inferBlockIntent(block('Lower-Leg / Groin Support'), STUB_SESSION)).toBe('prehab')
    expect(inferBlockIntent(block('Shoulder Health'), STUB_SESSION)).toBe('prehab')
    expect(inferBlockIntent(block('Hamstring Micro-Dose'), STUB_SESSION)).toBe('prehab')
  })

  it('reward / arm pump are matched even on optional blocks', () => {
    expect(inferBlockIntent(block('Arm Pump / Reward Block', '', { isOptional: true }), STUB_SESSION)).toBe(
      'reward',
    )
    expect(inferBlockIntent(block('Contact Confidence / Pump'), STUB_SESSION)).toBe('reward')
  })

  it('completely unmatched name → unknown (forces explicit triage)', () => {
    expect(inferBlockIntent(block('Some Weird New Name'), STUB_SESSION)).toBe('unknown')
  })
})

import { describe, expect, it } from 'vitest'
import { formatTitleFromMotherSessionId } from '../../../components/motherSession/formatMotherSessionTitle'
import { parseAllMotherSessions } from '../parseAllMotherSessions'
import { parseExerciseLine, parseMotherSession } from '../parseMotherSession'
import {
  FIXTURE_LOWER_PRESEASON_FORCE_V1,
  FIXTURE_UPPER_IN_SEASON_FRONT_ROW_V1,
} from './motherSessionFixtures'

describe('parseMotherSession', () => {
  it('parse LOWER_PRESEASON_FORCE_V1: metadata, warm-up, blocks, injuries', () => {
    const path = 'pre-season/LOWER_PRESEASON_FORCE_V1.md'
    const s = parseMotherSession(FIXTURE_LOWER_PRESEASON_FORCE_V1, path)

    expect(s.metadata.id).toBe('LOWER_PRESEASON_FORCE_V1')
    expect(s.metadata.status).toBe('validated')
    expect(s.metadata.version).toBe('V1')
    expect(s.metadata.cycle).toBe('pre_season')
    expect(s.metadata.sessionType).toBe('lower')
    expect(s.metadata.targetLevel).toBe('performance')
    expect(s.metadata.equipment).toBe('full_gym')
    expect(s.metadata.targetDuration).toContain('50')
    expect(s.metadata.targetDuration).toContain('60')
    expect(s.metadata.targetPositionGroup).toContain('front_row')

    expect(s.title).toBe('LOWER_PRESEASON_FORCE_V1')
    expect(s.goal.length).toBeGreaterThanOrEqual(3)
    expect(s.sessionIdentity.length).toBeGreaterThanOrEqual(2)

    expect(s.warmUp.exercises).toHaveLength(5)
    expect(s.warmUp.exercises[0]).toMatchObject({
      name: 'ankle rocks',
      prescription: '1x8/side',
    })
    expect(s.warmUp.notes.length).toBeGreaterThanOrEqual(2)

    expect(s.blocks).toHaveLength(4)
    expect(s.blocks[0]).toMatchObject({
      number: 1,
      name: 'Main Lower Force',
    })
    expect(s.blocks[0].isOptional).toBeFalsy()
    expect(s.blocks[0].format).toContain('4 work sets')
    expect(s.blocks[0].exercises[0]).toMatchObject({
      name: 'Pin Back Squat',
      prescription: '4x4-5',
    })
    expect(s.blocks[1].exercises[1].name).toContain('Rear-Foot Elevated Split Squat')
    expect(s.blocks[1].exercises[1].name).toContain('Reverse Lunge')

    expect(s.blocks[2].exercises).toHaveLength(3)

    expect(s.injurySubstitutions.map((i) => i.area)).toEqual([
      'shoulder_pain',
      'knee_pain',
      'low_back_pain',
    ])
    const shoulder = s.injurySubstitutions[0]
    expect(shoulder.remove.some((l) => l.includes('Pin Back Squat'))).toBe(true)
    expect(shoulder.replaceWith.some((l) => l.includes('Front Squat'))).toBe(true)
    expect(shoulder.rehabFinisher.length).toBeGreaterThanOrEqual(1)
    const knee = s.injurySubstitutions[1]
    expect(knee.remove).toContain('`Pin Back Squat`')
    expect(knee.replaceWith.some((l) => l.includes('Hip Thrust'))).toBe(true)
    const lowBack = s.injurySubstitutions[2]
    expect(lowBack.remove.some((l) => l.includes('Romanian Deadlift'))).toBe(true)

    expect(s.sourceReferences.length).toBeGreaterThanOrEqual(3)
    expect(s.sourceReferences[0]).toContain('tech-spec-pre-season')
  })

  it('parse UPPER_IN_SEASON_FRONT_ROW_V1: optional block, EMOM slot labels', () => {
    const path = 'UPPER_IN_SEASON_FRONT_ROW_V1.md'
    const s = parseMotherSession(FIXTURE_UPPER_IN_SEASON_FRONT_ROW_V1, path)

    expect(s.metadata.id).toBe('UPPER_IN_SEASON_FRONT_ROW_V1')
    expect(s.metadata.sessionType).toBe('upper')
    expect(s.metadata.cycle).toBe('in_season')
    expect(s.metadata.version).toBe('V1')
    expect(s.metadata.targetLevel).toBe('performance')
    expect(s.metadata.equipment).toBe('full_gym')
    expect(s.metadata.targetDuration).toMatch(/\d/)

    const b3 = s.blocks.find((b) => b.number === 3)
    expect(b3?.format).toContain('EMOM')
    const exA = b3?.exercises.find((e) => e.name.includes('Farmer'))
    expect(exA?.slotLabel).toBe('minute 1')
    expect(exA?.name).toContain('Farmer Carry')
    expect(exA?.name).toContain('Zercher Carry')
    expect(exA?.prescription).toBe('20m')

    const exB = b3?.exercises.find((e) => e.name.includes('Neck'))
    expect(exB?.slotLabel).toBe('minute 2')

    const opt = s.blocks.find((b) => b.isOptional)
    expect(opt?.number).toBe(4)
    expect(opt?.name).toContain('Shoulder Prehab')
    expect(opt?.exercises).toHaveLength(3)

    expect(s.warmUp.exercises.some((e) => e.name.includes('band pull-apart'))).toBe(true)
  })

  it('normalise speed_field vers speed_power', () => {
    const md = `# TEST_SPEED

- \`status\`: draft
- \`cycle\`: in_season
- \`session_type\`: speed_field
- \`target_position_group\`: all

## Goal
- x

## Session Identity
- y

## Warm-Up
### Recommended warm-up
- \`a\` \`1x1\`

### Notes
- n

## Visible Blocks

### Block 1 - A
- Format: \`1\`
- Exercise A: \`Sprint\` \`10m\`
- Coaching notes:
  - note

## Progression Rules
- p

## Position Accent
- pa

## Injury Substitutions

### Shoulder pain
- line

### Knee pain
- line

### Low back pain
- line

## Coaching Warnings
- w

## Source References
- ref
`
    const s = parseMotherSession(md, 'TEST_SPEED.md')
    expect(s.metadata.sessionType).toBe('speed_power')
    expect(s.metadata.version).toBe('')
    expect(s.metadata.targetLevel).toBe('builder')
    expect(s.metadata.equipment).toBe('')
    expect(s.metadata.targetDuration).toBe('')
  })

  it('extrait Fallback options sans les dupliquer dans coachingNotes', () => {
    const md = `# T

- \`status\`: draft
- \`cycle\`: in_season
- \`session_type\`: full
- \`target_position_group\`: x

## Goal
- g

## Session Identity
- i

## Warm-Up
### Recommended warm-up
- \`w\` \`1x1\`

### Notes
- n

## Visible Blocks

### Block 1 - X
- Format: \`3 rounds\`
- Exercise A: \`Squat\` \`3x5\`
- Coaching notes:
  - Note avant
  - Fallback options:
    - A: \`Box Squat\`
    - B: \`Leg Press\`
  - Note après

## Progression Rules
- p

## Position Accent
- a

## Injury Substitutions

### Shoulder pain
- s

### Knee pain
- k

### Low back pain
- l

## Coaching Warnings
- c

## Source References
- r
`
    const s = parseMotherSession(md, 'T.md')
    const b = s.blocks[0]
    expect(b.fallbackOptions).toEqual(['A: `Box Squat`', 'B: `Leg Press`'])
    expect(b.coachingNotes).toContain('Note avant')
    expect(b.coachingNotes).toContain('Note après')
    expect(b.coachingNotes.some((n) => n.includes('Fallback options'))).toBe(false)
    expect(b.coachingNotes.some((n) => n.includes('Box Squat'))).toBe(false)
  })
})

describe('formatTitleFromMotherSessionId', () => {
  it('titre court classique lower / force', () => {
    expect(formatTitleFromMotherSessionId('LOWER_PRESEASON_FORCE_V1')).toBe('Lower - Force')
  })

  it('ne réduit pas un primer full_light à seulement Full', () => {
    // Override dict returns a more specific title for this ID in EN
    expect(formatTitleFromMotherSessionId('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1')).toBe(
      'Light Primer · Front Row'
    )
  })

  it('full + power sans primer', () => {
    expect(formatTitleFromMotherSessionId('FULL_PRESEASON_POWER_BACK_THREE_V1')).toBe('Full - Power')
  })
})

describe('parseExerciseLine', () => {
  it('détecte minute N et alternatives or', () => {
    const e = parseExerciseLine(
      '- Exercise A: minute 1 `Farmer Carry` or `Zercher Carry` `20m`'
    )
    expect(e).toMatchObject({
      slotLabel: 'minute 1',
      name: 'Farmer Carry or Zercher Carry',
      prescription: '20m',
    })
  })
})

describe('parseAllMotherSessions', () => {
  it('consolide plusieurs entrées', () => {
    const { sessions } = parseAllMotherSessions([
      {
        filePath: 'pre-season/LOWER_PRESEASON_FORCE_V1.md',
        markdown: FIXTURE_LOWER_PRESEASON_FORCE_V1,
      },
      {
        filePath: 'UPPER_IN_SEASON_FRONT_ROW_V1.md',
        markdown: FIXTURE_UPPER_IN_SEASON_FRONT_ROW_V1,
      },
    ])
    expect(sessions).toHaveLength(2)
    expect(sessions[0].metadata.id).toBe('LOWER_PRESEASON_FORCE_V1')
    expect(sessions[1].metadata.id).toBe('UPPER_IN_SEASON_FRONT_ROW_V1')
  })
})

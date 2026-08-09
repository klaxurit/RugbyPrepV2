import { describe, it, expect } from 'vitest'
import {
  resolveExerciseId,
  normalizeExerciseName,
  isDirectiveText,
  getAllMapEntries,
  resolveExerciseIdForDemo,
} from '../motherSessionExerciseMap'
import { getExerciseById } from '../../../data/exercises'
import { MOTHER_SESSIONS } from '../../../data/motherSessions.generated'

describe('normalizeExerciseName', () => {
  it('lowercases and trims', () => {
    expect(normalizeExerciseName('  BENCH PRESS  ')).toBe('bench press')
  })
  it('collapses whitespace', () => {
    expect(normalizeExerciseName('bench   press')).toBe('bench press')
  })
  it('normalises curly apostrophes', () => {
    expect(normalizeExerciseName("world\u2019s greatest stretch")).toBe("world's greatest stretch")
  })
})

describe('resolveExerciseId — normalisation', () => {
  it('resolves case-insensitive', () => {
    const result = resolveExerciseId('BENCH PRESS')
    expect(result).toBe('push_horizontal__bench_press__barbell')
    expect(resolveExerciseId('bench press')).toBe(result)
    expect(resolveExerciseId('Bench Press')).toBe(result)
  })
})

describe('resolveExerciseId — alias', () => {
  it('resolves alias DB/Incline variants', () => {
    expect(resolveExerciseId('DB Incline Bench Press')).toBe('push_horizontal__bench_press__incline__dumbbell')
    expect(resolveExerciseId('Incline DB Bench Press')).toBe('push_horizontal__bench_press__incline__dumbbell')
  })
  it('resolves alias warm-up', () => {
    expect(resolveExerciseId('ankle rocks')).toBe(resolveExerciseId('Ankle Rocks'))
  })
  it('maps generic push-up to standard, not incline regression', () => {
    expect(resolveExerciseId('Push-Up')).toBe('push_horizontal__push_up__standard')
    expect(resolveExerciseId('Incline Push-Up')).toBe('push_horizontal__push_up__incline')
  })
  it('resolves copenhagen variants to foot-elevated tier 0', () => {
    expect(resolveExerciseId('Copenhagen Plank')).toBe(
      'groin_adductors__copenhagen_plank__foot_elevated',
    )
    expect(resolveExerciseId('Copenhagen Hold')).toBe(
      'groin_adductors__copenhagen_plank__foot_elevated',
    )
  })
  it('mappe short / knee vers leurs IDs dédiés', () => {
    expect(resolveExerciseId('Short Copenhagen Hold')).toBe(
      'groin_adductors__copenhagen_plank__short',
    )
    expect(resolveExerciseId('Copenhagen Knee')).toBe(
      'groin_adductors__copenhagen_plank__knee',
    )
  })
  it('mappe single-leg calf raise vers mollet unilatéral', () => {
    expect(resolveExerciseId('single-leg calf raise')).toBe(
      'calf__standing_raise__single_leg__bodyweight',
    )
  })
  it('résout le nom FR rowing inversé pieds surélevés', () => {
    expect(resolveExerciseId('Rowing inversé pieds surélevés')).toBe(
      'pull_horizontal__inverted_row__feet_elevated',
    )
  })
  it('resolves single-leg RDL variants', () => {
    expect(resolveExerciseId('Single-Leg RDL')).toBe(resolveExerciseId('Single-Leg Romanian Deadlift'))
  })
  it('resolves banded KB swing variants', () => {
    expect(resolveExerciseId('Banded KB Swing')).toBe(resolveExerciseId('Banded Kettlebell Swing'))
  })
})

describe('resolveExerciseId — unknown / "or"', () => {
  it('returns undefined for unknown exercise', () => {
    expect(resolveExerciseId('UNKNOWN_EXERCISE')).toBeUndefined()
  })
  it('returns undefined for "or" exercises', () => {
    expect(resolveExerciseId('Chest-Supported Row or T-Bar Row')).toBeUndefined()
    expect(resolveExerciseId('Farmer Carry or Zercher Carry')).toBeUndefined()
    expect(resolveExerciseId('Rear-Foot Elevated Split Squat or Reverse Lunge')).toBeUndefined()
  })
})

describe('resolveExerciseIdForDemo — variantes « or »', () => {
  it('résout le premier segment démo quand le libellé composite est non loggable', () => {
    expect(resolveExerciseIdForDemo('band pull-apart or TYI light')).toBe(
      'activation__band_pull_apart__overhead',
    )
  })
  it('se comporte comme resolveExerciseId sans « or »', () => {
    expect(resolveExerciseIdForDemo('thoracic rotation')).toBe('mobility__thoracic_rotation_seated')
    expect(resolveExerciseIdForDemo('TYI light')).toBe('prehab_shoulder__band_tyi')
  })
})

describe('catalogue integrity', () => {
  it('every mapped exerciseId exists in the catalogue', () => {
    const missing: string[] = []
    for (const [name, exerciseId] of getAllMapEntries()) {
      if (!getExerciseById(exerciseId)) {
        missing.push(`${name} → ${exerciseId}`)
      }
    }
    expect(missing).toEqual([])
  })
})

describe('exhaustivité — toutes les MS exercises mappées', () => {
  it('every non-directive, non-"or" exercise name has a mapping', () => {
    const unmapped: string[] = []
    const seen = new Set<string>()

    for (const ms of MOTHER_SESSIONS) {
      for (const ex of ms.warmUp.exercises) {
        const n = ex.name
        if (seen.has(n)) continue
        seen.add(n)
        if (isDirectiveText(n)) continue
        if (n.includes(' or ')) continue
        if (resolveExerciseId(n) === undefined) {
          unmapped.push(n)
        }
      }
      for (const block of ms.blocks) {
        for (const ex of block.exercises) {
          const n = ex.name
          if (seen.has(n)) continue
          seen.add(n)
          if (isDirectiveText(n)) continue
          if (n.includes(' or ')) continue
          if (resolveExerciseId(n) === undefined) {
            unmapped.push(n)
          }
        }
      }
    }

    if (unmapped.length > 0) {
      console.error('Unmapped exercise names:', unmapped)
    }
    expect(unmapped).toEqual([])
  })
})

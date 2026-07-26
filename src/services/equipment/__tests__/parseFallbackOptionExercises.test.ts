import { describe, expect, it } from 'vitest'
import { getExerciseVariantOptions, hasExerciseVariantOptions } from '../exerciseVariantOptions'
import {
  attributeFallbackOptionsToBlockExercises,
  buildBlockAlternativeGroups,
  resolveExerciseLabelToId,
} from '../parseFallbackOptionExercises'

describe('parseFallbackOptionExercises', () => {
  it('résout Front Squat / Box Squat depuis les backticks MD', () => {
    expect(resolveExerciseLabelToId('Front Squat')).toBe('squat__front_squat__barbell')
    expect(resolveExerciseLabelToId('Box Squat')).toBe('squat__box_squat__barbell')
    expect(resolveExerciseLabelToId('Front squat barre')).toBe('squat__front_squat__barbell')
  })

  it('rattache Front/Box au Pin squat (pas au squat jump)', () => {
    const attributed = attributeFallbackOptionsToBlockExercises(
      [
        'A: `Front Squat` if pin setup not available',
        'B: `Box Squat` as dead-stop alternative',
      ],
      [
        {
          exerciseIndex: 0,
          exerciseId: 'squat__pin_squat__barbell',
          name: 'pin back squat',
          role: 'prime',
        },
        {
          exerciseIndex: 1,
          exerciseId: 'power__squat_jump__bodyweight',
          name: 'squat jump',
          role: 'contrast',
        },
      ],
    )

    expect(attributed.byExerciseIndex[0]).toEqual([
      'squat__front_squat__barbell',
      'squat__box_squat__barbell',
    ])
    expect(attributed.byExerciseIndex[1]).toBeUndefined()
    expect(attributed.residualLines).toEqual([])
  })

  it('expose le swap Pin squat via alternatives MD', () => {
    const built = buildBlockAlternativeGroups({
      preparedExercises: [
        { name: 'pin back squat', role: 'prime' },
        { name: 'squat jump', role: 'contrast' },
      ],
      displayExercises: [
        { name: 'pin back squat' },
        { name: 'squat jump' },
      ],
      fallbackOptions: [
        'A: `Front Squat` if pin setup not available',
        'B: `Box Squat` as dead-stop alternative',
      ],
    })

    const pin = built.groups.find((g) => g.prescribedId === 'squat__pin_squat__barbell')
    expect(pin?.mdAlternativeIds).toEqual([
      'squat__front_squat__barbell',
      'squat__box_squat__barbell',
    ])

    expect(
      hasExerciseVariantOptions('squat__pin_squat__barbell', {
        mdAlternativeIds: pin?.mdAlternativeIds,
      }),
    ).toBe(true)

    const options = getExerciseVariantOptions('squat__pin_squat__barbell', {
      mdAlternativeIds: pin?.mdAlternativeIds,
    })
    const ids = options.map((o) => o.exerciseId)
    expect(ids[0]).toBe('squat__pin_squat__barbell')
    expect(ids).toContain('squat__front_squat__barbell')
    expect(ids).toContain('squat__box_squat__barbell')
  })
})

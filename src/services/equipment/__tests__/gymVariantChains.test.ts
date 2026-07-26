import { describe, expect, it } from 'vitest'
import { getExerciseVariantOptions, hasExerciseVariantOptions } from '../exerciseVariantOptions'
import { resolveGymVariantChain } from '../gymVariantChains'

describe('gymVariantChains + couverture globale', () => {
  it('Pin / Front / Box / Back squat partagent la même famille salle', () => {
    const pin = resolveGymVariantChain('squat__pin_squat__barbell')
    expect(pin).toContain('squat__front_squat__barbell')
    expect(pin).toContain('squat__box_squat__barbell')
    expect(resolveGymVariantChain('squat__front_squat__barbell')).toBe(pin)
  })

  it('Trap bar / RDL / hip thrust ont des variantes sans MD', () => {
    expect(
      hasExerciseVariantOptions('hinge__deadlift__trap_bar', { equipment: ['barbell', 'trap_bar'] }),
    ).toBe(true)
    const ids = getExerciseVariantOptions('hinge__deadlift__trap_bar', {
      equipment: ['barbell', 'dumbbell', 'trap_bar', 'machine', 'bench'],
    }).map((o) => o.exerciseId)
    expect(ids).toContain('hinge__rdl__barbell')
    expect(ids).toContain('hinge__hip_thrust__barbell')
  })

  it('ne pollue plus un back squat salle avec des progressions BW (pistol)', () => {
    const ids = getExerciseVariantOptions('squat__back_squat__barbell', {
      equipment: ['barbell', 'squat_rack', 'dumbbell', 'box', 'machine'],
      phaseContext: { cycle: 'off_season', offSeasonPhase: 4 },
    }).map((o) => o.exerciseId)
    expect(ids).toContain('squat__front_squat__barbell')
    expect(ids).not.toContain('lower_squat__pistol_assisted_wall__bodyweight')
    expect(ids).not.toContain('lower_lunge__shrimp__bodyweight')
  })

  it('filet catalogue : exo hors chaîne a quand même une alternative même pattern', () => {
    // Exemple : face pull cable — pas dans GYM chains dédiées, mais pattern prehab
    const options = getExerciseVariantOptions('prehab_shoulder__face_pull__cable', {
      equipment: ['cable', 'band'],
    })
    expect(options.length).toBeGreaterThan(1)
  })

  const priorityGym = [
    'squat__pin_squat__barbell',
    'hinge__deadlift__trap_bar',
    'hinge__rdl__barbell',
    'push_horizontal__bench_press__barbell',
    'push_horizontal__bench_press__incline__dumbbell',
    'pull_horizontal__chest_supported_row__dumbbell',
    'pull_horizontal__pendlay_row__barbell',
    'push_vertical__overhead_press__barbell',
    'lower_squat__bulgarian_split_squat__dumbbell',
    'lower_lunge__reverse_lunge__barbell',
    'power__push_press__barbell',
  ]

  it.each(priorityGym)('%s a un bouton swap (sans MD)', (id) => {
    expect(
      hasExerciseVariantOptions(id, {
        equipment: [
          'barbell',
          'dumbbell',
          'bench',
          'squat_rack',
          'pullup_bar',
          'machine',
          'cable',
          'trap_bar',
          'landmine',
          'box',
          'band',
        ],
      }),
    ).toBe(true)
  })
})

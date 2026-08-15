import { describe, expect, it } from 'vitest'
import { hasExerciseDemo } from '../../../data/exercises'
import {
  allowsAdvancedBwHarder,
  getExerciseVariantOptions,
  hasExerciseVariantOptions,
} from '../exerciseVariantOptions'

describe('getExerciseVariantOptions', () => {
  it('garde l’exo prescrit en tête avec badge', () => {
    const options = getExerciseVariantOptions(
      'lower_squat__bulgarian_split_squat__bodyweight',
      [],
      { cycle: 'off_season', offSeasonPhase: 4 },
    )
    expect(options[0]?.exerciseId).toBe('lower_squat__bulgarian_split_squat__bodyweight')
    expect(options[0]?.isPrescribed).toBe(true)
    expect(options.length).toBeGreaterThan(1)
  })

  it('propose Cossack / pistol / shrimp en Force-Pont (off-season phase 4)', () => {
    const options = getExerciseVariantOptions(
      'lower_squat__bulgarian_split_squat__bodyweight',
      [],
      { cycle: 'off_season', offSeasonPhase: 4 },
    )
    const ids = options.map((o) => o.exerciseId)
    expect(ids).toContain('lower_lunge__cossack_squat__bodyweight')
    expect(ids).toContain('lower_squat__pistol_assisted_wall__bodyweight')
    expect(ids).toContain('lower_lunge__shrimp__bodyweight')
  })

  it('masque les progressions dangereuses hors phase (recovery / early off-season)', () => {
    expect(
      allowsAdvancedBwHarder({
        cycle: 'off_season',
        offSeasonPhase: 2,
        sessionType: 'lower',
      }),
    ).toBe(false)

    const early = getExerciseVariantOptions(
      'lower_squat__bulgarian_split_squat__bodyweight',
      [],
      { cycle: 'off_season', offSeasonPhase: 2 },
    )
    const earlyIds = early.map((o) => o.exerciseId)
    expect(earlyIds).not.toContain('lower_squat__pistol_assisted_wall__bodyweight')
    expect(earlyIds).not.toContain('push_vertical__handstand_push_up__wall')

    const recovery = getExerciseVariantOptions(
      'push_vertical__pike_push_up__feet_elevated',
      [],
      { cycle: 'pre_season', sessionType: 'full_light_primer' },
    )
    expect(recovery.map((o) => o.exerciseId)).not.toContain(
      'push_vertical__handstand_push_up__wall',
    )
  })

  it('filtre pull-up si pas de barre', () => {
    const withoutBar = getExerciseVariantOptions(
      'pull_horizontal__inverted_row__feet_elevated',
      [],
      { cycle: 'off_season', offSeasonPhase: 4 },
    )
    expect(withoutBar.map((o) => o.exerciseId)).not.toContain('pull_vertical__pull_up__neutral')

    const withBar = getExerciseVariantOptions(
      'pull_horizontal__inverted_row__feet_elevated',
      ['pullup_bar'],
      { cycle: 'off_season', offSeasonPhase: 4 },
    )
    expect(withBar.map((o) => o.exerciseId)).toContain('pull_vertical__pull_up__neutral')
  })

  it('expose archer push-up depuis decline en pré-saison', () => {
    const options = getExerciseVariantOptions(
      'push_horizontal__push_up__decline',
      [],
      { cycle: 'pre_season', preSeasonPhase: 1 },
    )
    expect(options.map((o) => o.exerciseId)).toContain(
      'push_horizontal__archer_push_up__bodyweight',
    )
  })

  it('Speed : sprints 10–20 m restent en Alternatives sans piste déclarée', () => {
    const undeclared = getExerciseVariantOptions('sprint__falling_start_short')
    expect(undeclared.map((o) => o.exerciseId)).toContain('sprint__short_acceleration')

    const gymNoTrack = getExerciseVariantOptions('sprint__falling_start_short', {
      equipment: ['barbell', 'dumbbell', 'band', 'machine', 'cable'],
    })
    expect(gymNoTrack.map((o) => o.exerciseId)).toContain('sprint__short_acceleration')
    expect(gymNoTrack.map((o) => o.exerciseId)).toContain('sprint__free_acceleration')
  })

  it('hasExerciseVariantOptions est vrai dès qu’il y a un choix', () => {
    expect(
      hasExerciseVariantOptions('lower_squat__bulgarian_split_squat__bodyweight', [], {
        cycle: 'off_season',
        offSeasonPhase: 4,
      }),
    ).toBe(true)
  })

  it('les options avancées BW ont une démo YouTube', () => {
    const advanced = [
      'lower_lunge__cossack_squat__bodyweight',
      'lower_squat__pistol_assisted_wall__bodyweight',
      'lower_squat__pistol_box__bodyweight',
      'lower_lunge__shrimp__bodyweight',
      'push_vertical__handstand_push_up__wall',
      'push_horizontal__archer_push_up__bodyweight',
      'pull_horizontal__inverted_row__feet_elevated',
      'lower_squat__bulgarian_split_squat__bodyweight',
      'push_vertical__pike_push_up__bodyweight',
      'hamstring__nordic__eccentric_solo',
    ]
    for (const id of advanced) {
      expect(hasExerciseDemo(id), id).toBe(true)
    }
  })
})

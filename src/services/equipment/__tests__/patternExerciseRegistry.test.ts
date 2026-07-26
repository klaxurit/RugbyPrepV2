import { describe, expect, it } from 'vitest'
import { resolveExerciseVariantForEquipment } from '../patternExerciseRegistry'

describe('resolveExerciseVariantForEquipment', () => {
  it('reste sur le tier 0 sans matériel', () => {
    expect(
      resolveExerciseVariantForEquipment('push_horizontal__push_up__decline', []),
    ).toBe('push_horizontal__push_up__decline')
    expect(
      resolveExerciseVariantForEquipment('groin_adductors__copenhagen_plank__foot_elevated', []),
    ).toBe('groin_adductors__copenhagen_plank__foot_elevated')
  })

  it('monte vers tractions si barre de traction', () => {
    expect(
      resolveExerciseVariantForEquipment('pull_horizontal__inverted_row__feet_elevated', [
        'pullup_bar',
      ]),
    ).toBe('pull_vertical__pull_up__neutral')
    expect(
      resolveExerciseVariantForEquipment('pull_horizontal__inverted_row__knees_bent', [
        'pullup_bar',
      ]),
    ).toBe('pull_vertical__pull_up__neutral')
  })

  it('fente arrière BW → haltères si dispo', () => {
    expect(
      resolveExerciseVariantForEquipment('lower_lunge__reverse_lunge__bodyweight', ['dumbbell']),
    ).toBe('lower_lunge__reverse_lunge__dumbbell')
  })

  it('monte vers goblet si haltères', () => {
    expect(
      resolveExerciseVariantForEquipment('lower_squat__bulgarian_split_squat__bodyweight', [
        'dumbbell',
      ]),
    ).toBe('squat__goblet_squat__dumbbell')
  })

  it('monte Copenhagen vers banc court/long si banc dispo', () => {
    expect(
      resolveExerciseVariantForEquipment('groin_adductors__copenhagen_plank__foot_elevated', [
        'bench',
      ]),
    ).toBe('groin_adductors__copenhagen_plank__long')
  })

  it('face pull band → scap push-up sans élastique', () => {
    expect(
      resolveExerciseVariantForEquipment('prehab_shoulder__face_pull__band', []),
    ).toBe('prehab_shoulder__scap_pushup__bodyweight')
  })

  it('monte squat sauté vers KB swing bandé si élastique', () => {
    expect(
      resolveExerciseVariantForEquipment('power__squat_jump__bodyweight', ['band']),
    ).toBe('hinge__kb_swing__banded')
  })

  it('rotation band → chop au sol sans élastique', () => {
    expect(
      resolveExerciseVariantForEquipment('core_rotation__band_rotation__explosive', []),
    ).toBe('core_rotation__cable_chop')
  })

  it('bodyweight squat → goblet si haltères', () => {
    expect(
      resolveExerciseVariantForEquipment('squat__bodyweight_squat', ['dumbbell']),
    ).toBe('squat__goblet_squat__dumbbell')
  })

  it('bodyweight squat → back squat si cage + barre', () => {
    expect(
      resolveExerciseVariantForEquipment('squat__bodyweight_squat', ['squat_rack', 'barbell']),
    ).toBe('squat__back_squat__barbell')
  })

  it('pompes → développé barre si banc + barre', () => {
    expect(
      resolveExerciseVariantForEquipment('push_horizontal__push_up__standard', [
        'bench',
        'barbell',
      ]),
    ).toBe('push_horizontal__bench_press__barbell')
  })

  it('pompes → dips parallèles si barre traction / parc', () => {
    expect(
      resolveExerciseVariantForEquipment('push_horizontal__push_up__standard', ['pullup_bar']),
    ).toBe('push_horizontal__dip__parallel')
  })
})

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

  it('fente arrière BW → haltères ou KB si dispo', () => {
    expect(
      resolveExerciseVariantForEquipment('lower_lunge__reverse_lunge__bodyweight', ['dumbbell']),
    ).toBe('lower_lunge__reverse_lunge__dumbbell')
    expect(
      resolveExerciseVariantForEquipment('lower_lunge__reverse_lunge__bodyweight', [
        'kettlebell',
      ]),
    ).toBe('lower_lunge__reverse_lunge__dumbbell')
  })

  it('Bulgarian BW → Bulgarian haltères si DB/KB (reste unilatéral)', () => {
    expect(
      resolveExerciseVariantForEquipment('lower_squat__bulgarian_split_squat__bodyweight', [
        'dumbbell',
      ]),
    ).toBe('lower_squat__bulgarian_split_squat__dumbbell')
    expect(
      resolveExerciseVariantForEquipment('lower_squat__bulgarian_split_squat__bodyweight', [
        'kettlebell',
      ]),
    ).toBe('lower_squat__bulgarian_split_squat__dumbbell')
  })

  it('ne convertit pas la Bulgarian en goblet bilatéral', () => {
    expect(
      resolveExerciseVariantForEquipment('lower_squat__bulgarian_split_squat__bodyweight', [
        'dumbbell',
        'squat_rack',
        'barbell',
      ]),
    ).toBe('lower_squat__bulgarian_split_squat__dumbbell')
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

  it('rotation bande reste bande sans élastique ; chop seulement avec câble', () => {
    expect(
      resolveExerciseVariantForEquipment('core_rotation__band_rotation__explosive', []),
    ).toBe('core_rotation__band_rotation__explosive')
    expect(
      resolveExerciseVariantForEquipment('core_rotation__band_rotation__explosive', ['band']),
    ).toBe('core_rotation__band_rotation__explosive')
    expect(
      resolveExerciseVariantForEquipment('core_rotation__band_rotation__explosive', ['cable']),
    ).toBe('core_rotation__cable_chop')
  })

  it('SL RDL / pont 1 jambe restent unilatéraux avec DB', () => {
    expect(
      resolveExerciseVariantForEquipment('hinge__single_leg_rdl__bodyweight', ['dumbbell']),
    ).toBe('hinge__rdl__single_leg__dumbbell')
    expect(
      resolveExerciseVariantForEquipment('hamstring__bridge_iso__single_leg', ['dumbbell']),
    ).toBe('hinge__rdl__single_leg__dumbbell')
  })

  it('suitcase ne bascule pas vers farmer sac', () => {
    expect(
      resolveExerciseVariantForEquipment('carry__suitcase_walk__dumbbell', []),
    ).toBe('carry__suitcase_walk__dumbbell')
    expect(
      resolveExerciseVariantForEquipment('carry__suitcase_walk__dumbbell', ['dumbbell']),
    ).toBe('carry__suitcase_walk__dumbbell')
  })

  it('rowing inversé ne monte pas vers rowing 1 bras', () => {
    expect(
      resolveExerciseVariantForEquipment('pull_horizontal__inverted_row__standard', [
        'dumbbell',
        'bench',
      ]),
    ).toBe('pull_horizontal__inverted_row__standard')
    expect(
      resolveExerciseVariantForEquipment('pull_horizontal__inverted_row__standard', [
        'pullup_bar',
      ]),
    ).toBe('pull_vertical__pull_up__neutral')
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

  it('plyo ne monte pas vers dips (reste balistique ; med ball si dispo)', () => {
    expect(
      resolveExerciseVariantForEquipment('push_horizontal__push_up__plyo', ['pullup_bar']),
    ).toBe('push_horizontal__push_up__plyo')
    expect(
      resolveExerciseVariantForEquipment('push_horizontal__push_up__plyo', ['med_ball']),
    ).toBe('power__medball_chest_pass__wall')
  })

  it('decline → dips si barre, sans forcer le contraste plyo', () => {
    expect(
      resolveExerciseVariantForEquipment('push_horizontal__push_up__decline', ['pullup_bar']),
    ).toBe('push_horizontal__dip__parallel')
  })
})

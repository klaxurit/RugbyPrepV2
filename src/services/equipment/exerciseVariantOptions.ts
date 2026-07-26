import { exercisesList, getExerciseById, getExerciseName } from '../../data/exercises'
import type { Equipment } from '../../types/training'
import type { AnnualCycle, OffSeasonPhase, PreSeasonPhase } from '../../types/annualPlanning'
import { BODYWEIGHT_VARIANT_CHAINS } from './patternExerciseRegistry'
import { resolveGymVariantChain } from './gymVariantChains'
import { patternsCompatible } from './parseFallbackOptionExercises'

export type ExerciseVariantKind = 'easier' | 'same' | 'harder'

export type ExerciseVariantOption = {
  exerciseId: string
  labelFr: string
  labelEn: string
  kind: ExerciseVariantKind
  requiresEquipment?: Equipment[]
  /** True si c’est l’exo prescrit (après adaptation auto) pour ce slot. */
  isPrescribed?: boolean
}

export type VariantPhaseContext = {
  cycle?: AnnualCycle
  offSeasonPhase?: OffSeasonPhase
  preSeasonPhase?: PreSeasonPhase
  /** Session recovery / primer : masquer les progressions dangereuses. */
  sessionType?: string
  equipmentProfile?: string
}

/** Progressions BW avancées (même pattern), au-delà des chaînes matériel. */
const ADVANCED_BW_PROGRESSIONS: Readonly<
  Record<string, readonly { exerciseId: string; kind: ExerciseVariantKind; requires?: Equipment[] }[]>
> = {
  'lower_squat__bulgarian_split_squat__bodyweight': [
    { exerciseId: 'lower_squat__split_squat__bodyweight', kind: 'easier' },
    { exerciseId: 'lower_lunge__cossack_squat__bodyweight', kind: 'harder' },
    { exerciseId: 'lower_squat__pistol_assisted_wall__bodyweight', kind: 'harder' },
    { exerciseId: 'lower_squat__pistol_box__bodyweight', kind: 'harder', requires: ['box'] },
    { exerciseId: 'lower_lunge__shrimp__bodyweight', kind: 'harder' },
  ],
  'lower_squat__split_squat__bodyweight': [
    { exerciseId: 'lower_squat__bulgarian_split_squat__bodyweight', kind: 'harder' },
    { exerciseId: 'lower_lunge__cossack_squat__bodyweight', kind: 'harder' },
  ],
  'lower_lunge__reverse_lunge__bodyweight': [
    { exerciseId: 'lower_squat__split_squat__bodyweight', kind: 'easier' },
    { exerciseId: 'lower_squat__bulgarian_split_squat__bodyweight', kind: 'harder' },
    { exerciseId: 'lower_lunge__cossack_squat__bodyweight', kind: 'harder' },
  ],
  'lower_lunge__cossack_squat__bodyweight': [
    { exerciseId: 'lower_squat__bulgarian_split_squat__bodyweight', kind: 'easier' },
    { exerciseId: 'lower_squat__pistol_assisted_wall__bodyweight', kind: 'harder' },
    { exerciseId: 'lower_lunge__shrimp__bodyweight', kind: 'harder' },
  ],
  'push_horizontal__push_up__decline': [
    { exerciseId: 'push_horizontal__push_up__standard', kind: 'easier' },
    { exerciseId: 'push_horizontal__archer_push_up__bodyweight', kind: 'harder' },
  ],
  'push_horizontal__push_up__standard': [
    { exerciseId: 'push_horizontal__push_up__decline', kind: 'harder' },
    { exerciseId: 'push_horizontal__archer_push_up__bodyweight', kind: 'harder' },
  ],
  'push_horizontal__archer_push_up__bodyweight': [
    { exerciseId: 'push_horizontal__push_up__decline', kind: 'easier' },
    { exerciseId: 'push_horizontal__push_up__standard', kind: 'easier' },
  ],
  'push_vertical__pike_push_up__bodyweight': [
    { exerciseId: 'push_vertical__pike_push_up__feet_elevated', kind: 'harder' },
    { exerciseId: 'push_vertical__handstand_push_up__wall', kind: 'harder' },
  ],
  'push_vertical__pike_push_up__feet_elevated': [
    { exerciseId: 'push_vertical__pike_push_up__bodyweight', kind: 'easier' },
    { exerciseId: 'push_vertical__handstand_push_up__wall', kind: 'harder' },
  ],
  'push_vertical__handstand_push_up__wall': [
    { exerciseId: 'push_vertical__pike_push_up__feet_elevated', kind: 'easier' },
    { exerciseId: 'push_vertical__pike_push_up__bodyweight', kind: 'easier' },
  ],
  'pull_horizontal__inverted_row__knees_bent': [
    { exerciseId: 'pull_horizontal__inverted_row__standard', kind: 'harder' },
    { exerciseId: 'pull_horizontal__inverted_row__feet_elevated', kind: 'harder' },
  ],
  'pull_horizontal__inverted_row__standard': [
    { exerciseId: 'pull_horizontal__inverted_row__knees_bent', kind: 'easier' },
    { exerciseId: 'pull_horizontal__inverted_row__feet_elevated', kind: 'harder' },
  ],
  'pull_horizontal__inverted_row__feet_elevated': [
    { exerciseId: 'pull_horizontal__inverted_row__standard', kind: 'easier' },
    { exerciseId: 'pull_horizontal__inverted_row__knees_bent', kind: 'easier' },
  ],
}

/** Exos « harder » réservés Force-Pont / pré-saison (pas Recovery / primer). */
const PHASE_GATED_HARDER = new Set([
  'lower_squat__pistol_assisted_wall__bodyweight',
  'lower_squat__pistol_box__bodyweight',
  'lower_lunge__shrimp__bodyweight',
  'push_vertical__handstand_push_up__wall',
  'push_horizontal__archer_push_up__bodyweight',
  'lower_lunge__cossack_squat__bodyweight',
])

const CATALOG_FALLBACK_LIMIT = 4

function equipmentSet(equipment: Equipment[] | undefined): Set<Equipment> {
  return new Set(equipment ?? [])
}

function hasRequiredEquipment(
  requires: Equipment[] | undefined,
  available: Set<Equipment>,
  /** false = profil équipement absent → ne pas filtrer. true = respecter la liste (même vide). */
  filterByEquipment: boolean,
): boolean {
  if (!requires?.length) return true
  if (!filterByEquipment) return true
  return requires.every((item) => available.has(item))
}

function isBodyweightExercise(exerciseId: string): boolean {
  const ex = getExerciseById(exerciseId)
  if (!ex) return false
  const eq = ex.equipment ?? []
  return eq.length === 0 || eq.every((item) => item === 'none')
}

/**
 * Autorise les progressions BW avancées (pistol, HSPU, archer…) hors recovery/primer,
 * en off-season phase ≥ 4 (Force-Pont / Entretien) ou toute pré-saison.
 */
export function allowsAdvancedBwHarder(ctx?: VariantPhaseContext): boolean {
  if (!ctx) return true
  const sessionType = (ctx.sessionType ?? '').toLowerCase()
  if (sessionType.includes('recovery') || sessionType.includes('primer')) return false
  const equip = (ctx.equipmentProfile ?? '').toLowerCase()
  if (equip.includes('recovery')) return false

  if (ctx.cycle === 'pre_season') return true
  if (ctx.cycle === 'off_season') {
    const phase = ctx.offSeasonPhase ?? 0
    return phase >= 4
  }
  return false
}

/** Chaîne BW uniquement pour les exos poids de corps (pas les lifts salle en bout de chaîne). */
function resolveBwChainKey(exerciseId: string): string | null {
  if (BODYWEIGHT_VARIANT_CHAINS[exerciseId]) return exerciseId
  if (!isBodyweightExercise(exerciseId)) return null
  for (const [baseId, chain] of Object.entries(BODYWEIGHT_VARIANT_CHAINS)) {
    if (chain.some((step) => step.exerciseId === exerciseId)) return baseId
  }
  return null
}

function kindFromChainIndex(
  optionIndex: number,
  currentIndex: number,
): ExerciseVariantKind {
  if (optionIndex < currentIndex) return 'easier'
  if (optionIndex > currentIndex) return 'harder'
  return 'same'
}

function toOption(
  exerciseId: string,
  kind: ExerciseVariantKind,
  requiresEquipment?: Equipment[],
): ExerciseVariantOption | null {
  const catalog = getExerciseById(exerciseId)
  if (!catalog) return null
  return {
    exerciseId,
    labelFr: getExerciseName(exerciseId, 'fr'),
    labelEn: getExerciseName(exerciseId, 'en'),
    kind,
    requiresEquipment: requiresEquipment?.length ? requiresEquipment : undefined,
  }
}

/** Filet catalogue : mêmes patterns, max N, filtrés équipement. */
function catalogSamePatternFallbacks(
  exerciseId: string,
  available: Set<Equipment>,
  already: Set<string>,
  filterByEquipment: boolean,
): ExerciseVariantOption[] {
  const base = getExerciseById(exerciseId)
  if (!base?.pattern) return []

  type Ranked = { option: ExerciseVariantOption; exact: boolean; label: string }
  const ranked: Ranked[] = []

  for (const ex of exercisesList) {
    const id = ex.exerciseId ?? ex.id
    if (!id || id === exerciseId || already.has(id)) continue
    if (!patternsCompatible(base.pattern, ex.pattern)) continue
    const requires = (ex.equipment ?? []).filter((e) => e !== 'none')
    if (!hasRequiredEquipment(requires, available, filterByEquipment)) continue
    const option = toOption(id, 'same', requires)
    if (!option) continue
    ranked.push({
      option,
      exact: ex.pattern === base.pattern,
      label: option.labelFr,
    })
  }

  ranked.sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1
    return a.label.localeCompare(b.label, 'fr')
  })

  return ranked.slice(0, CATALOG_FALLBACK_LIMIT).map((r) => r.option)
}

export type GetExerciseVariantOptionsArgs = {
  equipment?: Equipment[]
  phaseContext?: VariantPhaseContext
  /**
   * Alternatives issues du MD (`fallbackOptions`) déjà rattachées à cet exo.
   * Kind forcé à `same` (substitution équipement / setup, pas progression).
   */
  mdAlternativeIds?: readonly string[]
}

/**
 * Options de variantes pour le picker (même pattern).
 * Ordre : chaînes salle → chaînes BW → progressions avancées → MD → filet catalogue.
 */
export function getExerciseVariantOptions(
  exerciseId: string,
  equipmentOrArgs?: Equipment[] | GetExerciseVariantOptionsArgs,
  phaseContext?: VariantPhaseContext,
): ExerciseVariantOption[] {
  const args: GetExerciseVariantOptionsArgs = Array.isArray(equipmentOrArgs)
    ? { equipment: equipmentOrArgs, phaseContext }
    : (equipmentOrArgs ?? {})
  const { equipment, mdAlternativeIds } = args
  const ctx = args.phaseContext ?? phaseContext

  const available = equipmentSet(equipment)
  const filterByEquipment = equipment !== undefined
  const allowHarder = allowsAdvancedBwHarder(ctx)
  const byId = new Map<string, ExerciseVariantOption>()

  // 1) Chaînes salle (substitutions setup / matériel)
  const gymChain = resolveGymVariantChain(exerciseId)
  if (gymChain?.length) {
    for (const altId of gymChain) {
      if (altId === exerciseId || byId.has(altId)) continue
      const catalog = getExerciseById(altId)
      if (!catalog) continue
      const requires = (catalog.equipment ?? []).filter((e) => e !== 'none')
      if (!hasRequiredEquipment(requires, available, filterByEquipment)) continue
      const option = toOption(altId, 'same', requires)
      if (option) byId.set(option.exerciseId, option)
    }
  }

  // 2) Chaînes BW (uniquement si l’exo prescrit est BW)
  const bwChainKey = resolveBwChainKey(exerciseId)
  const bwChain = bwChainKey ? BODYWEIGHT_VARIANT_CHAINS[bwChainKey] : undefined
  if (bwChain?.length) {
    const currentIndex = Math.max(
      0,
      bwChain.findIndex((step) => step.exerciseId === exerciseId),
    )
    for (let i = 0; i < bwChain.length; i++) {
      const step = bwChain[i]
      if (!hasRequiredEquipment(step.requires, available, filterByEquipment)) continue
      const kind = kindFromChainIndex(i, currentIndex)
      if (kind === 'harder' && PHASE_GATED_HARDER.has(step.exerciseId) && !allowHarder) continue
      if (byId.has(step.exerciseId)) continue
      const option = toOption(step.exerciseId, kind, step.requires)
      if (option) byId.set(option.exerciseId, option)
    }
  }

  // 3) Progressions BW avancées
  const progressions =
    ADVANCED_BW_PROGRESSIONS[exerciseId] ??
    (bwChainKey ? ADVANCED_BW_PROGRESSIONS[bwChainKey] : undefined) ??
    []
  for (const step of progressions) {
    if (!hasRequiredEquipment(step.requires, available, filterByEquipment)) continue
    if (step.kind === 'harder' && PHASE_GATED_HARDER.has(step.exerciseId) && !allowHarder) {
      continue
    }
    if (byId.has(step.exerciseId)) continue
    const option = toOption(step.exerciseId, step.kind, step.requires)
    if (option) byId.set(option.exerciseId, option)
  }

  // 4) Alternatives MD
  for (const altId of mdAlternativeIds ?? []) {
    if (!altId || altId === exerciseId || byId.has(altId)) continue
    const catalog = getExerciseById(altId)
    if (!catalog) continue
    const option = toOption(altId, 'same', catalog.equipment?.filter((e) => e !== 'none'))
    if (option) byId.set(option.exerciseId, option)
  }

  // 5) Filet catalogue si aucune alternative structurée
  if (byId.size === 0) {
    for (const option of catalogSamePatternFallbacks(
      exerciseId,
      available,
      new Set([exerciseId]),
      filterByEquipment,
    )) {
      byId.set(option.exerciseId, option)
    }
  }

  // Exo courant toujours en tête avec badge prescrit.
  const current =
    byId.get(exerciseId) ??
    toOption(exerciseId, 'same') ?? {
      exerciseId,
      labelFr: getExerciseName(exerciseId, 'fr'),
      labelEn: getExerciseName(exerciseId, 'en'),
      kind: 'same' as const,
    }
  current.isPrescribed = true
  byId.delete(exerciseId)

  const rest = Array.from(byId.values()).sort((a, b) => {
    const order = { easier: 0, same: 1, harder: 2 }
    return order[a.kind] - order[b.kind] || a.labelFr.localeCompare(b.labelFr, 'fr')
  })

  return [current, ...rest]
}

export function hasExerciseVariantOptions(
  exerciseId: string,
  equipmentOrArgs?: Equipment[] | GetExerciseVariantOptionsArgs,
  phaseContext?: VariantPhaseContext,
): boolean {
  return getExerciseVariantOptions(exerciseId, equipmentOrArgs, phaseContext).length > 1
}

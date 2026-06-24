#!/usr/bin/env node
/**
 * Audit couverture exercices poids de corps pour le programme BW annuel.
 *
 * Usage: node scripts/auditBodyweightExerciseCoverage.mjs
 *
 * Exit 0 = tous les gaps P0 documentés sont couverts.
 * Exit 1 = gaps restants (liste en sortie).
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const exercises = JSON.parse(
  readFileSync(join(__dirname, '../src/data/exercices.v1.json'), 'utf8'),
)

const NONE = 'none'

function hasEquipment(exercise, ...required) {
  const eq = new Set(exercise.equipment ?? [])
  return required.every((r) => eq.has(r))
}

function isBwOnly(exercise) {
  const eq = exercise.equipment ?? []
  return eq.length === 1 && eq[0] === NONE
}

function isBwOrBand(exercise) {
  const eq = exercise.equipment ?? []
  return eq.length > 0 && eq.every((e) => e === NONE || e === 'band')
}

function findById(id) {
  return exercises.find((e) => e.exerciseId === id || e.id === id)
}

function findByPattern(pattern, filter) {
  return exercises.filter((e) => e.pattern === pattern && (!filter || filter(e)))
}

/** Slots P0 — exerciseId ou prédicat custom */
const P0_REQUIREMENTS = [
  {
    slot: 'pull_horizontal — inverted row standard',
    check: () =>
      findById('pull_horizontal__inverted_row__standard') ||
      findById('pull_horizontal__inverted_row__knees_bent'),
  },
  {
    slot: 'pull_horizontal — inverted row feet elevated',
    check: () => findById('pull_horizontal__inverted_row__feet_elevated'),
  },
  {
    slot: 'push_vertical — pike push-up',
    check: () => findById('push_vertical__pike_push_up__bodyweight'),
  },
  {
    slot: 'push_horizontal — decline push-up',
    check: () => findById('push_horizontal__push_up__decline'),
  },
  {
    slot: 'push_horizontal — chair dip',
    check: () => findById('push_horizontal__dip__chair'),
  },
  {
    slot: 'push_horizontal — parallel dip',
    check: () => findById('push_horizontal__dip__parallel'),
  },
  {
    slot: 'lower_squat — split/bulgarian bodyweight',
    check: () =>
      findById('lower_squat__split_squat__bodyweight') ||
      findById('lower_squat__bulgarian_split_squat__bodyweight'),
  },
  {
    slot: 'hinge — single leg RDL bodyweight',
    check: () => findById('hinge__single_leg_rdl__bodyweight'),
  },
  {
    slot: 'hamstring — nordic eccentric solo',
    check: () => findById('hamstring__nordic__eccentric_solo'),
  },
  {
    slot: 'carry — farmer backpack',
    check: () =>
      findById('carry__farmer_walk__backpack') || findById('locomotion__bear_crawl'),
  },
  {
    slot: 'carry — suitcase backpack',
    check: () => findById('carry__suitcase_walk__backpack'),
  },
  {
    slot: 'core_rotation — band explosive',
    check: () => findById('core_rotation__band_rotation__explosive'),
  },
  {
    slot: 'groin — copenhagen knee bodyweight',
    check: () => findById('groin_adductors__copenhagen_plank__knee'),
  },
  {
    slot: 'pull_vertical — band assisted',
    check: () => findById('pull_vertical__pull_up__band_assisted'),
  },
  {
    slot: 'pull_vertical — scap pull',
    check: () => findById('pull_vertical__scap_pull__bodyweight'),
  },
]

const RUGBY_PATTERNS = [
  'hinge',
  'squat',
  'lower_squat',
  'push_horizontal',
  'push_vertical',
  'pull_vertical',
  'pull_horizontal',
  'carry',
  'power',
  'lunge',
  'groin_adductors',
  'core_anti_extension',
  'core_rotation',
  'neck',
]

console.log('=== RugbyPrep — Audit couverture BW ===\n')
console.log(`Catalogue: ${exercises.length} exercices`)
console.log(`Tier 0 (none only): ${exercises.filter(isBwOnly).length}`)
console.log(`Tier 0–1 (none/band): ${exercises.filter(isBwOrBand).length}\n`)

console.log('--- Couverture tier 0 par pattern rugby ---')
for (const pattern of RUGBY_PATTERNS) {
  const bw = findByPattern(pattern, isBwOnly)
  const flag = bw.length === 0 ? '❌' : bw.length < 2 ? '⚠️' : '✅'
  console.log(
    `${flag} ${pattern.padEnd(22)} ${String(bw.length).padStart(2)}  ${bw
      .slice(0, 3)
      .map((e) => e.exerciseId)
      .join(', ')}${bw.length > 3 ? '…' : ''}`,
  )
}

console.log('\n--- Gaps P0 (must-have avant registre) ---')
const missing = []
for (const req of P0_REQUIREMENTS) {
  const ok = req.check()
  if (ok) {
    console.log(`✅ ${req.slot}`)
  } else {
    console.log(`❌ ${req.slot}`)
    missing.push(req.slot)
  }
}

console.log('\n--- Métadonnées à corriger ---')
const assistedMachine = findById('pull_vertical__pull_up__neutral__assisted')
if (assistedMachine?.equipment?.includes('machine')) {
  console.log(
    '⚠️ pull_vertical__pull_up__neutral__assisted → machine only (ajouter variante bande)',
  )
}

const copenhagenBench = ['groin_adductors__copenhagen_plank__short', 'groin_adductors__copenhagen_plank__long']
for (const id of copenhagenBench) {
  const ex = findById(id)
  if (ex && !ex.equipment?.includes(NONE)) {
    console.log(`⚠️ ${id} → requiert bench (ajouter variante genou au sol)`)
  }
}

console.log(`\n=== Résultat: ${missing.length} gap(s) P0 ===`)
if (missing.length > 0) {
  process.exit(1)
}

#!/usr/bin/env node
/**
 * One-shot — applique les 34 conversions reps fixe → fourchette
 * (modèle double progression) aux MD sources des sessions éligibles.
 *
 * Le format MD attendu :
 *   - Exercise A: `Exo Name` `Prescription`
 *
 * Après ce script, lancer :
 *   node scripts/generateMotherSessionsDataset.mjs
 * pour régénérer `src/data/motherSessions.generated.ts`.
 *
 * Le mirror FR (`src/services/motherSession/motherSessionContentFr.ts`) est
 * mis à jour par un script séparé (`applyDoubleProgressionFr.mjs`).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MD_ROOT = path.join(__dirname, '..', 'docs', 'training', 'mother-sessions', 'off-season')

/**
 * @typedef {{ exo: string, before: string, after: string }} Change
 */

/** @type {Record<string, Change[]>} */
const CHANGES = {
  'FULL_OFFSEASON_HYPERTROPHY_V1.md': [
    { exo: 'Trap Bar Deadlift', before: '4x6', after: '4x6-8' },
    { exo: 'Single-Arm DB Row', before: '4x8/side', after: '4x8-10/side' },
    { exo: 'Reverse Lunge', before: '3x8/side', after: '3x8-10/side' },
  ],
  'FULL_OFFSEASON_HYPERTROPHY_BACK_THREE_V1.md': [
    { exo: 'trap bar deadlift', before: '4x6', after: '4x6-8' },
    { exo: 'half-kneeling landmine press', before: '4x8/side', after: '4x8-10/side' },
    { exo: 'single-arm db row', before: '4x8/side', after: '4x8-10/side' },
    { exo: 'reverse lunge', before: '3x8/side', after: '3x8-10/side' },
  ],
  'LOWER_OFFSEASON_HYPERTROPHY_V1.md': [
    { exo: 'Back Squat', before: '4x8', after: '4x8-10' },
    { exo: 'Barbell Romanian Deadlift', before: '4x8', after: '4x8-10' },
    { exo: 'Rear-Foot Elevated Split Squat', before: '3-4x8/side', after: '3-4x8-10/side' },
  ],
  'LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1.md': [
    { exo: 'back squat', before: '4x8', after: '4x8-10' },
    { exo: 'single-leg romanian deadlift', before: '4x8/side', after: '4x8-10/side' },
    { exo: 'reverse lunge', before: '3-4x8/side', after: '3-4x8-10/side' },
    { exo: 'single-leg calf raise', before: '2-3x10/side', after: '2-3x10-12/side' },
    { exo: 'wall tibialis raise', before: '2-3x12', after: '2-3x12-15' },
    // low pogo hops volontairement non converti — exo pliométrique, fourchette pas pertinente
  ],
  'UPPER_OFFSEASON_HYPERTROPHY_V1.md': [
    { exo: 'Bench Press', before: '4x8', after: '4x8-10' },
    { exo: 'Seated DB Overhead Press', before: '3x8', after: '3x8-10' },
    { exo: 'Neutral-Grip Lat Pulldown', before: '3x10', after: '3x10-12' },
  ],
  'UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1.md': [
    { exo: 'bench press', before: '4x8', after: '4x8-10' },
    { exo: 'single-arm db row', before: '4x8/side', after: '4x8-10/side' },
    { exo: 'half-kneeling landmine press', before: '3-4x8/side', after: '3-4x8-10/side' },
  ],
  'FULL_OFFSEASON_TRANSITION_V1.md': [
    { exo: 'DB Incline Bench Press', before: '3x8', after: '3x8-10' },
    { exo: 'Single-Arm DB Row', before: '3x8/side', after: '3x8-10/side' },
    { exo: 'Reverse Lunge', before: '3x6/side', after: '3x6-8/side' },
  ],
  'LOWER_OFFSEASON_TRANSITION_V1.md': [
    { exo: 'Front Squat', before: '3x6', after: '3x6-8' },
    { exo: 'Barbell Romanian Deadlift', before: '3x6', after: '3x6-8' },
    { exo: 'Reverse Lunge', before: '3x6/side', after: '3x6-8/side' },
    { exo: 'Single-Leg RDL', before: '3x6/side', after: '3x6-8/side' },
    { exo: 'Single-Leg Calf Raise', before: '2x10/side', after: '2x10-12/side' },
    { exo: 'Wall Tibialis Raise', before: '2x12', after: '2x12-15' },
  ],
  'UPPER_OFFSEASON_TRANSITION_V1.md': [
    { exo: 'Bench Press', before: '3x6', after: '3x6-8' },
    { exo: 'Chest-Supported Row', before: '3x8', after: '3x8-10' },
    { exo: 'Half-Kneeling Landmine Press', before: '3x6/side', after: '3x6-8/side' },
    { exo: 'Neutral-Grip Lat Pulldown', before: '3x8', after: '3x8-10' },
  ],
}

let totalApplied = 0
let totalSkipped = 0

for (const [fileName, changes] of Object.entries(CHANGES)) {
  const filePath = path.join(MD_ROOT, fileName)
  let content = readFileSync(filePath, 'utf8')
  let appliedInFile = 0
  for (const change of changes) {
    // Pattern : `Exo Name` `prescription`  (entre backticks, séparés d'un espace)
    const needle = `\`${change.exo}\` \`${change.before}\``
    const replacement = `\`${change.exo}\` \`${change.after}\``
    if (content.includes(needle)) {
      content = content.replace(needle, replacement)
      appliedInFile += 1
      totalApplied += 1
    } else {
      console.warn(
        `  ⚠️  ${fileName} : motif introuvable pour "${change.exo}" (${change.before})`,
      )
      totalSkipped += 1
    }
  }
  writeFileSync(filePath, content, 'utf8')
  console.log(`✓ ${fileName} — ${appliedInFile}/${changes.length} appliqués`)
}

console.log(`\nTotal : ${totalApplied} appliqués, ${totalSkipped} introuvables.`)
if (totalSkipped > 0) {
  process.exit(1)
}

#!/usr/bin/env node
/**
 * Met à jour le mirror FR (`motherSessionContentFr.ts`) pour les 6 sessions
 * Hypertrophie off-season impactées par la double-progression.
 *
 * Les sessions Transition ne sont PAS dans le mirror FR — elles utilisent le
 * fallback `buildGeneratedFrContent` qui traduit directement depuis le
 * dataset généré (déjà à jour après `generateMotherSessionsDataset.mjs`).
 *
 * Pattern remplacé : `{ name: '<exo>', prescription: '<before>' }`.
 * Toutes les occurrences (name+before) sont des cibles légitimes (variantes
 * FRONT_ROW + BACK_THREE qui doivent être mises à jour ensemble).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FR_FILE = path.join(__dirname, '..', 'src', 'services', 'motherSession', 'motherSessionContentFr.ts')

/** @type {Array<{ exo: string, before: string, after: string }>} */
const CHANGES = [
  // Lower hypertrophy (front_row + back_three)
  { exo: 'Back Squat', before: '4x8', after: '4x8-10' },
  { exo: 'Barbell Romanian Deadlift', before: '4x8', after: '4x8-10' },
  { exo: 'Rear-Foot Elevated Split Squat', before: '3-4x8/côté', after: '3-4x8-10/côté' },
  { exo: 'Single-Leg Romanian Deadlift', before: '4x8/côté', after: '4x8-10/côté' },
  { exo: 'Reverse Lunge', before: '3-4x8/côté', after: '3-4x8-10/côté' },
  { exo: 'Single-Leg Calf Raise', before: '2-3x10/côté', after: '2-3x10-12/côté' },
  { exo: 'Wall Tibialis Raise', before: '2-3x12', after: '2-3x12-15' },

  // Upper hypertrophy (front_row + back_three)
  { exo: 'Bench Press', before: '4x8', after: '4x8-10' },
  { exo: 'Seated DB Overhead Press', before: '3x8', after: '3x8-10' },
  { exo: 'Neutral-Grip Lat Pulldown', before: '3x10', after: '3x10-12' },
  { exo: 'Half-Kneeling Landmine Press', before: '3-4x8/côté', after: '3-4x8-10/côté' },

  // Full hypertrophy (front_row + back_three)
  { exo: 'Trap Bar Deadlift', before: '4x6', after: '4x6-8' },
  { exo: 'Single-Arm DB Row', before: '4x8/côté', after: '4x8-10/côté' },
  { exo: 'Reverse Lunge', before: '3x8/côté', after: '3x8-10/côté' },
  { exo: 'Half-Kneeling Landmine Press', before: '4x8/côté', after: '4x8-10/côté' },
]

let content = readFileSync(FR_FILE, 'utf8')
let totalApplied = 0

for (const change of CHANGES) {
  const needle = `{ name: '${change.exo}', prescription: '${change.before}' }`
  const replacement = `{ name: '${change.exo}', prescription: '${change.after}' }`
  // replaceAll : toutes les variantes FRONT_ROW + BACK_THREE doivent passer.
  const before = content
  content = content.split(needle).join(replacement)
  const occurrences = (before.length - content.length) / Math.max(1, needle.length - replacement.length || 1)
  if (before === content) {
    console.warn(`  ⚠️  Motif introuvable : ${needle}`)
    continue
  }
  // Comptage approximatif basé sur la diff de longueur — pour le report uniquement.
  const count = (before.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  console.log(`✓ ${change.exo} (${change.before} → ${change.after}) — ${count} occurrence(s)`)
  totalApplied += count
  void occurrences
}

writeFileSync(FR_FILE, content, 'utf8')
console.log(`\nTotal : ${totalApplied} prescription(s) mise(s) à jour dans le mirror FR.`)

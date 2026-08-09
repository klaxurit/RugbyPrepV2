#!/usr/bin/env node
/**
 * Injecte une ancre d'effort `@ RER X-Y` dans les prescriptions des mother
 * sessions qui n'en ont pas encore (ni %1RM, ni RER/RPE).
 *
 * Cibles (alignées sur le moteur de progression) :
 *   - off_season / pre_season : RER 1-2
 *   - in_season / playoffs     : RER 2-3
 *   - recovery / light primer  : RER 3-4 (volontairement plus large)
 *
 * Usage :
 *   node scripts/injectIntensityAnchors.mjs           # dry-run
 *   node scripts/injectIntensityAnchors.mjs --write   # écrit les MD
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SESSIONS_DIR = path.join(ROOT, 'docs/training/mother-sessions')
const WRITE = process.argv.includes('--write')

/** Exercices hors périmètre d'effort hypertrophie/force (balistique, mobilité, holds). */
const SKIP_NAME_RE =
  /jump|throw|plyo|slam|swing|bound|hop|sprint|shuttle|skip|carry|hold|plank|crawl|stretch|rotation isometric|isometric|pogo|sled|emom|minute /i

/** Prescription déjà ancrée, ou non-reps (temps / distance / directive). */
const ALREADY_ANCHORED_RE = /@|%|RER|RIR|RPE/i
const NON_REPS_RE = /\d+\s*(s|sec|min|m)\b|progressive\s+sets/i
const SETS_X_REPS_RE = /^\s*\d+(?:[-–]\d+)?\s*[x×]\s*\d+(?:[-–]\d+)?(?:\s*\/(?:side|côté|cote|direction))?\s*$/i

function rirForSession(id, cycle) {
  if (/RECOVERY|LIGHT_PRIMER|PLAYOFF_ACTIVATION/i.test(id)) return '3-4'
  if (cycle === 'in_season' || cycle === 'playoffs') return '2-3'
  return '1-2'
}

function cycleFromPath(filePath) {
  if (filePath.includes(`${path.sep}off-season${path.sep}`)) return 'off_season'
  if (filePath.includes(`${path.sep}pre-season${path.sep}`)) return 'pre_season'
  if (filePath.includes(`${path.sep}in-season${path.sep}`)) return 'in_season'
  if (filePath.includes(`${path.sep}playoffs${path.sep}`)) return 'playoffs'
  return 'in_season'
}

function extractExerciseName(line) {
  // `- Exercise A: \`Name\` \`prescription\``
  // `- \`name\` \`prescription\`` (warm-up — ignored via section gate)
  const m = line.match(/Exercise\s+[A-Z]:\s*`([^`]+)`\s*`([^`]*)`/i)
  if (!m) return null
  return { name: m[1], prescription: m[2], full: m[0] }
}

function shouldAnchor(name, prescription) {
  if (!prescription || !prescription.trim()) return false
  if (SKIP_NAME_RE.test(name)) return false
  if (ALREADY_ANCHORED_RE.test(prescription)) return false
  if (NON_REPS_RE.test(prescription)) return false
  // Ignore les annotations entre parenthèses pour juger le format sets×reps.
  const core = prescription.replace(/\s*\([^)]*\)/g, '').trim()
  return SETS_X_REPS_RE.test(core)
}

function rewriteCoachingEffort(text, rir) {
  let out = text
  // Harmonise les anciennes cibles RPE 6-8 / RPE 7-8 vers la zone RER.
  out = out.replace(/\bRPE\s*6\s*[-–]\s*8\b/gi, `RER ${rir}`)
  out = out.replace(/\bRPE\s*7\s*[-–]\s*8\b/gi, `RER ${rir}`)
  out = out.replace(/\baround\s+`RPE\s*6\s*[-–]\s*8`/gi, `target \`RER ${rir}\``)
  out = out.replace(/\bKeep\s+the\s+\w+(?:\s+\w+)?\s+around\s+`RPE\s*6\s*[-–]\s*8`/gi, (m) =>
    m.replace(/around\s+`RPE\s*6\s*[-–]\s*8`/i, `at \`RER ${rir}\``),
  )
  // Notes in-season qui disent encore RER 2-3 partout : hors saison on veut 1-2.
  if (rir === '1-2') {
    out = out.replace(/`RER\s*2\s*[-–]\s*3`/gi, '`RER 1-2`')
    out = out.replace(/\bRER\s*2\s*[-–]\s*3\b/gi, 'RER 1-2')
  }
  // Compat legacy : RIR (anglais) → RER (libellé app FR).
  out = out.replace(/\bRIR\b/g, 'RER')
  return out
}

function processFile(filePath) {
  const id = path.basename(filePath, '.md')
  const cycle = cycleFromPath(filePath)
  const rir = rirForSession(id, cycle)
  const original = fs.readFileSync(filePath, 'utf8')
  const lines = original.split('\n')

  let inVisibleBlocks = false
  let changed = 0
  const out = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    if (/^##\s+Visible Blocks/i.test(line)) inVisibleBlocks = true
    else if (/^##\s+/.test(line) && !/^##\s+Visible Blocks/i.test(line)) inVisibleBlocks = false

    if (inVisibleBlocks) {
      const ex = extractExerciseName(line)
      if (ex && shouldAnchor(ex.name, ex.prescription)) {
        const next = `${ex.prescription.trim()} @ RER ${rir}`
        line = line.replace(`\`${ex.prescription}\``, `\`${next}\``)
        changed += 1
      }
    }

    // Coaching notes / progression : aligner le langage d'effort.
    if (/RPE|RER|RIR/.test(line)) {
      const rewritten = rewriteCoachingEffort(line, rir)
      if (rewritten !== line) {
        line = rewritten
        changed += 1
      }
    }

    out.push(line)
  }

  const next = out.join('\n')
  if (WRITE && next !== original) fs.writeFileSync(filePath, next)
  return { id, cycle, rir, changed }
}

function walk(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(full))
    else if (entry.name.endsWith('.md') && entry.name !== 'README.md') files.push(full)
  }
  return files
}

const files = walk(SESSIONS_DIR)
const results = files.map(processFile)
const touched = results.filter((r) => r.changed > 0)
const totalChanges = touched.reduce((a, r) => a + r.changed, 0)

console.log(
  `${WRITE ? 'WRITE' : 'DRY-RUN'} — ${touched.length}/${files.length} séances, ${totalChanges} modifications`,
)
for (const r of touched.sort((a, b) => a.id.localeCompare(b.id))) {
  console.log(`  ${r.id} [${r.cycle} → RER ${r.rir}] ×${r.changed}`)
}

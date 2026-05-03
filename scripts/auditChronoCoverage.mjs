#!/usr/bin/env node
/**
 * Audit : pour chaque prescription des MotherSessions, classifier l'exo
 * (reps / time / distance / unknown) et lister :
 *  - les exos en TEMPS qui ne déclenchent PAS le chrono aujourd'hui
 *    (perDirection, ou autres edge cases)
 *  - les prescriptions qui parsent en `unknown` mais qui contiennent
 *    une notion de durée (ex. "5s per position" dans une parenthèse)
 *
 * Sortie : un récap groupé par cause (perDirection / hybrid / unknown).
 * Run : `node scripts/auditChronoCoverage.mjs`
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'motherSessions.generated.ts')

// Parser inline (mirror simplifié de src/services/ui/exerciseSetSpec.ts).
// Pas d'import TS depuis Node sans transpile — on duplique juste le regex.
const RE_WITH_SETS =
  /^\s*(\d+)(?:[-–](\d+))?\s*[x×]\s*(\d+)(?:[-–](\d+))?\s*(s|sec|min|m)?\s*(?:\/(side|côté|cote|direction))?/i
const RE_NO_SETS =
  /^\s*(\d+)(?:[-–](\d+))?\s*(s|sec|min|m|reps?)?\s*(?:\/(side|côté|cote|direction))?/i

function classify(prescription) {
  if (!prescription || /progressive\s+sets/i.test(prescription)) return { kind: 'unknown' }
  const sanitized = prescription.replace(/\s*\([^)]*\)/g, '').replace(/[`*]/g, '').trim()
  let m = RE_WITH_SETS.exec(sanitized)
  let unit, qual
  if (m) {
    unit = (m[5] ?? '').toLowerCase()
    qual = (m[6] ?? '').toLowerCase()
  } else {
    m = RE_NO_SETS.exec(sanitized)
    if (!m) return { kind: 'unknown' }
    const u = (m[3] ?? '').toLowerCase()
    unit = u === 'reps' || u === 'rep' ? '' : u
    qual = (m[4] ?? '').toLowerCase()
  }
  if (unit === 's' || unit === 'sec' || unit === 'min') {
    return { kind: 'time', perSide: ['side', 'côté', 'cote'].includes(qual), perDirection: qual === 'direction' }
  }
  if (unit === 'm') return { kind: 'distance' }
  return { kind: 'reps' }
}

function detectsHiddenTime(prescription) {
  // Exos en reps mais avec une note "Xs per position" → hybride iso.
  return /\bs\s*per\s*position/i.test(prescription) || /\bs per direction/i.test(prescription)
}

const raw = readFileSync(DATA_FILE, 'utf8')
const exoRe = /"name":\s*"([^"]+)",\s*"prescription":\s*"([^"]+)"/g
const sessionIdRe = /"id":\s*"([^"]+_V\d+)"/g

// Find session boundaries to associate exos to their session ID
const sessionBoundaries = []
let mid
const sessionStartRe = /"id":\s*"([^"]+_V\d+)"/g
while ((mid = sessionStartRe.exec(raw)) !== null) {
  sessionBoundaries.push({ id: mid[1], offset: mid.index })
}
function sessionAt(offset) {
  let last = ''
  for (const s of sessionBoundaries) {
    if (s.offset <= offset) last = s.id
    else break
  }
  return last
}

const findings = {
  perDirection: [],
  hybridIso: [],
  timeOK: 0,
  reps: 0,
  distance: 0,
  unknown: [],
}

let m
while ((m = exoRe.exec(raw)) !== null) {
  const name = m[1]
  const prescription = m[2]
  const session = sessionAt(m.index)
  const spec = classify(prescription)

  if (spec.kind === 'time') {
    if (spec.perDirection) {
      findings.perDirection.push({ session, name, prescription })
    } else {
      findings.timeOK += 1
    }
    continue
  }
  if (spec.kind === 'reps') {
    if (detectsHiddenTime(prescription)) {
      findings.hybridIso.push({ session, name, prescription })
    } else {
      findings.reps += 1
    }
    continue
  }
  if (spec.kind === 'distance') {
    findings.distance += 1
    continue
  }
  if (spec.kind === 'unknown') {
    findings.unknown.push({ session, name, prescription })
  }
}

// Drop session IDs we matched as part of unrelated names (heuristic via empty/null)
findings.unknown = findings.unknown.filter((u) => u.prescription && u.prescription !== '')
const fmtRow = (r) => `  · ${r.session.padEnd(50)} · ${r.name.padEnd(30)} · ${r.prescription}`

console.log('=== Chrono coverage audit ===\n')
console.log(`Time exos déjà couverts par le chrono : ${findings.timeOK}`)
console.log(`Reps : ${findings.reps}`)
console.log(`Distance : ${findings.distance}`)
console.log()
console.log(`⚠️  /direction (chrono pas câblé aujourd'hui) — ${findings.perDirection.length} occurrences :`)
const seenDir = new Set()
for (const r of findings.perDirection) {
  const key = `${r.session}::${r.name}`
  if (seenDir.has(key)) continue
  seenDir.add(key)
  console.log(fmtRow(r))
}
console.log()
console.log(`⚠️  Iso hybride (reps + "Xs per position" en parenthèse) — ${findings.hybridIso.length} occurrences :`)
const seenHybrid = new Set()
for (const r of findings.hybridIso) {
  const key = `${r.session}::${r.name}`
  if (seenHybrid.has(key)) continue
  seenHybrid.add(key)
  console.log(fmtRow(r))
}
console.log()
console.log(`Unknown / non parsés (${findings.unknown.length}) :`)
const seenUnk = new Set()
for (const r of findings.unknown) {
  const key = `${r.name}::${r.prescription}`
  if (seenUnk.has(key)) continue
  seenUnk.add(key)
  console.log(fmtRow(r))
}

#!/usr/bin/env node
/**
 * Inventaire des prescriptions à reps fixes éligibles à un passage en
 * fourchette (modèle "double progression" pour l'hypertrophie).
 *
 * Filtres :
 *  · Sessions éligibles : Hypertrophie off-season, Transition off-season,
 *    Full Body in-season (maintenance hypertrophie). Force-Bridge,
 *    Pré-saison, In-season Lower/Upper (DUP Force/Power), Recovery,
 *    Primer et Speed/Power sont EXCLUS — fourchette = bruit sur du
 *    travail calibré au %1RM ou à la vitesse de barre.
 *  · Reps cibles : ≥6 (zone hypertrophie). 1-5 reps = force pure, skip.
 *  · Skip si la prescription est déjà une fourchette.
 *
 * Sortie : groupée par session, format `{block} · {exo} : {ancien} → {nouveau}`.
 * Run : `node scripts/auditDoubleProgression.mjs`
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'motherSessions.generated.ts')

const ELIGIBLE_SESSIONS = new Set([
  'LOWER_OFFSEASON_HYPERTROPHY_V1',
  'LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
  'UPPER_OFFSEASON_HYPERTROPHY_V1',
  'UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
  'FULL_OFFSEASON_HYPERTROPHY_V1',
  'FULL_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
  'LOWER_OFFSEASON_TRANSITION_V1',
  'UPPER_OFFSEASON_TRANSITION_V1',
  'FULL_OFFSEASON_TRANSITION_V1',
  'FULL_BODY_IN_SEASON_BACK_THREE_V1',
  'FULL_BODY_IN_SEASON_FRONT_ROW_V1',
])

/** Conversion "double progression" : reps fixe → fourchette de progression. */
function proposeRange(reps) {
  if (reps < 6) return null // force range, skip
  if (reps >= 12) return [reps, reps + 3]
  return [reps, reps + 2]
}

/**
 * Parse une prescription en reps.
 * Retourne { sets, repsLow, repsHigh, perSide, raw } ou null.
 */
function parseReps(prescription) {
  const sanitized = prescription.replace(/\s*\([^)]*\)/g, '').replace(/[`*]/g, '').trim()
  if (/progressive\s+sets/i.test(sanitized)) return null
  // "Nx<reps>[-<repsHigh>][/qual]" — ignore @%1RM annotations.
  const m = /^(\d+)(?:[-–](\d+))?\s*[x×]\s*(\d+)(?:[-–](\d+))?\s*(s|sec|min|m)?\s*(?:\/(side|côté|cote|direction))?/i.exec(sanitized)
  if (!m) return null
  const setsLow = Number(m[1])
  const setsHigh = m[2] ? Number(m[2]) : setsLow
  const repsLow = Number(m[3])
  const repsHigh = m[4] ? Number(m[4]) : repsLow
  const unit = (m[5] ?? '').toLowerCase()
  const qual = (m[6] ?? '').toLowerCase()
  // Ignore time / distance prescriptions.
  if (unit === 's' || unit === 'sec' || unit === 'min' || unit === 'm') return null
  return {
    setsLow,
    setsHigh,
    repsLow,
    repsHigh,
    perSide: ['side', 'côté', 'cote'].includes(qual),
    qual,
    isRange: repsLow !== repsHigh,
  }
}

function formatProposal(parsed, [newLow, newHigh]) {
  const setsPart =
    parsed.setsLow === parsed.setsHigh ? `${parsed.setsLow}` : `${parsed.setsLow}-${parsed.setsHigh}`
  const sidePart = parsed.qual ? `/${parsed.qual}` : ''
  return `${setsPart}x${newLow}-${newHigh}${sidePart}`
}

const raw = readFileSync(DATA_FILE, 'utf8')

// Parse sessions roughly: each session block starts with `"id": "..."` and ends
// with the next session id or EOF. Within each session, exos appear as
// { name, prescription, ... } objects.
const sessionRe = /"id":\s*"([^"]+_V\d+)"/g
const sessionStarts = []
let m
while ((m = sessionRe.exec(raw)) !== null) {
  sessionStarts.push({ id: m[1], offset: m.index })
}

// Append sentinel for last session boundary
sessionStarts.push({ id: '__END__', offset: raw.length })

const findings = []
for (let i = 0; i < sessionStarts.length - 1; i++) {
  const { id, offset } = sessionStarts[i]
  if (!ELIGIBLE_SESSIONS.has(id)) continue
  const next = sessionStarts[i + 1].offset
  const slice = raw.slice(offset, next)

  // Skip the warm-up section. The blocks array starts at `"blocks": [`.
  const blocksStart = slice.indexOf('"blocks":')
  if (blocksStart < 0) continue
  const blocksSlice = slice.slice(blocksStart)

  // Each block has: { "number": N, "name": "...", "exercises": [...] }
  const blockRe = /"number":\s*\d+,\s*"name":\s*"([^"]+)"[\s\S]*?"exercises":\s*\[([\s\S]*?)\]/g
  let bm
  while ((bm = blockRe.exec(blocksSlice)) !== null) {
    const blockName = bm[1]
    const exoSlice = bm[2]
    const exoRe = /"name":\s*"([^"]+)",\s*"prescription":\s*"([^"]+)"/g
    let em
    while ((em = exoRe.exec(exoSlice)) !== null) {
      const exoName = em[1]
      const prescription = em[2]
      const parsed = parseReps(prescription)
      if (!parsed) continue
      if (parsed.isRange) continue // already a range
      const proposal = proposeRange(parsed.repsLow)
      if (!proposal) continue // < 6 reps = force range
      const newPrescription = formatProposal(parsed, proposal)
      findings.push({
        session: id,
        block: blockName,
        exo: exoName,
        before: prescription,
        after: newPrescription,
      })
    }
  }
}

// Group output by session.
const bySession = new Map()
for (const f of findings) {
  if (!bySession.has(f.session)) bySession.set(f.session, [])
  bySession.get(f.session).push(f)
}

console.log(`=== Inventaire double progression — ${findings.length} prescriptions à convertir ===\n`)
for (const [sessionId, items] of bySession) {
  console.log(`### ${sessionId}  (${items.length})`)
  for (const f of items) {
    const blockShort = f.block.length > 40 ? f.block.slice(0, 37) + '...' : f.block
    const exoShort = f.exo.length > 30 ? f.exo.slice(0, 27) + '...' : f.exo
    console.log(`  · ${blockShort.padEnd(40)} · ${exoShort.padEnd(30)} : ${f.before.padEnd(12)} → ${f.after}`)
  }
  console.log('')
}

console.log(`Total : ${findings.length} prescriptions sur ${ELIGIBLE_SESSIONS.size} sessions éligibles.`)

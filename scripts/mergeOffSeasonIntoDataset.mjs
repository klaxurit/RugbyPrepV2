/**
 * Upsert/replace merge for off-season mother sessions.
 *
 * Parses all markdown files under docs/training/mother-sessions/off-season/,
 * then merges them into the existing generated dataset:
 *   - REPLACE existing off-season sessions in place with the parsed version
 *   - APPEND genuinely new off-season sessions at the end
 *   - PRESERVE all non-off-season sessions untouched
 *
 * Usage: node scripts/mergeOffSeasonIntoDataset.mjs
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const outTsPath = path.join(repoRoot, 'src', 'data', 'motherSessions.generated.ts')

// ── 1. Parse off-season MD files via the project parser ──────────────────────

const tempScript = `
import { parseAllMotherSessions } from './src/services/motherSession/parseAllMotherSessions';
import * as fs from 'fs';
import * as path from 'path';

const mdDir = path.join(process.cwd(), 'docs/training/mother-sessions/off-season');
const files = fs.readdirSync(mdDir).filter(f => f.endsWith('.md')).sort();
const inputs = files.map(f => ({
  filePath: 'off-season/' + f,
  markdown: fs.readFileSync(path.join(mdDir, f), 'utf8'),
}));
const { sessions } = parseAllMotherSessions(inputs);
console.log(JSON.stringify(sessions));
`

let parsedSessions
try {
  const jsonOut = execSync(
    `npx tsx -e "${tempScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  )
  parsedSessions = JSON.parse(jsonOut)
} catch (e) {
  console.error('Failed to parse off-season MD files:', e.message)
  process.exit(1)
}

const parsedById = new Map(parsedSessions.map(s => [s.metadata.id, s]))
console.log(`Parsed ${parsedSessions.length} off-season session(s) from markdown.\n`)

// ── 2. Load existing dataset ─────────────────────────────────────────────────

const existingJson = execSync(
  `npx tsx -e "import { MOTHER_SESSIONS } from './src/data/motherSessions.generated'; console.log(JSON.stringify(MOTHER_SESSIONS))"`,
  { cwd: repoRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
)
const existingSessions = JSON.parse(existingJson)

// ── 3. Upsert/replace merge ─────────────────────────────────────────────────

let replaced = 0
let unchanged = 0
const consumedIds = new Set()

// Pass 1: walk existing sessions in order, replace off-season ones in place
const merged = existingSessions.map(s => {
  const id = s.metadata.id
  if (parsedById.has(id)) {
    consumedIds.add(id)
    replaced++
    console.log(`  ~ replaced: ${id}`)
    return parsedById.get(id)
  }
  unchanged++
  return s
})

// Pass 2: append genuinely new off-season sessions (not yet in the dataset)
let added = 0
for (const [id, session] of parsedById) {
  if (!consumedIds.has(id)) {
    merged.push(session)
    added++
    console.log(`  + added:    ${id}`)
  }
}

// ── 4. Write output ──────────────────────────────────────────────────────────

const header = `/**
 * AUTO-GÉNÉRÉ — ne pas modifier à la main.
 *
 * Sources :
 *   - Off-season : docs/training/mother-sessions/off-season/ (markdown)
 *   - Autres cycles : contenu inline (migration MD à venir)
 *
 * Régénération off-season :
 *   node scripts/mergeOffSeasonIntoDataset.mjs
 *
 * ⚠  NE PAS lancer generateMotherSessionsDataset.mjs tant que
 *    les sessions pré-saison et in-season n'ont pas de source MD.
 */

import type { MotherSession } from '../types/motherSession'

`

const sessionsLiteral = `export const MOTHER_SESSIONS: MotherSession[] = ${JSON.stringify(merged, null, 2)}`
const byIdBlock = `
export const MOTHER_SESSIONS_BY_ID: Record<string, MotherSession> = MOTHER_SESSIONS.reduce(
  (acc, s) => {
    acc[s.metadata.id] = s
    return acc
  },
  {} as Record<string, MotherSession>
)
`

fs.writeFileSync(outTsPath, `${header}${sessionsLiteral}\n${byIdBlock}\n`, 'utf8')

console.log(`
Summary:
  replaced:  ${replaced}
  added:     ${added}
  unchanged: ${unchanged}
  parsed:    ${parsedSessions.length} off-season MD files
  total:     ${merged.length} sessions in dataset
`)

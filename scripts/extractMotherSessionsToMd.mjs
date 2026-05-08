/**
 * Extract mother sessions from src/data/motherSessions.generated.ts
 * to Markdown source files in docs/training/mother-sessions/<cycle>/.
 *
 * Replaces extractOffSeasonToMd.mjs — handles all 3 cycles uniformly.
 *
 * Usage:
 *   node scripts/extractMotherSessionsToMd.mjs                # all cycles
 *   node scripts/extractMotherSessionsToMd.mjs --cycle in_season
 *   node scripts/extractMotherSessionsToMd.mjs --cycle pre_season
 *   node scripts/extractMotherSessionsToMd.mjs --cycle off_season
 *
 * The Markdown format round-trips through src/services/motherSession/
 * parseMotherSession.ts (verified by Phase B' round-trip check).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const baseDir = path.join(repoRoot, 'docs', 'training', 'mother-sessions')

const args = process.argv.slice(2)
const cycleFilter = (() => {
  const idx = args.indexOf('--cycle')
  if (idx < 0) return null
  return args[idx + 1]
})()

const VALID_CYCLES = ['off_season', 'pre_season', 'in_season']
if (cycleFilter && !VALID_CYCLES.includes(cycleFilter)) {
  console.error(`Invalid --cycle value: "${cycleFilter}". Use one of: ${VALID_CYCLES.join(', ')}`)
  process.exit(1)
}

const cyclesToWrite = cycleFilter ? [cycleFilter] : VALID_CYCLES

const jsonOut = execSync(
  `npx tsx -e "import { MOTHER_SESSIONS } from './src/data/motherSessions.generated'; console.log(JSON.stringify(MOTHER_SESSIONS))"`,
  { cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
)
const allSessions = JSON.parse(jsonOut)

function cycleSlug(cycle) {
  return cycle.replace('_', '-')
}

function sessionToMd(s) {
  const m = s.metadata
  let md = `# ${m.id}\n\n`
  md += `- \`status\`: ${m.status}\n`
  md += `- \`version\`: ${m.version}\n`
  md += `- \`cycle\`: ${m.cycle}\n`
  md += `- \`session_type\`: ${m.sessionType}\n`
  md += `- \`target_level\`: ${m.targetLevel}\n`
  md += `- \`target_position_group\`: ${m.targetPositionGroup}\n`
  md += `- \`equipment\`: ${m.equipment}\n`
  md += `- \`target_duration\`: ${m.targetDuration}\n\n`

  md += `## Goal\n`
  for (const g of s.goal) md += `- ${g}\n`

  md += `\n## Session Identity\n`
  for (const si of s.sessionIdentity) md += `- ${si}\n`

  md += `\n## Warm-Up\nWarm-up is stored as a collapsible recommendation rather than a mandatory visible block.\n\n### Recommended warm-up\n`
  for (const ex of s.warmUp.exercises) md += `- \`${ex.name}\` \`${ex.prescription}\`\n`
  md += `\n### Notes\n`
  for (const n of s.warmUp.notes) md += `- ${n}\n`

  md += `\n## Visible Blocks\n\n`
  for (const block of s.blocks) {
    const optional = block.isOptional ? 'Optional ' : ''
    md += `### ${optional}Block ${block.number} - ${block.name}\n`
    if (block.format) md += `- Format: ${block.format}\n`
    for (let i = 0; i < block.exercises.length; i++) {
      const ex = block.exercises[i]
      const letter = String.fromCharCode(65 + i)
      let line = `- Exercise ${letter}: `
      if (ex.role) line += `(${ex.role}) `
      if (ex.slotLabel) line += `${ex.slotLabel} `
      line += `\`${ex.name}\` \`${ex.prescription}\``
      md += line + '\n'
    }
    md += `- Coaching notes:\n`
    for (const cn of block.coachingNotes) md += `  - ${cn}\n`
    if (block.fallbackOptions && block.fallbackOptions.length > 0) {
      md += `  - Fallback options:\n`
      for (const fo of block.fallbackOptions) md += `    - ${fo}\n`
    }
    md += `\n`
  }

  md += `## Progression Rules\n`
  for (const pr of s.progressionRules) md += `- ${pr}\n`

  md += `\n## Position Accent\n`
  for (const pa of s.positionAccent) md += `- ${pa}\n`

  md += `\n## Injury Substitutions\n\n`
  for (const inj of s.injurySubstitutions) {
    md += `### ${inj.area.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}\n`
    md += `- Remove:\n`
    for (const r of inj.remove) md += `  - ${r}\n`
    md += `- Replace with:\n`
    for (const r of inj.replaceWith) md += `  - ${r}\n`
    md += `- Rehab finisher:\n`
    for (const r of inj.rehabFinisher) md += `  - ${r}\n`
    md += `\n`
  }

  md += `## Coaching Warnings\n`
  for (const cw of s.coachingWarnings) md += `- ${cw}\n`

  md += `\n## Source References\n`
  for (const sr of s.sourceReferences) md += `- ${sr}\n`

  return md
}

let totalCount = 0
for (const cycle of cyclesToWrite) {
  const cycleDir = path.join(baseDir, cycleSlug(cycle))
  fs.mkdirSync(cycleDir, { recursive: true })

  const sessions = allSessions.filter((s) => s.metadata.cycle === cycle)
  for (const s of sessions) {
    const filename = `${s.metadata.id}.md`
    const filepath = path.join(cycleDir, filename)
    fs.writeFileSync(filepath, sessionToMd(s), 'utf8')
    totalCount++
    console.log(`  wrote: ${cycleSlug(cycle)}/${filename}`)
  }
  console.log(`  → ${sessions.length} ${cycle} sessions`)
}

console.log(`\nDone: ${totalCount} mother session MD files written under ${path.relative(repoRoot, baseDir)}/`)

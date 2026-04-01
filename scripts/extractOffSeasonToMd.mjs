/**
 * Extracts all off-season mother sessions from the generated TS file
 * and writes them as Markdown source files in docs/training/mother-sessions/off-season/.
 *
 * Usage: node scripts/extractOffSeasonToMd.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const outDir = path.join(repoRoot, 'docs', 'training', 'mother-sessions', 'off-season')

// Dynamically load the generated dataset
// Use a child process with tsx to import TS module
import { execSync } from 'node:child_process'

const jsonOut = execSync(
  `npx tsx -e "import { MOTHER_SESSIONS } from './src/data/motherSessions.generated'; console.log(JSON.stringify(MOTHER_SESSIONS.filter(s => s.metadata.cycle === 'off_season')))"`,
  { cwd: repoRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
)
const offSeasonSessions = JSON.parse(jsonOut)

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
  md += `- \`target_duration\`: ${m.targetDuration}\n`
  md += '\n'

  // Goal
  md += '## Goal\n'
  for (const g of s.goal) md += `- ${g}\n`
  md += '\n'

  // Session Identity
  md += '## Session Identity\n'
  for (const si of s.sessionIdentity) md += `- ${si}\n`
  md += '\n'

  // Warm-Up
  md += '## Warm-Up\nWarm-up is stored as a collapsible recommendation rather than a mandatory visible block.\n\n'
  md += '### Recommended warm-up\n'
  for (const ex of s.warmUp.exercises) {
    md += `- \`${ex.name}\` \`${ex.prescription}\`\n`
  }
  md += '\n### Notes\n'
  for (const n of s.warmUp.notes) md += `- ${n}\n`
  md += '\n'

  // Blocks
  md += '## Visible Blocks\n\n'
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
    md += '- Coaching notes:\n'
    for (const cn of block.coachingNotes) md += `  - ${cn}\n`
    if (block.fallbackOptions && block.fallbackOptions.length > 0) {
      md += '  - Fallback options:\n'
      for (const fo of block.fallbackOptions) md += `    - ${fo}\n`
    }
    md += '\n'
  }

  // Progression Rules
  md += '## Progression Rules\n'
  for (const pr of s.progressionRules) md += `- ${pr}\n`
  md += '\n'

  // Position Accent
  md += '## Position Accent\n'
  for (const pa of s.positionAccent) md += `- ${pa}\n`
  md += '\n'

  // Injury Substitutions
  md += '## Injury Substitutions\n\n'
  for (const inj of s.injurySubstitutions) {
    md += `### ${inj.area.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}\n`
    md += '- Remove:\n'
    for (const r of inj.remove) md += `  - ${r}\n`
    md += '- Replace with:\n'
    for (const r of inj.replaceWith) md += `  - ${r}\n`
    md += '- Rehab finisher:\n'
    for (const r of inj.rehabFinisher) md += `  - ${r}\n`
    md += '\n'
  }

  // Coaching Warnings
  md += '## Coaching Warnings\n'
  for (const cw of s.coachingWarnings) md += `- ${cw}\n`
  md += '\n'

  // Source References
  md += '## Source References\n'
  for (const sr of s.sourceReferences) md += `- ${sr}\n`

  return md
}

fs.mkdirSync(outDir, { recursive: true })

let count = 0
for (const s of offSeasonSessions) {
  const filename = `${s.metadata.id}.md`
  const filepath = path.join(outDir, filename)
  const md = sessionToMd(s)
  fs.writeFileSync(filepath, md, 'utf8')
  count++
  console.log(`  wrote: ${filename}`)
}

console.log(`\nDone: ${count} off-season session MD files written to ${path.relative(repoRoot, outDir)}/`)

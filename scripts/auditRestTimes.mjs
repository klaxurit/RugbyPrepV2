/**
 * B2 audit — extract rest times from motherSessions and compare to KB ranges.
 *
 * Usage:
 *   node scripts/auditRestTimes.mjs               # writes CSV + markdown
 *   node scripts/auditRestTimes.mjs --stdout      # also print summary to stdout
 *
 * Writes:
 *   docs/b2-rest-times-findings.csv               # one row per block
 *   docs/b2-rest-times-findings.md                # human-readable summary
 *
 * Pure read of src/data/motherSessions.generated.ts (no DB, no network).
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const csvOut = path.join(repoRoot, 'docs', 'b2-rest-times-findings.csv')
const mdOut = path.join(repoRoot, 'docs', 'b2-rest-times-findings.md')

const driverScript = `
import { MOTHER_SESSIONS } from './src/data/motherSessions.generated';
import { auditAllSessions, summarize } from './src/data/__audits__/restTimes/auditBlock';
const rows = auditAllSessions(MOTHER_SESSIONS);
const summary = summarize(rows);
console.log(JSON.stringify({ rows, summary }));
`

let payload
try {
  const jsonOut = execSync(`npx tsx -e "${driverScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  payload = JSON.parse(jsonOut)
} catch (e) {
  console.error('Audit driver failed:', e.message)
  process.exit(1)
}

const { rows, summary } = payload

// ── CSV ─────────────────────────────────────────────────────────────────────

const csvHeader = [
  'sessionId',
  'cycle',
  'blockNum',
  'blockName',
  'intent',
  'parsedKind',
  'parsedMin',
  'parsedMax',
  'kbMin',
  'kbMax',
  'tolerance',
  'status',
  'reason',
  'rawFormat',
].join(',')

const csvRows = rows.map((r) => {
  const fields = [
    r.sessionId,
    r.cycle,
    r.blockNum,
    csvEscape(r.blockName),
    r.intent,
    r.parsedKind,
    r.parsedMin ?? '',
    r.parsedMax ?? '',
    r.kbMin ?? '',
    r.kbMax ?? '',
    r.toleranceSeconds,
    r.status,
    csvEscape(r.reason),
    csvEscape(r.rawFormat),
  ]
  return fields.join(',')
})

fs.writeFileSync(csvOut, [csvHeader, ...csvRows].join('\n') + '\n', 'utf8')
console.log(`Wrote ${csvOut} (${rows.length} rows)`)

// ── Markdown report ─────────────────────────────────────────────────────────

const failRows = rows.filter((r) => r.status.startsWith('FAIL'))
const skipRows = rows.filter((r) => r.status === 'SKIP')
const passRows = rows.filter((r) => r.status === 'PASS')

const md = []
md.push('# B2 — Rest times audit findings (Phase B dry-run)')
md.push('')
md.push(`**Generated:** ${new Date().toISOString()}`)
md.push(`**Total blocks:** ${summary.total}`)
md.push('')
md.push('## Status breakdown')
md.push('')
md.push('| Status | Count |')
md.push('|---|---:|')
for (const [status, count] of Object.entries(summary.byStatus)) {
  md.push(`| ${status} | ${count} |`)
}
md.push('')
md.push('## Per-intent breakdown')
md.push('')
md.push('| Intent | Total | Pass | Fail | Skip |')
md.push('|---|---:|---:|---:|---:|')
for (const [intent, stats] of Object.entries(summary.byIntent)) {
  md.push(`| ${intent} | ${stats.total} | ${stats.pass} | ${stats.fail} | ${stats.skip} |`)
}
md.push('')

if (failRows.length > 0) {
  md.push('## FAIL findings')
  md.push('')
  md.push('| Session | # | Block name | Intent | Parsed | KB | Status | Reason |')
  md.push('|---|--:|---|---|---|---|---|---|')
  for (const r of failRows) {
    const parsed = r.parsedMin === null ? r.parsedKind : `${r.parsedMin}-${r.parsedMax}s`
    const kb = r.kbMin === null ? '—' : `${r.kbMin}-${r.kbMax}s ±${r.toleranceSeconds}`
    md.push(`| \`${r.sessionId}\` | ${r.blockNum} | ${r.blockName} | ${r.intent} | ${parsed} | ${kb} | ${r.status} | ${r.reason} |`)
  }
  md.push('')
}

md.push('## Skipped (allowlist)')
md.push('')
const skipReasons = {}
for (const r of skipRows) {
  skipReasons[r.reason] = (skipReasons[r.reason] ?? 0) + 1
}
md.push('| Reason | Count |')
md.push('|---|---:|')
for (const [reason, count] of Object.entries(skipReasons).sort((a, b) => b[1] - a[1])) {
  md.push(`| ${reason} | ${count} |`)
}
md.push('')

md.push('## Sample PASS rows (first 10)')
md.push('')
md.push('| Session | # | Block name | Intent | Parsed | KB |')
md.push('|---|--:|---|---|---|---|')
for (const r of passRows.slice(0, 10)) {
  const parsed = `${r.parsedMin}-${r.parsedMax}s`
  const kb = `${r.kbMin}-${r.kbMax}s`
  md.push(`| \`${r.sessionId}\` | ${r.blockNum} | ${r.blockName} | ${r.intent} | ${parsed} | ${kb} |`)
}

fs.writeFileSync(mdOut, md.join('\n') + '\n', 'utf8')
console.log(`Wrote ${mdOut}`)

if (process.argv.includes('--stdout')) {
  console.log('\n=== SUMMARY ===')
  console.log(`Total: ${summary.total}`)
  console.log('By status:', summary.byStatus)
  console.log(`Failures: ${failRows.length}`)
}

if (failRows.length > 0) {
  process.exit(0) // Phase B is dry-run; surface findings without failing CI
}

function csvEscape(value) {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

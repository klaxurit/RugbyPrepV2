import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFParse } from 'pdf-parse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const inputPath = path.join(repoRoot, 'src/data/FFR_CLUB_LISTE.pdf')
const outputPath = path.join(repoRoot, 'src/data/ffrClubs.v2021.json')
const reportPath = path.join(repoRoot, 'docs/data/FFR_CLUB_LISTE_PARSE.md')

const LINE_PATTERN = /^(?<ligue>[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ'’\- ]+)\s(?<departmentCode>[A-Z0-9]{1,5})\s(?<code>\d{4}[A-Za-z])\s(?<name>.+)$/

const ignoredLine = (line) => {
  if (!line) return true
  if (line === 'Ligue CD Code') return true
  if (line === 'Club Nom club') return true
  if (line.startsWith('Liste des clubs inscrits')) return true
  if (line.startsWith('Semaine Nationale des Ecoles de Rugby')) return true
  if (line.startsWith('FFR-DS')) return true
  if (/^--\s\d+\sof\s\d+\s--$/.test(line)) return true
  return false
}

const normalizeSpaces = (value) => value.replace(/\s+/g, ' ').trim()

const run = async () => {
  const pdfBuffer = await fs.readFile(inputPath)
  const parser = new PDFParse({ data: pdfBuffer })
  const textResult = await parser.getText()
  await parser.destroy()

  const lines = textResult.text
    .split(/\r?\n/)
    .map((line) => normalizeSpaces(line))
    .filter((line) => !ignoredLine(line))

  const records = []
  const unmatched = []

  for (const line of lines) {
    const match = line.match(LINE_PATTERN)
    if (!match || !match.groups) {
      unmatched.push(line)
      continue
    }

    records.push({
      ligue: match.groups.ligue,
      departmentCode: match.groups.departmentCode,
      code: match.groups.code.toUpperCase(),
      name: match.groups.name,
    })
  }

  const dedupedMap = new Map()
  for (const record of records) {
    dedupedMap.set(record.code, record)
  }
  const deduped = [...dedupedMap.values()].sort((a, b) => a.code.localeCompare(b.code, 'fr'))

  await fs.writeFile(outputPath, `${JSON.stringify(deduped, null, 2)}\n`, 'utf8')

  const report = [
    '# Parse FFR Club List',
    '',
    `- Source: \`${path.relative(repoRoot, inputPath)}\``,
    `- Generated: \`${path.relative(repoRoot, outputPath)}\``,
    `- Parsed rows: **${records.length}**`,
    `- Unique club codes: **${deduped.length}**`,
    `- Unmatched lines: **${unmatched.length}**`,
    '',
    '## Samples',
    '',
    ...deduped.slice(0, 5).map((club) => `- ${club.code} | ${club.ligue} | ${club.departmentCode} | ${club.name}`),
    '',
  ]

  if (unmatched.length > 0) {
    report.push('## Unmatched (first 20)', '')
    for (const line of unmatched.slice(0, 20)) {
      report.push(`- ${line}`)
    }
    report.push('')
  }

  await fs.writeFile(reportPath, `${report.join('\n')}\n`, 'utf8')

  console.log(`Parsed rows: ${records.length}`)
  console.log(`Unique club codes: ${deduped.length}`)
  console.log(`Unmatched lines: ${unmatched.length}`)
  console.log(`Wrote: ${path.relative(repoRoot, outputPath)}`)
  console.log(`Wrote: ${path.relative(repoRoot, reportPath)}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

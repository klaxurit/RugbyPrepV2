import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const hostArg = process.argv.find((arg) => arg.startsWith('--host='))
const host = hostArg ? hostArg.replace('--host=', '').trim() : 'liguenormandie.ffr.fr'
const apiUrl = `https://api.${host}/wp-json/ffr/v1/clubssearch`

const outputPath = path.join(repoRoot, 'src/data/clubFfrIds.json')
const reportPath = path.join(repoRoot, 'docs/data/CLUB-LOGOS-FETCH-REPORT.md')

const extractFfrIdFromEmbleme = (url) => {
  if (typeof url !== 'string') return null
  const match = url.match(/\/club\/(\d+)\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i)
  return match ? Number(match[1]) : null
}

const run = async () => {
  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const clubs = await response.json()
  if (!Array.isArray(clubs)) {
    throw new Error('Unexpected payload: clubssearch did not return an array')
  }

  let existing = {}
  try {
    existing = JSON.parse(await fs.readFile(outputPath, 'utf8'))
  } catch {
    existing = {}
  }

  let added = 0
  let updated = 0
  let skipped = 0

  for (const club of clubs) {
    const code = typeof club?.code === 'string' ? club.code.toUpperCase() : null
    const ffrId = extractFfrIdFromEmbleme(club?.embleme)

    if (!code || !ffrId) {
      skipped += 1
      continue
    }

    if (!(code in existing)) {
      existing[code] = ffrId
      added += 1
      continue
    }

    if (existing[code] !== ffrId) {
      existing[code] = ffrId
      updated += 1
    }
  }

  const sortedEntries = Object.entries(existing).sort(([a], [b]) => a.localeCompare(b, 'fr'))
  const sortedObject = Object.fromEntries(sortedEntries)

  await fs.writeFile(outputPath, `${JSON.stringify(sortedObject, null, 2)}\n`, 'utf8')

  const report = [
    '# Club FFR IDs Fetch Report',
    '',
    `- Host: \`${host}\``,
    `- API: \`${apiUrl}\``,
    `- Clubs returned: **${clubs.length}**`,
    `- Added mappings: **${added}**`,
    `- Updated mappings: **${updated}**`,
    `- Skipped entries: **${skipped}**`,
    `- Total mappings now: **${sortedEntries.length}**`,
    '',
    '## Sample (first 10)',
    '',
    ...sortedEntries.slice(0, 10).map(([code, id]) => `- ${code} -> ${id}`),
    '',
  ]

  await fs.writeFile(reportPath, `${report.join('\n')}\n`, 'utf8')

  console.log(`Host: ${host}`)
  console.log(`Clubs returned: ${clubs.length}`)
  console.log(`Added mappings: ${added}`)
  console.log(`Updated mappings: ${updated}`)
  console.log(`Skipped entries: ${skipped}`)
  console.log(`Total mappings now: ${sortedEntries.length}`)
  console.log(`Wrote: ${path.relative(repoRoot, outputPath)}`)
  console.log(`Wrote: ${path.relative(repoRoot, reportPath)}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

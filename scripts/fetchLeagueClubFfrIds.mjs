import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const hostArg = process.argv.find((arg) => arg.startsWith('--host='))
const host = hostArg ? hostArg.replace('--host=', '').trim() : 'liguenormandie.ffr.fr'
const apiUrl = `https://api.${host}/wp-json/ffr/v1/clubssearch`
const baseUrl = `https://${host}`

const outputPath = path.join(repoRoot, 'src/data/clubFfrIds.json')
const reportPath = path.join(repoRoot, 'docs/data/CLUB-LOGOS-FETCH-REPORT.md')

const extractFfrIdFromEmbleme = (url) => {
  if (typeof url !== 'string') return null
  const match = url.match(/\/club\/(\d+)\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i)
  return match ? Number(match[1]) : null
}

const normalizeClubRecord = (club) => {
  const code = typeof club?.code === 'string' ? club.code.toUpperCase() : null
  const ffrId = extractFfrIdFromEmbleme(club?.embleme)
  return code && ffrId ? { code, ffrId } : null
}

const fetchJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} (${url})`)
  }
  return response.json()
}

const fetchText = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} (${url})`)
  }
  return response.text()
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const extractClubUrlsFromXml = (xml, hostName) => {
  const matches = [...xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)]
  return matches
    .map((match) => match[1].trim())
    .filter((url) => {
      try {
        const parsed = new URL(url)
        return parsed.host === hostName && parsed.pathname.startsWith('/clubs/')
      } catch {
        return false
      }
    })
}

const extractSitemapUrlsFromXml = (xml, hostName) => {
  const matches = [...xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)]
  return matches
    .map((match) => match[1].trim())
    .filter((url) => {
      try {
        const parsed = new URL(url)
        return parsed.host === hostName && parsed.pathname.endsWith('.xml')
      } catch {
        return false
      }
    })
}

const extractClubUrlsFromHtml = (html, hostName) => {
  const pathRegex = /href="(\/clubs\/[^"]+)"/g
  const absRegex = new RegExp(`href="(https?:\\\\/\\\\/${escapeRegExp(hostName).replaceAll('.', '\\\\.')}\\\\/clubs\\\\/[^"]+)"`, 'g')
  const urls = new Set()

  for (const match of html.matchAll(pathRegex)) {
    urls.add(new URL(match[1], `https://${hostName}`).toString())
  }

  for (const match of html.matchAll(absRegex)) {
    urls.add(match[1].replaceAll('\\/', '/'))
  }

  return [...urls]
}

const parseNextClubPage = (html, pageUrl) => {
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!nextDataMatch) {
    throw new Error(`Missing __NEXT_DATA__ in ${pageUrl}`)
  }

  const nextData = JSON.parse(nextDataMatch[1])
  const club = nextData?.props?.pageProps?.initialState?.clubState?.club
  if (!club || typeof club !== 'object') {
    throw new Error(`Missing clubState.club in ${pageUrl}`)
  }

  return club
}

const collectClubsFromSitemaps = async (hostName) => {
  const sitemapUrls = new Set([`https://${hostName}/sitemap.xml`])
  const visitedSitemaps = new Set()
  const clubUrls = new Set()
  let discoveredViaFallbackPage = false

  while (sitemapUrls.size > 0) {
    const currentUrl = [...sitemapUrls][0]
    sitemapUrls.delete(currentUrl)
    if (visitedSitemaps.has(currentUrl)) continue
    visitedSitemaps.add(currentUrl)

    try {
      const xml = await fetchText(currentUrl)
      for (const url of extractClubUrlsFromXml(xml, hostName)) {
        clubUrls.add(url)
      }
      for (const nested of extractSitemapUrlsFromXml(xml, hostName)) {
        if (!visitedSitemaps.has(nested)) sitemapUrls.add(nested)
      }
    } catch {
      // Some sites may not expose sitemap indexes in the expected format.
    }
  }

  if (clubUrls.size === 0) {
    const listingHtml = await fetchText(`https://${hostName}/trouver-un-club-de-rugby`)
    for (const url of extractClubUrlsFromHtml(listingHtml, hostName)) {
      clubUrls.add(url)
    }
    discoveredViaFallbackPage = true
  }

  if (clubUrls.size === 0) {
    throw new Error(`Could not discover club URLs for ${hostName}`)
  }

  const results = []
  let skipped = 0

  for (const clubUrl of [...clubUrls].sort((a, b) => a.localeCompare(b, 'fr'))) {
    try {
      const html = await fetchText(clubUrl)
      const club = parseNextClubPage(html, clubUrl)
      const normalized = normalizeClubRecord(club)
      if (normalized) {
        results.push(normalized)
      } else {
        skipped += 1
      }
    } catch {
      skipped += 1
    }
  }

  return {
    source: discoveredViaFallbackPage ? 'next-listing-pages' : 'next-sitemaps',
    clubs: results,
    discoveryCount: clubUrls.size,
    skippedPages: skipped,
  }
}

const fetchClubsForHost = async (hostName) => {
  try {
    const clubs = await fetchJson(`https://api.${hostName}/wp-json/ffr/v1/clubssearch`)
    if (!Array.isArray(clubs)) {
      throw new Error('Unexpected payload: clubssearch did not return an array')
    }
    return {
      source: 'clubssearch',
      api: `https://api.${hostName}/wp-json/ffr/v1/clubssearch`,
      clubs: clubs
        .map((club) => normalizeClubRecord(club))
        .filter((club) => club !== null),
      rawCount: clubs.length,
      skippedPages: 0,
      discoveryCount: clubs.length,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const shouldFallback =
      message.includes('ENOTFOUND') ||
      message.includes('404') ||
      message.includes('Failed to fetch') ||
      message.includes('fetch failed')

    if (!shouldFallback) {
      throw error
    }

    const fallback = await collectClubsFromSitemaps(hostName)
    return {
      source: fallback.source,
      api: `https://api.${hostName}/wp-json/ffr/v1/clubssearch`,
      clubs: fallback.clubs,
      rawCount: fallback.discoveryCount,
      skippedPages: fallback.skippedPages,
      discoveryCount: fallback.discoveryCount,
    }
  }
}

const run = async () => {
  const fetched = await fetchClubsForHost(host)

  let existing = {}
  try {
    existing = JSON.parse(await fs.readFile(outputPath, 'utf8'))
  } catch {
    existing = {}
  }

  let added = 0
  let updated = 0
  let skipped = 0

  for (const club of fetched.clubs) {
    const { code, ffrId } = club

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
    `- Base URL: \`${baseUrl}\``,
    `- Primary API tried: \`${fetched.api}\``,
    `- Source used: **${fetched.source}**`,
    `- Club pages/records discovered: **${fetched.discoveryCount}**`,
    `- Valid mappings extracted: **${fetched.clubs.length}**`,
    `- Added mappings: **${added}**`,
    `- Updated mappings: **${updated}**`,
    `- Skipped entries/pages: **${skipped + fetched.skippedPages}**`,
    `- Total mappings now: **${sortedEntries.length}**`,
    '',
    '## Sample (first 10)',
    '',
    ...sortedEntries.slice(0, 10).map(([code, id]) => `- ${code} -> ${id}`),
    '',
  ]

  await fs.writeFile(reportPath, `${report.join('\n')}\n`, 'utf8')

  console.log(`Host: ${host}`)
  console.log(`Source used: ${fetched.source}`)
  console.log(`Discovered records/pages: ${fetched.discoveryCount}`)
  console.log(`Valid mappings extracted: ${fetched.clubs.length}`)
  console.log(`Added mappings: ${added}`)
  console.log(`Updated mappings: ${updated}`)
  console.log(`Skipped entries/pages: ${skipped + fetched.skippedPages}`)
  console.log(`Total mappings now: ${sortedEntries.length}`)
  console.log(`Wrote: ${path.relative(repoRoot, outputPath)}`)
  console.log(`Wrote: ${path.relative(repoRoot, reportPath)}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

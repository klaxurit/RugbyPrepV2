import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const clubsPath = path.join(repoRoot, 'src/data/ffrClubs.v2021.json')
const outputPath = path.join(repoRoot, 'src/data/clubLogos.wikidata.json')

const limit = Number(process.env.LIMIT ?? '60')
const delayMs = Number(process.env.DELAY_MS ?? '160')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const loadExisting = async () => {
  try {
    const raw = await fs.readFile(outputPath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { updatedAt: null, source: 'wikidata', logos: {} }
  }
}

const getWikiSearchTitle = async (query) => {
  const url = new URL('https://fr.wikipedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('srlimit', '1')

  const response = await fetch(url)
  if (!response.ok) return null

  const payload = await response.json()
  const hit = payload?.query?.search?.[0]
  return typeof hit?.title === 'string' ? hit.title : null
}

const getWikidataIdFromTitle = async (title) => {
  const url = new URL('https://fr.wikipedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('prop', 'pageprops')
  url.searchParams.set('titles', title)
  url.searchParams.set('format', 'json')

  const response = await fetch(url)
  if (!response.ok) return null

  const payload = await response.json()
  const pages = payload?.query?.pages ?? {}

  const page = Object.values(pages)[0]
  const wikibaseItem = page?.pageprops?.wikibase_item
  return typeof wikibaseItem === 'string' ? wikibaseItem : null
}

const getLogoFileNameFromWikidata = async (wikidataId) => {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`
  const response = await fetch(url)
  if (!response.ok) return null

  const payload = await response.json()
  const entity = payload?.entities?.[wikidataId]
  const claims = entity?.claims?.P154
  if (!Array.isArray(claims) || claims.length === 0) return null

  const value = claims[0]?.mainsnak?.datavalue?.value
  return typeof value === 'string' ? value : null
}

const toCommonsFileUrl = (fileName) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`

const run = async () => {
  const clubs = JSON.parse(await fs.readFile(clubsPath, 'utf8'))
  const existing = await loadExisting()
  const logos = existing.logos ?? {}

  const pending = clubs.filter((club) => !logos[club.code]).slice(0, limit)

  let found = 0
  let notFound = 0

  for (const club of pending) {
    const query = `${club.name} rugby`

    try {
      const title = await getWikiSearchTitle(query)
      if (!title) {
        logos[club.code] = {
          status: 'not_found',
          clubName: club.name,
          ligue: club.ligue,
          searchedAt: new Date().toISOString(),
        }
        notFound += 1
        await sleep(delayMs)
        continue
      }

      const wikidataId = await getWikidataIdFromTitle(title)
      if (!wikidataId) {
        logos[club.code] = {
          status: 'not_found',
          clubName: club.name,
          ligue: club.ligue,
          wikipediaTitle: title,
          searchedAt: new Date().toISOString(),
        }
        notFound += 1
        await sleep(delayMs)
        continue
      }

      const logoFileName = await getLogoFileNameFromWikidata(wikidataId)
      if (!logoFileName) {
        logos[club.code] = {
          status: 'not_found',
          clubName: club.name,
          ligue: club.ligue,
          wikipediaTitle: title,
          wikidataId,
          searchedAt: new Date().toISOString(),
        }
        notFound += 1
        await sleep(delayMs)
        continue
      }

      logos[club.code] = {
        status: 'found',
        clubName: club.name,
        ligue: club.ligue,
        wikipediaTitle: title,
        wikidataId,
        logoFileName,
        logoUrl: toCommonsFileUrl(logoFileName),
        searchedAt: new Date().toISOString(),
      }
      found += 1
    } catch (error) {
      logos[club.code] = {
        status: 'error',
        clubName: club.name,
        ligue: club.ligue,
        error: error instanceof Error ? error.message : String(error),
        searchedAt: new Date().toISOString(),
      }
      notFound += 1
    }

    await sleep(delayMs)
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    source: 'wikidata',
    logos,
  }

  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  console.log(`Processed: ${pending.length}`)
  console.log(`Found: ${found}`)
  console.log(`Not found/error: ${notFound}`)
  console.log(`Output: ${path.relative(repoRoot, outputPath)}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

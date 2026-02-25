import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const manualPath = path.join(repoRoot, 'src/data/clubLogos.manual.json')
const clubsPath = path.join(repoRoot, 'src/data/ffrClubs.v2021.json')
const publicDir = path.join(repoRoot, 'public')
const checkRemote = process.argv.includes('--check-remote')

const loadJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'))

const isHttpUrl = (value) => /^https?:\/\//i.test(value)
const isPublicPath = (value) => value.startsWith('/')

const checkRemoteImage = async (url) => {
  try {
    let response = await fetch(url, { method: 'HEAD' })
    if (!response.ok || !String(response.headers.get('content-type') || '').startsWith('image/')) {
      response = await fetch(url, { method: 'GET' })
    }

    const contentType = String(response.headers.get('content-type') || '')
    return {
      ok: response.ok && contentType.startsWith('image/'),
      status: response.status,
      contentType,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const hasExpiringQuerySignature = (value) =>
  /[?&](X-Amz-|AWSAccessKeyId=|Signature=|Expires=)/i.test(value)

const run = async () => {
  const [manual, clubs] = await Promise.all([loadJson(manualPath), loadJson(clubsPath)])

  const knownCodes = new Set(
    Array.isArray(clubs) ? clubs.map((club) => String(club.code || '').toUpperCase()).filter(Boolean) : [],
  )

  if (!manual || typeof manual !== 'object' || Array.isArray(manual)) {
    throw new Error('src/data/clubLogos.manual.json must be a JSON object: { "CODE": "url-or-path" }')
  }

  const entries = Object.entries(manual)
  let errors = 0
  let warnings = 0
  let localCount = 0
  let remoteCount = 0

  console.log(`Entries: ${entries.length}`)
  console.log(`Remote check: ${checkRemote ? 'enabled' : 'disabled'}`)

  for (const [rawCode, rawValue] of entries) {
    const code = String(rawCode)
    const value = typeof rawValue === 'string' ? rawValue.trim() : ''
    const prefix = `[${code}]`

    if (code !== code.toUpperCase()) {
      console.error(`${prefix} ERROR code must be uppercase`)
      errors += 1
    }

    if (!knownCodes.has(code.toUpperCase())) {
      console.error(`${prefix} ERROR unknown club code (not found in ffrClubs.v2021.json)`)
      errors += 1
    }

    if (!value) {
      console.error(`${prefix} ERROR empty logo value`)
      errors += 1
      continue
    }

    if (isPublicPath(value)) {
      localCount += 1

      if (!value.startsWith('/club-logos/')) {
        console.warn(`${prefix} WARN local path should use /club-logos/... convention (current: ${value})`)
        warnings += 1
      }

      const diskPath = path.join(publicDir, value.replace(/^\//, ''))
      try {
        const stat = await fs.stat(diskPath)
        if (!stat.isFile()) {
          console.error(`${prefix} ERROR local path is not a file: ${value}`)
          errors += 1
        }
      } catch {
        console.error(`${prefix} ERROR missing local file: ${value} -> ${path.relative(repoRoot, diskPath)}`)
        errors += 1
      }
      continue
    }

    if (isHttpUrl(value)) {
      remoteCount += 1

      if (hasExpiringQuerySignature(value)) {
        console.warn(`${prefix} WARN URL looks signed/temporary (may expire). Prefer /public/club-logos files.`)
        warnings += 1
      }

      if (checkRemote) {
        const result = await checkRemoteImage(value)
        if (!result.ok) {
          console.error(
            `${prefix} ERROR remote image check failed (${result.status || 'network'} ${result.contentType || result.error || ''})`,
          )
          errors += 1
        }
      }
      continue
    }

    console.error(`${prefix} ERROR value must be an absolute URL (https://...) or public path (/club-logos/...)`)
    errors += 1
  }

  console.log(`Local paths: ${localCount}`)
  console.log(`Remote URLs: ${remoteCount}`)
  console.log(`Warnings: ${warnings}`)
  console.log(`Errors: ${errors}`)

  if (errors > 0) {
    process.exit(1)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

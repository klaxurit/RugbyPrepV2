/**
 * Génère `src/data/motherSessions.generated.ts` à partir des Markdown sous
 * `docs/training/mother-sessions/`.
 *
 * Utilise une compilation TypeScript éphémère (tsc) pour charger le parser
 * sans dépendance navigateur ni package supplémentaire.
 *
 * Usage : node scripts/generateMotherSessionsDataset.mjs
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const mothersRoot = path.join(repoRoot, 'docs', 'training', 'mother-sessions')
const outTsPath = path.join(repoRoot, 'src', 'data', 'motherSessions.generated.ts')
const cacheDir = path.join(repoRoot, 'node_modules', '.cache', 'rugby-mother-session-gen')
const compileOutDir = path.join(cacheDir, 'out')

const require = createRequire(import.meta.url)

function fail(message) {
  console.error(`[mother-sessions-dataset] ${message}`)
  process.exit(1)
}

function shouldExcludeFile(basename) {
  if (basename === 'README.md') return true
  if (basename === 'TEMPLATE_MOTHER_SESSION.md') return true
  if (basename === 'AUTOMATIC_ALTERNATIVES_MATRIX.md') return true
  if (/^WEEKLY_TEMPLATES_.*\.md$/i.test(basename)) return true
  return false
}

function collectMarkdownFiles(dir) {
  const out = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const ent of entries) {
    const abs = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      out.push(...collectMarkdownFiles(abs))
      continue
    }
    if (!ent.isFile() || !ent.name.toLowerCase().endsWith('.md')) continue
    if (shouldExcludeFile(ent.name)) continue
    out.push(abs)
  }
  return out
}

function compileParserBundle() {
  fs.mkdirSync(cacheDir, { recursive: true })
  if (fs.existsSync(compileOutDir)) {
    fs.rmSync(compileOutDir, { recursive: true, force: true })
  }

  const srcRoot = path.join(repoRoot, 'src')
  const files = [
    path.join(srcRoot, 'types', 'motherSession.ts'),
    path.join(srcRoot, 'services', 'motherSession', 'parseMotherSession.ts'),
    path.join(srcRoot, 'services', 'motherSession', 'parseAllMotherSessions.ts'),
  ]
  for (const f of files) {
    if (!fs.existsSync(f)) fail(`Fichier source introuvable : ${f}`)
  }

  const tsconfig = {
    compilerOptions: {
      rootDir: srcRoot.replace(/\\/g, '/'),
      outDir: compileOutDir.replace(/\\/g, '/'),
      module: 'CommonJS',
      moduleResolution: 'node10',
      target: 'ES2022',
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      noEmit: false,
      declaration: false,
    },
    files: files.map((f) => f.replace(/\\/g, '/')),
  }

  const configPath = path.join(cacheDir, 'tsconfig.gen.json')
  fs.writeFileSync(configPath, JSON.stringify(tsconfig, null, 2), 'utf8')

  let tscJs
  try {
    const pkg = path.dirname(require.resolve('typescript/package.json'))
    tscJs = path.join(pkg, 'lib', 'tsc.js')
  } catch {
    fail('Le package "typescript" est introuvable (devDependency).')
  }

  const result = spawnSync(process.execPath, [tscJs, '-p', configPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    console.error(result.stdout || '', result.stderr || '')
    fail('Échec de la compilation TypeScript du parser (tsc).')
  }
}

function loadParseAllMotherSessions() {
  const modPath = path.join(compileOutDir, 'services', 'motherSession', 'parseAllMotherSessions.js')
  if (!fs.existsSync(modPath)) {
    fail(`Sortie tsc introuvable : ${modPath}`)
  }
  return require(modPath)
}

function posixRel(fromRoot, absPath) {
  return path.relative(fromRoot, absPath).split(path.sep).join('/')
}

function main() {
  if (!fs.existsSync(mothersRoot)) {
    fail(`Dossier introuvable : ${mothersRoot}`)
  }

  compileParserBundle()
  const { parseAllMotherSessions } = loadParseAllMotherSessions()

  const mdAbsPaths = collectMarkdownFiles(mothersRoot).sort((a, b) =>
    posixRel(repoRoot, a).localeCompare(posixRel(repoRoot, b), 'en', { numeric: true })
  )

  const inputs = mdAbsPaths.map((abs) => ({
    filePath: posixRel(repoRoot, abs),
    markdown: fs.readFileSync(abs, 'utf8'),
  }))

  let dataset
  try {
    dataset = parseAllMotherSessions(inputs)
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e))
  }

  const { sessions } = dataset

  const header = `/**
 * AUTO-GÉNÉRÉ — ne pas modifier à la main.
 * Source : docs/training/mother-sessions/
 * Régénérer : node scripts/generateMotherSessionsDataset.mjs
 */

import type { MotherSession } from '../types/motherSession'

`

  const sessionsLiteral = `export const MOTHER_SESSIONS: MotherSession[] = ${JSON.stringify(sessions, null, 2)}`

  const byIdBlock = `
export const MOTHER_SESSIONS_BY_ID: Record<string, MotherSession> = MOTHER_SESSIONS.reduce(
  (acc, s) => {
    acc[s.metadata.id] = s
    return acc
  },
  {} as Record<string, MotherSession>
)
`

  fs.mkdirSync(path.dirname(outTsPath), { recursive: true })
  fs.writeFileSync(outTsPath, `${header}${sessionsLiteral}\n${byIdBlock}\n`, 'utf8')

  console.log(
    `[mother-sessions-dataset] OK — ${sessions.length} session(s) → ${posixRel(repoRoot, outTsPath)}`
  )
}

try {
  main()
} catch (e) {
  fail(e instanceof Error ? e.stack || e.message : String(e))
}

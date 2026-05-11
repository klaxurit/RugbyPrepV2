/**
 * Génère `src/services/motherSession/motherSessionExerciseFr.ts` depuis
 * `docs/exercises-i18n-lexicon.md`.
 *
 * Le lexique `.md` est la source de vérité ; ce script extrait la colonne
 * `Nom EN` (clé normalisée) et `Traduction FR` (valeur affichée quand
 * `preferredLanguage === 'fr'`).
 *
 * Usage : node scripts/generateMotherSessionExerciseFr.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const lexiconPath = path.join(repoRoot, 'docs', 'exercises-i18n-lexicon.md')
const outPath = path.join(repoRoot, 'src', 'services', 'motherSession', 'motherSessionExerciseFr.ts')

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseTableRows(md) {
  const lines = md.split('\n')
  const rows = []
  for (const line of lines) {
    // Lignes de tableau commençant par `| <num> | ...`
    if (!/^\|\s*\d+\s*\|/.test(line)) continue
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length < 5) continue
    const [, enName, , , frTranslation] = cells
    if (!enName || !frTranslation || frTranslation === '_à compléter_') continue
    rows.push({ en: enName, fr: frTranslation })
  }
  return rows
}

function main() {
  if (!fs.existsSync(lexiconPath)) {
    console.error(`[ms-exercise-fr] lexique introuvable : ${lexiconPath}`)
    process.exit(1)
  }

  const md = fs.readFileSync(lexiconPath, 'utf8')
  const rows = parseTableRows(md)

  // Build map keyed by normalized EN
  const map = new Map()
  const collisions = []
  for (const { en, fr } of rows) {
    const k = normalize(en)
    if (map.has(k) && map.get(k) !== fr) {
      collisions.push({ key: k, existing: map.get(k), incoming: fr })
    }
    map.set(k, fr)
  }

  if (collisions.length) {
    console.warn(`[ms-exercise-fr] ${collisions.length} collisions (clé normalisée identique, FR différent) :`)
    for (const c of collisions) console.warn('  -', c)
  }

  const entries = [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  const banner = `/**\n * AUTO-GÉNÉRÉ — ne pas modifier à la main.\n * Source : docs/exercises-i18n-lexicon.md\n * Régénérer : node scripts/generateMotherSessionExerciseFr.mjs\n *\n * Lookup FR pour les noms d'exercices Mother Sessions, utilisé par le toggle\n * EN/FR (UserProfile.preferredLanguage). La clé est le nom EN normalisé\n * (lowercase + collapse whitespace + apostrophes/tirets uniformisés).\n */\n\n`
  const body =
    "export const MS_EXERCISE_FR_MAP: Record<string, string> = {\n" +
    entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n') +
    '\n}\n'

  fs.writeFileSync(outPath, banner + body)
  console.log(`[ms-exercise-fr] ${entries.length} entrées écrites dans ${path.relative(repoRoot, outPath)}`)
}

main()

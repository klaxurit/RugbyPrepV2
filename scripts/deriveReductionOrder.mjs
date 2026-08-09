/**
 * Dérive l'ordre de troncature des blocs depuis les `## Progression Rules`
 * rédigées en langage naturel dans chaque mother session.
 *
 * Sortie : proposition de `reduction_order` par séance.
 *
 * Usage :
 *   node scripts/deriveReductionOrder.mjs          rapport lisible
 *   node scripts/deriveReductionOrder.mjs --json   données brutes
 *   node scripts/deriveReductionOrder.mjs --write  écrit le champ dans les .md
 *
 * Le champ écrit ne liste QUE les blocs retirables, dans l'ordre. Un bloc
 * absent de la liste est protégé.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const mothersRoot = path.join(repoRoot, 'docs', 'training', 'mother-sessions')

function collect(dir) {
  const out = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...collect(abs))
    else if (ent.name.endsWith('.md') && ent.name !== 'README.md') out.push(abs)
  }
  return out
}

/** Blocs visibles : numéro, nom, caractère optionnel. */
function parseBlocks(lines) {
  const blocks = []
  let inVisible = false
  for (const line of lines) {
    if (/^##\s+Visible Blocks/i.test(line)) {
      inVisible = true
      continue
    }
    if (inVisible && /^##\s+/.test(line)) inVisible = false
    if (!inVisible) continue
    const m = line.match(/^###\s+(Optional\s+)?Block\s+(\d+)\s*-\s*(.+)$/i)
    if (m) {
      blocks.push({
        number: Number(m[2]),
        name: m[3].trim(),
        isOptional: Boolean(m[1]),
      })
    }
  }
  return blocks
}

function parseProgressionRules(lines) {
  const rules = []
  let inRules = false
  for (const line of lines) {
    if (/^##\s+Progression Rules/i.test(line)) {
      inRules = true
      continue
    }
    if (inRules && /^##\s+/.test(line)) inRules = false
    if (!inRules) continue
    const m = line.match(/^-\s+(.*)$/)
    if (m) rules.push(m[1].trim())
  }
  return rules
}

/**
 * Mentions de blocs dans une phrase (`Block 4`, `B4`, `Blocks 1-2`), avec leur
 * position dans le texte — la position sert à retrouver le verbe qui gouverne
 * la mention.
 */
function blockMentionsIn(text) {
  const found = new Map()
  const record = (n, index) => {
    if (!found.has(n) || index < found.get(n)) found.set(n, index)
  }
  const rangeRe = /\bB(?:lock)?s?\s*(\d+)\s*(?:-|–|to|and|et)\s*(\d+)/gi
  let m
  while ((m = rangeRe.exec(text))) {
    const from = Number(m[1])
    const to = Number(m[2])
    for (let n = Math.min(from, to); n <= Math.max(from, to); n++) record(n, m.index)
  }
  const singleRe = /\bB(?:lock)?\s*(\d+)/gi
  while ((m = singleRe.exec(text))) record(Number(m[1]), m.index)
  return [...found.entries()]
    .map(([number, index]) => ({ number, index }))
    .sort((a, b) => a.index - b.index)
}

/** Numéros seuls, pour les usages qui n'ont pas besoin des positions. */
function blockNumbersIn(text) {
  return blockMentionsIn(text).map((m) => m.number)
}

const ORDINALS = [
  { re: /\bfirst\b/i, rank: 1 },
  { re: /\bsecond(?:ly|arily)?\b/i, rank: 2 },
  { re: /\bthird\b/i, rank: 3 },
  { re: /\blast\b/i, rank: 9 },
]

/**
 * Verbes gouvernant une mention de bloc, avec leur effet.
 * `null` = la mention n'exprime aucune priorité de retrait (« add one round to
 * Block 4 if recovery is good » parle de progression, pas de troncature).
 */
const GOVERNING_VERBS = [
  { re: /\bnever\s+(?:reduce|cut|drop|remove|touch)\b/i, effect: 'protect' },
  { re: /\b(?:keep|protect|prioriti[sz]e|preserve)\b/i, effect: 'protect' },
  { re: /\b(?:reduce|cut|remove|drop|skip|touch(?:ing)?|shorten)\b/i, effect: 'reduce' },
  { re: /\b(?:add|increase|progress|upgrade|extend)\b/i, effect: null },
]

/**
 * Effet applicable à une mention de bloc : on retient le dernier verbe
 * gouvernant rencontré AVANT la mention dans le texte. C'est ce qui distingue
 * « Keep total session crisp — cut Block 3 » (retrait de B3) de
 * « Keep Blocks 1 and 2 as the protected priorities » (protection de B1-B2).
 */
function effectForMention(text, mentionIndex) {
  const before = text.slice(0, mentionIndex)
  let best = null
  let bestEnd = -1
  // Les verbes sont testés dans l'ordre de spécificité décroissante et on
  // compare les FINS de correspondance : « NEVER reduce » et « reduce »
  // s'achèvent au même endroit, la formulation la plus spécifique gagne.
  for (const { re, effect } of GOVERNING_VERBS) {
    const global = new RegExp(re.source, 'gi')
    let m
    while ((m = global.exec(before))) {
      const end = m.index + m[0].length
      if (end > bestEnd) {
        bestEnd = end
        best = effect
      }
    }
  }
  return { effect: best, found: bestEnd >= 0 }
}

/**
 * Règles qui décrivent la progression d'une semaine donnée, pas une priorité
 * de retrait. « Deload week 4: reduce to 3 rounds on Block 1 » dit comment
 * alléger cette semaine-là, pas quel bloc sacrifier en premier.
 */
const WEEK_SCOPED_RE = /^\s*`?(?:deload\s+week|week|semaine|s)\s*\d/i

/**
 * Dérive un ordre de retrait à partir des règles textuelles.
 *
 * Le corpus n'exprime pas des rangs absolus mais un ORDRE PARTIEL :
 *   « Reduce B4 first, B3 second »            → 4 avant 3
 *   « Cut Block 4 before Block 1 »            → 4 avant 1, sans rien dire de 2 et 3
 *   « reduce Block 2 before cutting Block 1 » → 2 avant 1
 *
 * On construit donc un graphe de précédence, puis on le trie
 * topologiquement. Les blocs libres de toute contrainte sont départagés par
 * une convention explicite : optionnels d'abord, puis numéro décroissant — ce
 * qui laisse mécaniquement le bloc 1 en dernier.
 */
function deriveOrder(blocks, rules) {
  const protectedBlocks = new Set()
  const evidence = []
  /** Arêtes de précédence : edges.get(a) = { b } signifie « retirer a avant b ». */
  const edges = new Map()
  /** Blocs explicitement cités dans une consigne de retrait. */
  const constrained = new Set()

  const existing = new Set(blocks.map((b) => b.number))
  const blocksIn = (text) => blockNumbersIn(text).filter((n) => existing.has(n))
  const addEdge = (a, b) => {
    if (a === b) return
    if (!edges.has(a)) edges.set(a, new Set())
    edges.get(a).add(b)
  }

  /** Mentions de retrait, dans l'ordre du texte, avec leur ordinal éventuel. */
  const mentions = []

  for (const rule of rules) {
    if (WEEK_SCOPED_RE.test(rule)) continue

    const clauses = rule
      .split(/[.;,]/)
      .map((c) => c.trim())
      .filter(Boolean)

    /** Polarité héritée quand une clause cite un bloc sans verbe (« B3 second »). */
    let carriedEffect = null
    const ruleMentions = []

    for (let ci = 0; ci < clauses.length; ci++) {
      const text = clauses[ci]
      const mentions = blockMentionsIn(text).filter((m) => existing.has(m.number))
      if (mentions.length === 0) continue

      const ordinal = ORDINALS.find((o) => o.re.test(text))
      // « Block 1 or Block 2, whichever feels heavier » : alternative laissée au
      // ressenti du jour, les blocs sont équivalents et n'imposent aucun ordre.
      const isDisjunction =
        mentions.length > 1 && /\bor\b|\beither\b|\bwhichever\b/i.test(text)
      const group = isDisjunction ? `${ci}-alt` : null

      const reduced = []
      for (const mention of mentions) {
        const { effect, found } = effectForMention(text, mention.index)
        const applied = found ? effect : carriedEffect
        if (found) carriedEffect = effect

        if (applied === 'protect') {
          protectedBlocks.add(mention.number)
          evidence.push(`protège ${mention.number} ← "${text}"`)
          continue
        }
        if (applied !== 'reduce') continue

        reduced.push(mention.number)
        ruleMentions.push({ block: mention.number, rank: ordinal?.rank ?? null, text, group })
      }

      if (reduced.length > 0) {
        evidence.push(
          `retrait ${reduced.join(' avant ')}${ordinal ? ` (${ordinal.rank})` : ''} ← "${text}"`,
        )
      }
    }

    // Ordre de citation à l'intérieur d'une règle, sauf entre alternatives.
    for (let i = 0; i < ruleMentions.length - 1; i++) {
      const a = ruleMentions[i]
      const b = ruleMentions[i + 1]
      if (a.group != null && a.group === b.group) continue
      addEdge(a.block, b.block)
    }
    mentions.push(...ruleMentions)
  }

  // Ordre imposé par les ordinaux, à travers les règles.
  const ranked = mentions.filter((m) => m.rank != null)
  for (const a of ranked) {
    for (const b of ranked) {
      if (a.rank < b.rank) addEdge(a.block, b.block)
    }
  }

  for (const m of mentions) constrained.add(m.block)
  // Une protection explicite l'emporte sur toute consigne de retrait héritée.
  for (const n of protectedBlocks) {
    constrained.delete(n)
    edges.delete(n)
    for (const set of edges.values()) set.delete(n)
  }

  const removable = blocks.map((b) => b.number).filter((n) => !protectedBlocks.has(n))
  const order = topoSort(removable, edges, blocks)

  const constrainedCount = removable.filter((n) => constrained.has(n)).length
  let confidence = 'haute'
  if (constrainedCount === 0) confidence = 'aucune règle — défaut appliqué'
  else if (constrainedCount < removable.length) confidence = 'partielle — complétée par défaut'

  return {
    order,
    protectedBlocks: [...protectedBlocks].sort((a, b) => a - b),
    constrained: [...constrained].sort((a, b) => a - b),
    evidence,
    confidence,
  }
}

/**
 * Tri topologique déterministe. À contrainte égale, on retire d'abord les
 * blocs optionnels, puis les blocs de numéro élevé (le bloc 1 part en dernier).
 */
function topoSort(nodes, edges, blocks) {
  const isOptional = (n) => Boolean(blocks.find((b) => b.number === n)?.isOptional)
  const pool = new Set(nodes)
  const indegree = new Map([...pool].map((n) => [n, 0]))
  for (const [from, tos] of edges) {
    if (!pool.has(from)) continue
    for (const to of tos) {
      if (pool.has(to)) indegree.set(to, indegree.get(to) + 1)
    }
  }

  const tieBreak = (a, b) => {
    if (isOptional(a) !== isOptional(b)) return isOptional(a) ? -1 : 1
    return b - a
  }

  const out = []
  while (pool.size > 0) {
    const available = [...pool].filter((n) => indegree.get(n) === 0)
    // Cycle (règles contradictoires) : on débloque par la convention par défaut.
    const next = (available.length ? available : [...pool]).sort(tieBreak)[0]
    out.push(next)
    pool.delete(next)
    for (const to of edges.get(next) ?? []) {
      if (pool.has(to)) indegree.set(to, indegree.get(to) - 1)
    }
  }
  return out
}

const results = []
for (const file of collect(mothersRoot)) {
  const id = path.basename(file, '.md')
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const blocks = parseBlocks(lines)
  const rules = parseProgressionRules(lines)
  const derived = deriveOrder(blocks, rules)
  results.push({ id, file: path.relative(repoRoot, file), blocks, ...derived })
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2))
  process.exit(0)
}

if (process.argv.includes('--write')) {
  let written = 0
  for (const r of results) {
    const abs = path.join(repoRoot, r.file)
    const lines = fs.readFileSync(abs, 'utf8').split('\n')
    const value = `- \`reduction_order\`: ${r.order.join(', ')}`

    const existing = lines.findIndex((l) => /^-\s*`reduction_order`\s*:/.test(l))
    if (existing >= 0) {
      if (lines[existing] === value) continue
      lines[existing] = value
    } else {
      // Dernière ligne du bloc de métadonnées, juste avant la 1re section.
      let lastMeta = -1
      for (let i = 0; i < lines.length; i++) {
        if (/^##\s/.test(lines[i])) break
        if (/^-\s*`[^`]+`\s*:/.test(lines[i])) lastMeta = i
      }
      if (lastMeta < 0) {
        console.error(`  ! bloc de métadonnées introuvable : ${r.file}`)
        continue
      }
      lines.splice(lastMeta + 1, 0, value)
    }
    fs.writeFileSync(abs, lines.join('\n'))
    written++
  }
  console.log(`[reduction_order] ${written} fichier(s) mis à jour sur ${results.length}`)
  process.exit(0)
}

const byConfidence = { haute: [], 'partielle — complétée par défaut': [], 'aucune règle — défaut appliqué': [] }
for (const r of results) byConfidence[r.confidence].push(r)

for (const [conf, rows] of Object.entries(byConfidence)) {
  if (rows.length === 0) continue
  console.log('\n' + '='.repeat(104))
  console.log(`CONFIANCE : ${conf.toUpperCase()}  (${rows.length} séances)`)
  console.log('='.repeat(104))
  for (const r of rows.sort((a, b) => a.id.localeCompare(b.id))) {
    const blockLabels = r.blocks
      .map((b) => `${b.number}${b.isOptional ? '*' : ''}`)
      .join(' ')
    console.log(`\n${r.id}`)
    console.log(`  blocs      : ${blockLabels}   (* = optionnel)`)
    console.log(`  retrait    : ${r.order.join(' → ') || '(aucun)'}`)
    console.log(`  protégés   : ${r.protectedBlocks.join(', ') || '(aucun)'}`)
    for (const e of r.evidence) console.log(`  preuve     : ${e}`)
  }
}

console.log('\n' + '='.repeat(104))
console.log(
  `TOTAL ${results.length} séances — ` +
    Object.entries(byConfidence)
      .map(([c, r]) => `${c}: ${r.length}`)
      .join(' | ')
)

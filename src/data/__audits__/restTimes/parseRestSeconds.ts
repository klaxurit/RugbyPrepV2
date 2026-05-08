/**
 * Parse rest times encoded as free-text in `MotherSession.Block.format`.
 *
 * Rest times in motherSessions live in human-readable strings such as:
 *   "`3 rounds`, `90-120s` rest after the pair"
 *   "`4 work sets`, `2-3 min` rest between sets"
 *   "`3 rounds`, full rest `2 min 30 to 3 min` after each round"
 *   "`EMOM 8'`"
 *
 * Convention (Décision #40 v2 + B2 audit plan §3) : when multiple rest
 * specs co-exist, the parser returns the highest-level (inter-round)
 * value because that maps to the canonical `restSeconds` semantic
 * (rest between full executions of the round/scheme).
 *
 * Pure, synchronous, no I/O. Used by audit script + contract test.
 */

export type RestKind =
  /** Standard rest between rounds/sets — numeric range available. */
  | 'rounds'
  /** EMOM/Tabata/AMRAP — timed protocol, rest is intra-interval. */
  | 'emom'
  /** "Minimal rest" / "move continuously" — explicitly no measurable rest. */
  | 'minimal'
  /** Sprint walk-back recovery — rest depends on run, not chrono. */
  | 'walkback'
  /** Empty format string (warmups, prep blocks). */
  | 'empty'
  /** Format string did not match any pattern — surface in audit. */
  | 'parse_fail'

export interface RestRange {
  kind: RestKind
  /** Lower bound in seconds, null when kind is non-numeric. */
  minSeconds: number | null
  /** Upper bound in seconds, null when kind is non-numeric. */
  maxSeconds: number | null
  /** The matched qualifier substring (debug aid). */
  source: string
  /** Original format string (post-trim, pre-normalize). */
  raw: string
}

interface QualifierPattern {
  regex: RegExp
  /** Lower number = higher priority (1 = top-level inter-round). */
  priority: number
}

const QUALIFIER_PATTERNS: QualifierPattern[] = [
  { regex: /between\s+rounds/i, priority: 1 },
  { regex: /after\s+each\s+rounds?/i, priority: 1 },
  { regex: /after\s+the\s+rounds?/i, priority: 1 },
  { regex: /after\s+(?:the\s+)?pair/i, priority: 1 },
  { regex: /after\s+(?:the\s+)?triplet/i, priority: 1 },
  { regex: /between\s+sets/i, priority: 2 },
  { regex: /between\s+reps/i, priority: 3 },
  { regex: /between\s+drills/i, priority: 4 },
  { regex: /between\s+exercises/i, priority: 4 },
]

const TIMESPEC_FRAGMENT = String.raw`\d+(?:[-–]\d+)?\s*(?:s|min)(?:\s*\d+(?:\s*to\s*\d+\s*min)?)?`

function parseTimeSpec(spec: string): { minSeconds: number; maxSeconds: number } | null {
  const s = spec.trim().toLowerCase()

  const compound = s.match(/(\d+)\s*min(?:\s*(\d+))?\s*to\s*(\d+)\s*min(?:\s*(\d+))?/)
  if (compound) {
    const minSeconds = Number(compound[1]) * 60 + (compound[2] ? Number(compound[2]) : 0)
    const maxSeconds = Number(compound[3]) * 60 + (compound[4] ? Number(compound[4]) : 0)
    return { minSeconds, maxSeconds }
  }

  const rangeMin = s.match(/(\d+)\s*[-–]\s*(\d+)\s*min/)
  if (rangeMin) {
    return { minSeconds: Number(rangeMin[1]) * 60, maxSeconds: Number(rangeMin[2]) * 60 }
  }

  const rangeSec = s.match(/(\d+)\s*[-–]\s*(\d+)\s*s\b/)
  if (rangeSec) {
    return { minSeconds: Number(rangeSec[1]), maxSeconds: Number(rangeSec[2]) }
  }

  const singleMin = s.match(/(\d+)\s*min\b/)
  if (singleMin) {
    const v = Number(singleMin[1]) * 60
    return { minSeconds: v, maxSeconds: v }
  }

  const singleSec = s.match(/(\d+)\s*s\b/)
  if (singleSec) {
    const v = Number(singleSec[1])
    return { minSeconds: v, maxSeconds: v }
  }

  return null
}

function qualifierPriority(qualifier: string): number {
  for (const p of QUALIFIER_PATTERNS) {
    if (p.regex.test(qualifier)) return p.priority
  }
  return 1.5
}

export function parseRestSeconds(format: string | null | undefined): RestRange {
  const raw = format ?? ''
  const norm = raw.replace(/`/g, '').toLowerCase().trim()

  if (!norm) {
    return { kind: 'empty', minSeconds: null, maxSeconds: null, source: '', raw }
  }

  if (/\b(?:emom|tabata|amrap|for\s*time)\b/.test(norm)) {
    return { kind: 'emom', minSeconds: null, maxSeconds: null, source: 'emom-class', raw }
  }

  if (/walk[-\s]?back/.test(norm)) {
    return { kind: 'walkback', minSeconds: null, maxSeconds: null, source: 'walkback', raw }
  }

  if (/minimal\s+rest|move\s+continuously/.test(norm)) {
    return { kind: 'minimal', minSeconds: null, maxSeconds: null, source: 'minimal', raw }
  }

  type Mention = {
    priority: number
    spec: { minSeconds: number; maxSeconds: number }
    qualifier: string
    matchText: string
  }
  const mentions: Mention[] = []

  const patA = new RegExp(
    `(${TIMESPEC_FRAGMENT})\\s+rest(?:\\s+([a-z][^,.;!?]*?))?(?=,|\\.|;|!|\\?|$)`,
    'gi',
  )
  let m: RegExpExecArray | null
  while ((m = patA.exec(norm)) !== null) {
    const spec = parseTimeSpec(m[1])
    if (!spec) continue
    const qual = (m[2] ?? '').trim()
    mentions.push({
      priority: qualifierPriority(qual),
      spec,
      qualifier: qual,
      matchText: m[0],
    })
  }

  const patB = new RegExp(
    `full\\s+rest\\s+(${TIMESPEC_FRAGMENT})(?:\\s+([a-z][^,.;!?]*?))?(?=,|\\.|;|!|\\?|\\sand\\s|$)`,
    'gi',
  )
  while ((m = patB.exec(norm)) !== null) {
    const spec = parseTimeSpec(m[1])
    if (!spec) continue
    const qual = (m[2] ?? '').trim()
    mentions.push({
      priority: qualifierPriority(qual),
      spec,
      qualifier: qual || 'full-rest',
      matchText: m[0],
    })
  }

  const patC = /(\d+(?:[-–]\d+)?\s*(?:s|min))\s+between\s+(reps|rounds|sets|drills|exercises)/gi
  while ((m = patC.exec(norm)) !== null) {
    const spec = parseTimeSpec(m[1])
    if (!spec) continue
    const qual = `between ${m[2]}`
    if (mentions.some((x) => x.matchText.includes(m![0]))) continue
    mentions.push({
      priority: qualifierPriority(qual),
      spec,
      qualifier: qual,
      matchText: m[0],
    })
  }

  if (mentions.length === 0) {
    return { kind: 'parse_fail', minSeconds: null, maxSeconds: null, source: norm, raw }
  }

  mentions.sort((a, b) => a.priority - b.priority)
  const best = mentions[0]

  return {
    kind: 'rounds',
    minSeconds: best.spec.minSeconds,
    maxSeconds: best.spec.maxSeconds,
    source: best.qualifier || 'rest',
    raw,
  }
}

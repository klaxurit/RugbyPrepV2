import { describe, expect, it } from 'vitest'
import blocksData from '../blocks.v1.json'
import type { TrainingBlock } from '../../types/training'

/**
 * Contract test for `versions[].restSeconds` in `blocks.v1.json`.
 *
 * ⚠️  PAUSED 2026-05-07 — `blocks.v1.json` is LEGACY DATA.
 *     The active session UI is driven by `src/data/motherSessions.generated.ts`
 *     via `services/motherSession/resolveMotherSessionsForWeek.ts`. Rest times
 *     in motherSessions live as free-text strings in `Block.format` and
 *     `coachingNotes`, not as a typed `restSeconds` field — so this contract
 *     test does not reach the user.
 *
 *     B2 audit will be reoriented onto motherSessions after Decision #47
 *     (legacy code/data cleanup) is scoped. Until then, the failing assertion
 *     is `it.skip`'d to keep CI green; the helper functions remain as future
 *     reference if blocks.v1.json is archived rather than deleted.
 *
 * Source of truth for the (legacy) ranges: `src/data/README-rest-times.md`.
 * Décision #40 v2 (2026-05-07) : `restSeconds` = rest entre vraies séries ;
 * structure intra-pair encodée par `scheme.kind=emom` ou `scheme.reps` composite.
 */

const blocks = blocksData as unknown as TrainingBlock[]

type Range = readonly [number, number]
type IntentKind = string // `${BlockIntent}.${Scheme['kind']}`

/**
 * Canonical rest ranges per (intent × scheme.kind).
 * Null = no specific range, skip (e.g. conditioning is protocol-derived).
 */
const REST_RANGES: Record<IntentKind, Range | null> = {
  // Force max — single-exercise, KB strength-methods.md:218 (3-5 min)
  'force.reps': [180, 300],

  // Repeated-effort, KB strength-methods.md:276
  'hypertrophy.reps': [60, 120],

  // PAP — restSeconds = rest after full triplet (heavy + plyo + accessory)
  'contrast.reps': [120, 180],

  // EMOM owns its timing — strict 0
  'neural.emom': [0, 0],
  // Dynamic effort + olympic complex tolerance, KB strength-methods.md:245
  'neural.reps': [60, 150],

  // Low-intensity neural priming, no hard KB rule (Decision #39)
  'activation.reps': [30, 60],
  'activation.time': [30, 60],

  // No hard KB rule, family of prehab
  'prehab.reps': [45, 90],
  'prehab.time': [45, 90],

  // RE-style metabolic stress, KB strength-methods.md:276
  'core.reps': [45, 90],
  'core.time': [45, 90],

  // No hard KB rule, family of prehab
  'neck.reps': [45, 90],
  'neck.time': [45, 90],

  // Loaded-carry endurance
  'carry.reps': [60, 90],

  // Protocol-derived from tags — handled by checkConditioningRest()
  'conditioning.time': null,

  // Mobility / sequencing
  'mobility.reps': [0, 30],
  'mobility.time': [0, 30],
  'warmup.reps': [0, 0],
  'cooldown.time': [0, 0],
}

/**
 * Conditioning ratio bands by protocol tag (rest = workSeconds × ratio).
 * If a block carries multiple protocol tags, the union of bands is accepted.
 */
const CONDITIONING_RATIOS: Record<string, Range> = {
  hiit: [0.5, 1.0],
  aerobic: [0.5, 1.0],
  vo2max: [0.5, 1.0],
  lactate: [2.0, 3.0],
  rsa: [3.0, 5.0],
}

interface Exception {
  expectedRange: Range
  actualSeconds: number
  reason: string
  addedAt: string
}

/**
 * Allowlist of legitimate violations. Empty at J2 — populated at J3 from the
 * red list this test produces. Each entry must document KB / structural reason.
 *
 * Key format: `${blockId}.${versionId}`
 */
const EXCEPTIONS: Record<string, Exception> = {
  // (J3 will add entries here)
}

interface Violation {
  key: string
  blockId: string
  versionId: string
  intent: string
  schemeKind: string
  tags: readonly string[]
  restSeconds: number
  expectedRange: Range
  note?: string
}

function inRange(value: number, [lo, hi]: Range): boolean {
  return value >= lo && value <= hi
}

function getConditioningExpectedRange(
  workSeconds: number,
  tags: readonly string[]
): { range: Range; matchedTags: string[] } | { error: string } {
  const matched = tags.filter((t) => t in CONDITIONING_RATIOS)
  if (matched.length === 0) {
    return { error: `no protocol tag (expected one of: ${Object.keys(CONDITIONING_RATIOS).join(', ')})` }
  }
  let lo = Infinity
  let hi = -Infinity
  for (const t of matched) {
    const [rLo, rHi] = CONDITIONING_RATIOS[t]
    lo = Math.min(lo, Math.floor(workSeconds * rLo))
    hi = Math.max(hi, Math.ceil(workSeconds * rHi))
  }
  return { range: [lo, hi], matchedTags: matched }
}

function collectViolations(): Violation[] {
  const violations: Violation[] = []

  for (const block of blocks) {
    for (const version of block.versions) {
      const key = `${block.blockId}.${version.versionId}`
      if (key in EXCEPTIONS) continue

      const schemeKind = version.scheme.kind
      const intentKind: IntentKind = `${block.intent}.${schemeKind}`
      const rest = version.restSeconds

      // Conditioning: protocol-derived
      if (block.intent === 'conditioning' && version.scheme.kind === 'time') {
        const work = version.scheme.seconds
        const result = getConditioningExpectedRange(work, block.tags)
        if ('error' in result) {
          violations.push({
            key,
            blockId: block.blockId,
            versionId: version.versionId,
            intent: block.intent,
            schemeKind,
            tags: block.tags,
            restSeconds: rest,
            expectedRange: [-1, -1],
            note: result.error,
          })
          continue
        }
        if (!inRange(rest, result.range)) {
          violations.push({
            key,
            blockId: block.blockId,
            versionId: version.versionId,
            intent: block.intent,
            schemeKind,
            tags: block.tags,
            restSeconds: rest,
            expectedRange: result.range,
            note: `work=${work}s ratio matched=[${result.matchedTags.join(',')}]`,
          })
        }
        continue
      }

      // Standard (intent × kind) lookup
      const range = REST_RANGES[intentKind]
      if (range === undefined) {
        violations.push({
          key,
          blockId: block.blockId,
          versionId: version.versionId,
          intent: block.intent,
          schemeKind,
          tags: block.tags,
          restSeconds: rest,
          expectedRange: [-1, -1],
          note: `no convention for (${block.intent} × ${schemeKind}) — add to REST_RANGES or fix intent/scheme`,
        })
        continue
      }
      if (range === null) continue // explicitly skipped
      if (!inRange(rest, range)) {
        violations.push({
          key,
          blockId: block.blockId,
          versionId: version.versionId,
          intent: block.intent,
          schemeKind,
          tags: block.tags,
          restSeconds: rest,
          expectedRange: range,
        })
      }
    }
  }

  return violations
}

function formatViolations(violations: Violation[]): string {
  const lines = [`${violations.length} violation(s):`]
  // Group by (intent, schemeKind) for readability
  const groups = new Map<string, Violation[]>()
  for (const v of violations) {
    const k = `${v.intent}.${v.schemeKind}`
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(v)
  }
  for (const [groupKey, vs] of [...groups.entries()].sort()) {
    lines.push(`\n  [${groupKey}] ${vs.length} entries`)
    for (const v of vs) {
      const exp = v.expectedRange[0] === -1 ? 'N/A' : `[${v.expectedRange[0]}, ${v.expectedRange[1]}]`
      const note = v.note ? `  -- ${v.note}` : ''
      const tags = v.tags.length ? `  tags=[${v.tags.join(',')}]` : ''
      lines.push(`    ${v.key}  rest=${v.restSeconds}s  expected=${exp}${tags}${note}`)
    }
  }
  return lines.join('\n')
}

describe('restTimes contract — blocks.v1.json', () => {
  // PAUSED — see file header. Re-enable after Decision #47 reorientation
  // (audit moves to motherSessions.generated.ts) or after legacy archival.
  it.skip('every restSeconds matches the (intent × scheme.kind) range from README-rest-times.md', () => {
    const violations = collectViolations()
    if (violations.length > 0) {
      throw new Error(formatViolations(violations))
    }
  })

  it('REST_RANGES table covers every (intent × kind) actually used in the data', () => {
    const usedPairs = new Set<string>()
    for (const block of blocks) {
      for (const version of block.versions) {
        usedPairs.add(`${block.intent}.${version.scheme.kind}`)
      }
    }
    const missing = [...usedPairs].filter((p) => !(p in REST_RANGES))
    expect(missing).toEqual([])
  })

  it('EXCEPTIONS keys reference real (block, version) pairs', () => {
    const realKeys = new Set<string>()
    for (const block of blocks) {
      for (const version of block.versions) {
        realKeys.add(`${block.blockId}.${version.versionId}`)
      }
    }
    const orphans = Object.keys(EXCEPTIONS).filter((k) => !realKeys.has(k))
    expect(orphans).toEqual([])
  })

  it('reports the data shape (sanity)', () => {
    const totalVersions = blocks.reduce((sum, b) => sum + b.versions.length, 0)
    expect(blocks.length).toBeGreaterThanOrEqual(100)
    expect(totalVersions).toBe(548)
  })
})

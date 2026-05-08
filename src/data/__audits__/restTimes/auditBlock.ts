/**
 * Per-block audit orchestration.
 *
 * Combines rest-time parsing + intent inference + KB range overlap check
 * into a single deterministic verdict per block. Used by the CLI audit
 * script (Phase B) and the strict contract test (Phase E).
 */

import type { Block, MotherSession } from '../../../types/motherSession'
import { inferBlockIntent } from './inferBlockIntent'
import { KB_RANGES, overlapsKb, type Intent } from './kbRanges'
import { parseRestSeconds, type RestKind } from './parseRestSeconds'

export type AuditStatus =
  | 'PASS'
  | 'SKIP'
  | 'FAIL_RANGE'
  | 'FAIL_INTENT_UNKNOWN'
  | 'FAIL_PARSE'

export interface AuditRow {
  sessionId: string
  cycle: string
  blockNum: number
  blockName: string
  intent: Intent
  parsedKind: RestKind
  parsedMin: number | null
  parsedMax: number | null
  kbMin: number | null
  kbMax: number | null
  toleranceSeconds: number
  status: AuditStatus
  reason: string
  rawFormat: string
}

export function auditBlock(block: Block, session: MotherSession): AuditRow {
  const parsed = parseRestSeconds(block.format)
  const intent = inferBlockIntent(block, session)
  const kb = KB_RANGES[intent]

  const base = {
    sessionId: session.metadata.id,
    cycle: session.metadata.cycle,
    blockNum: block.number,
    blockName: block.name,
    intent,
    parsedKind: parsed.kind,
    parsedMin: parsed.minSeconds,
    parsedMax: parsed.maxSeconds,
    kbMin: kb.skip ? null : kb.minSeconds,
    kbMax: kb.skip ? null : kb.maxSeconds,
    toleranceSeconds: kb.toleranceSeconds,
    rawFormat: block.format ?? '',
  }

  // Allowlisted parsed kinds → SKIP regardless of intent
  if (parsed.kind === 'empty') {
    return { ...base, status: 'SKIP', reason: 'empty-format (warmup or prep block)' }
  }
  if (parsed.kind === 'minimal') {
    return { ...base, status: 'SKIP', reason: 'minimal-rest sentinel (mobility/flow)' }
  }
  if (parsed.kind === 'walkback') {
    return { ...base, status: 'SKIP', reason: 'walk-back sprint recovery' }
  }
  if (parsed.kind === 'emom') {
    return { ...base, status: 'SKIP', reason: 'EMOM/Tabata/AMRAP timed protocol' }
  }
  if (parsed.kind === 'parse_fail') {
    return { ...base, status: 'FAIL_PARSE', reason: `parser did not match: "${parsed.source}"` }
  }

  // Numeric rest available
  if (intent === 'unknown') {
    return {
      ...base,
      status: 'FAIL_INTENT_UNKNOWN',
      reason: `intent inference failed for block name "${block.name}"`,
    }
  }

  if (kb.skip) {
    return { ...base, status: 'SKIP', reason: `intent "${intent}" out of audit scope (${kb.source})` }
  }

  const inRange = overlapsKb(parsed.minSeconds!, parsed.maxSeconds!, intent)
  if (inRange) {
    return {
      ...base,
      status: 'PASS',
      reason: kb.soft ? 'overlap (soft rule, ±tolerance)' : 'overlap KB',
    }
  }

  const lo = kb.minSeconds - kb.toleranceSeconds
  const hi = kb.maxSeconds + kb.toleranceSeconds
  const direction = parsed.maxSeconds! < lo ? 'too-low' : 'too-high'
  return {
    ...base,
    status: 'FAIL_RANGE',
    reason: `parsed ${parsed.minSeconds}-${parsed.maxSeconds}s ${direction} vs KB ${lo}-${hi}s (${kb.source})`,
  }
}

export function auditAllSessions(sessions: MotherSession[]): AuditRow[] {
  const rows: AuditRow[] = []
  for (const session of sessions) {
    for (const block of session.blocks) {
      rows.push(auditBlock(block, session))
    }
  }
  return rows
}

export interface AuditSummary {
  total: number
  byStatus: Record<AuditStatus, number>
  byIntent: Record<Intent, { total: number; pass: number; fail: number; skip: number }>
}

export function summarize(rows: AuditRow[]): AuditSummary {
  const byStatus: Record<AuditStatus, number> = {
    PASS: 0,
    SKIP: 0,
    FAIL_RANGE: 0,
    FAIL_INTENT_UNKNOWN: 0,
    FAIL_PARSE: 0,
  }
  const byIntent = {} as AuditSummary['byIntent']

  for (const row of rows) {
    byStatus[row.status] += 1
    if (!byIntent[row.intent]) {
      byIntent[row.intent] = { total: 0, pass: 0, fail: 0, skip: 0 }
    }
    const bucket = byIntent[row.intent]
    bucket.total += 1
    if (row.status === 'PASS') bucket.pass += 1
    else if (row.status === 'SKIP') bucket.skip += 1
    else bucket.fail += 1
  }

  return { total: rows.length, byStatus, byIntent }
}

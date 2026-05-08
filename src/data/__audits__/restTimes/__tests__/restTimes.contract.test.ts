/**
 * B2 strict contract test — every block in MOTHER_SESSIONS must either
 * PASS the audit (parsed rest overlaps KB range for inferred intent) or
 * SKIP it explicitly via the documented allowlist (EMOM, walk-back,
 * minimal rest, empty format).
 *
 * Failure modes this test guards against:
 *   - FAIL_RANGE         : a block's rest drifted outside its KB range.
 *   - FAIL_INTENT_UNKNOWN: a new block name pattern not covered by the
 *                          heuristic — surface as a hard fail to force a
 *                          conscious classification before merge.
 *   - FAIL_PARSE         : the parser couldn't read a format string.
 *
 * Allowlist (SKIP) categories documented in `docs/b2-rest-times-audit-plan.md` §6.
 */

import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS } from '../../../motherSessions.generated'
import { auditAllSessions, summarize, type AuditRow } from '../auditBlock'

const rows: AuditRow[] = auditAllSessions(MOTHER_SESSIONS)
const summary = summarize(rows)

describe('rest times contract — motherSessions audit', () => {
  it('audited at least 100 blocks (sanity)', () => {
    expect(rows.length).toBeGreaterThan(100)
  })

  it('zero FAIL_PARSE — every Block.format string is parseable', () => {
    const parseFails = rows.filter((r) => r.status === 'FAIL_PARSE')
    expect(parseFails, formatRows(parseFails, 'FAIL_PARSE')).toHaveLength(0)
  })

  it('zero FAIL_INTENT_UNKNOWN — every block name maps to a known intent', () => {
    const intentFails = rows.filter((r) => r.status === 'FAIL_INTENT_UNKNOWN')
    expect(intentFails, formatRows(intentFails, 'FAIL_INTENT_UNKNOWN')).toHaveLength(0)
  })

  it('zero FAIL_RANGE — every numeric rest overlaps its KB range', () => {
    const rangeFails = rows.filter((r) => r.status === 'FAIL_RANGE')
    expect(rangeFails, formatRows(rangeFails, 'FAIL_RANGE')).toHaveLength(0)
  })

  it('SKIPs only come from the documented allowlist', () => {
    const allowedReasonPrefixes = [
      'EMOM/Tabata/AMRAP timed protocol',
      'minimal-rest sentinel',
      'empty-format',
      'walk-back sprint recovery',
      'intent "conditioning" out of audit scope',
    ]
    const skipRows = rows.filter((r) => r.status === 'SKIP')
    for (const row of skipRows) {
      const allowed = allowedReasonPrefixes.some((prefix) => row.reason.startsWith(prefix))
      expect(
        allowed,
        `Unexpected SKIP reason on ${row.sessionId} #${row.blockNum} "${row.blockName}": ${row.reason}`,
      ).toBe(true)
    }
  })

  it('audit summary matches the Phase D baseline (sentinel — bump if corpus grows)', () => {
    // Bump these numbers when adding new mother sessions.
    // Total = sum(byStatus). PASS + SKIP must equal total (no FAILs).
    expect(summary.total).toBe(rows.length)
    expect(summary.byStatus.PASS).toBeGreaterThanOrEqual(130)
    expect(summary.byStatus.SKIP).toBeGreaterThanOrEqual(10)
    expect(summary.byStatus.FAIL_RANGE).toBe(0)
    expect(summary.byStatus.FAIL_INTENT_UNKNOWN).toBe(0)
    expect(summary.byStatus.FAIL_PARSE).toBe(0)
  })
})

function formatRows(failRows: AuditRow[], label: string): string {
  if (failRows.length === 0) return `0 ${label} (expected)`
  const lines = failRows.map(
    (r) =>
      `  • ${r.sessionId} #${r.blockNum} "${r.blockName}" → intent=${r.intent} parsed=${r.parsedMin ?? '?'}-${r.parsedMax ?? '?'}s kb=${r.kbMin ?? '?'}-${r.kbMax ?? '?'}s :: ${r.reason}`,
  )
  return `${failRows.length} ${label} finding(s):\n${lines.join('\n')}`
}

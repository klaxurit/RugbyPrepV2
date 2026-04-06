import { describe, expect, it } from 'vitest'
import { buildExplanation } from '../buildExplanation'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import type { WeekPresentation } from '../../../types/scheduling'

// ── Helpers ─────────────────────────────────────────────────────────

function makeCtx(overrides?: Partial<AnnualPlanningContext>): AnnualPlanningContext {
  return {
    cycle: 'in_season',
    weekLabel: 'In-season S5',
    isDeloadWeek: false,
    isMatchWeek: false,
    firstMatchDate: null,
    lastMatchDate: null,
    offSeasonStartAt: null,
    daysUntilNextMatch: null,
    daysSinceLastMatch: null,
    fatigueLevel: 'normal',
    weeklyFrequency: 3,
    positionGroup: 'back_three',
    planningTrace: {
      resolutionMode: 'calendar_inferred',
      rulesApplied: [],
      warnings: [],
    },
    ...overrides,
  }
}

function makePres(sessionCount = 2): WeekPresentation {
  return {
    sessions: Array.from({ length: sessionCount }, (_, i) => ({
      kind: 'dated' as const,
      sessionSlot: { sessionId: `s${i}`, session: { metadata: { id: `S${i}` } } as any, role: 'primary' as const },
      dayOfWeek: (i + 1) as any,
      dayLabel: 'Lun',
    })),
    matchEvents: [],
    unavailableDays: [],
    clubDays: [],
    corrections: [],
    mode: 'calendar',
  }
}

function makeSeqPres(sessionCount = 3): WeekPresentation {
  return {
    sessions: Array.from({ length: sessionCount }, (_, i) => ({
      kind: 'sequential' as const,
      sessionSlot: { sessionId: `s${i}`, session: { metadata: { id: `S${i}` } } as any, role: 'primary' as const },
      sequenceIndex: i + 1,
      totalInWeek: sessionCount,
      completionStatus: 'pending' as const,
    })),
    matchEvents: [],
    unavailableDays: [],
    clubDays: [],
    corrections: [],
    mode: 'sequential',
  }
}

const JARGON_TERMS = ['ACWR', 'DUP', 'mésocycle', 'mesocycle', 'H1', 'H2', 'H3', 'H4', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'rule:', 'anchor:']

function assertNoJargon(explanation: ReturnType<typeof buildExplanation>) {
  const allText = [explanation.summaryLine, ...explanation.detailLines, ...explanation.corrections].join(' ')
  for (const term of JARGON_TERMS) {
    expect(allText).not.toContain(term)
  }
}

// ── Tests ───────────────────────────────────────────────────────────

describe('buildExplanation', () => {
  // ── Rule-based explanations ──

  it('rule:in_season_from_calendar with match proximity', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: ['rule:in_season_from_calendar'], warnings: [] },
        isMatchWeek: true,
        daysUntilNextMatch: 4,
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine).toContain('match')
    expect(result.summaryLine).toContain('4')
    assertNoJargon(result)
  })

  it('rule:treve_deep_detected → trêve copy', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: ['rule:treve_deep_detected'], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine).toContain('force')
    assertNoJargon(result)
  })

  it('rule:treve_return_detected → reprise progressive', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: ['rule:treve_return_detected'], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine).toContain('eprise')
    assertNoJargon(result)
  })

  it('rule:treve_rampup_detected → reprise bientôt', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: ['rule:treve_rampup_detected'], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('reprise')
    assertNoJargon(result)
  })

  it('rule:auto_season_ended_28d → inter-saison', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        cycle: 'off_season',
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: ['rule:auto_season_ended_28d'], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(),
      corrections: [],
    })

    // Sequential summary takes precedence, but detail should mention season end
    expect(result.detailLines.some(l => l.includes('4 semaines'))).toBe(true)
    assertNoJargon(result)
  })

  it('rule:playoffs_taper_1 → phase finale', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        cycle: 'playoffs',
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: ['rule:playoffs_taper_1'], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('finale')
    assertNoJargon(result)
  })

  it('rule:in_season_deload_3_1 → semaine de récupération', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        isDeloadWeek: true,
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: ['rule:in_season_deload_3_1'], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('récupération')
    assertNoJargon(result)
  })

  it('rule:onboarding_cycle_hint → onboarding fallback', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'onboarding_hint', rulesApplied: ['rule:onboarding_cycle_hint'], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(),
      corrections: [],
    })

    expect(result.detailLines.some(l => l.includes('matchs'))).toBe(true)
    assertNoJargon(result)
  })

  it('rule:no_first_match_calendar → programme progressif', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'backfilled', rulesApplied: ['rule:no_first_match_calendar'], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(),
      corrections: [],
    })

    expect(result.detailLines.some(l => l.includes('calendrier'))).toBe(true)
    assertNoJargon(result)
  })

  // ── Contextual derived rules ──

  it('isMatchWeek with close match → match context detail', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        isMatchWeek: true,
        daysUntilNextMatch: 2,
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine).toContain('2')
    expect(result.detailLines.some(l => l.toLowerCase().includes('frais'))).toBe(true)
    assertNoJargon(result)
  })

  it('isDeloadWeek without rule → deload detail', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        isDeloadWeek: true,
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('récupération')
    assertNoJargon(result)
  })

  it('fatigueLevel very_high → volume réduit', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        fatigueLevel: 'very_high',
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('fatigue')
    assertNoJargon(result)
  })

  it('loadManagementOverride recovery → récupération forcée', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        loadManagementOverride: 'recovery',
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('récupération')
    assertNoJargon(result)
  })

  // ── Sequential vs calendar summary ──

  it('sequential mode → session-count oriented summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        cycle: 'off_season',
        offSeasonPhase: 3,
        planningTrace: { resolutionMode: 'backfilled', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(3),
      corrections: [],
    })

    expect(result.summaryLine).toContain('3 séances')
    expect(result.summaryLine).toContain('Hypertrophie')
    expect(result.summaryLine).toContain('rythme')
    assertNoJargon(result)
  })

  it('sequential without phase → generic summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        cycle: 'in_season',
        planningTrace: { resolutionMode: 'backfilled', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(2),
      corrections: [],
    })

    expect(result.summaryLine).toContain('2 séances')
    expect(result.summaryLine).toContain('rythme')
    assertNoJargon(result)
  })

  it('calendar mode → uses dominant rule for summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: ['rule:in_season_from_calendar'], warnings: [] },
        daysUntilNextMatch: 5,
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine).toContain('match')
    assertNoJargon(result)
  })

  // ── Corrections formatting ──

  it('formats reschedule correction', () => {
    const result = buildExplanation({
      planningContext: makeCtx(),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [
        { id: 'c1', type: 'reschedule', toDay: 4, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    expect(result.corrections).toHaveLength(1)
    expect(result.corrections[0]).toContain('Jeudi')
    assertNoJargon(result)
  })

  it('formats skip correction', () => {
    const result = buildExplanation({
      planningContext: makeCtx(),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [
        { id: 'c1', type: 'skip', sessionId: 's1', appliedAt: '2026-04-06', reversible: true },
      ],
    })

    expect(result.corrections[0]).toContain('passée')
  })

  it('formats unavailable_day correction', () => {
    const result = buildExplanation({
      planningContext: makeCtx(),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [
        { id: 'c1', type: 'unavailable_day', toDay: 1, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    expect(result.corrections[0]).toContain('Lundi')
    expect(result.corrections[0]).toContain('indisponible')
  })

  it('formats fatigue correction', () => {
    const result = buildExplanation({
      planningContext: makeCtx(),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [
        { id: 'c1', type: 'fatigue', appliedAt: '2026-04-06', reversible: false },
      ],
    })

    expect(result.corrections[0]).toContain('fatigue')
  })

  it('formats add_match correction', () => {
    const result = buildExplanation({
      planningContext: makeCtx(),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [
        { id: 'c1', type: 'add_match', appliedAt: '2026-04-06', reversible: false },
      ],
    })

    expect(result.corrections[0]).toContain('Match ajouté')
  })

  // ── Warnings inclusion ──

  it('includes human-readable warnings in detailLines', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: {
          resolutionMode: 'calendar_inferred',
          rulesApplied: [],
          warnings: ['Pré-saison compressée : 8 semaines disponibles, minimum 10 appliqué.'],
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.detailLines.some(l => l.includes('Pré-saison compressée'))).toBe(true)
  })

  it('does NOT treat warnings as rule mapping keys', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: {
          resolutionMode: 'calendar_inferred',
          rulesApplied: [],
          warnings: ['some_technical_warning_without_spaces'],
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    // Technical-looking warning (underscore-only, no spaces) should be filtered
    expect(result.detailLines).not.toContain('some_technical_warning_without_spaces')
  })

  // ── Fallback ──

  it('fallback when no rules and no context → generic session count summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'backfilled', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(3),
      corrections: [],
    })

    expect(result.summaryLine).toContain('3 séances')
    expect(result.summaryLine).toContain('prévues')
    assertNoJargon(result)
  })

  // ── Detail line limit ──

  it('limits detailLines to 3', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        isMatchWeek: true,
        daysUntilNextMatch: 3,
        isDeloadWeek: true,
        fatigueLevel: 'very_high',
        loadManagementOverride: 'recovery',
        planningTrace: {
          resolutionMode: 'calendar_inferred',
          rulesApplied: ['rule:in_season_from_calendar'],
          warnings: ['Warning 1', 'Warning 2'],
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.detailLines.length).toBeLessThanOrEqual(3)
  })

  // ── No jargon in any output ──

  it('never produces jargon in any output combination', () => {
    // Stress test with many rules
    const result = buildExplanation({
      planningContext: makeCtx({
        cycle: 'playoffs',
        playoffTaperPhase: 'taper_1',
        isMatchWeek: true,
        daysUntilNextMatch: 2,
        planningTrace: {
          resolutionMode: 'calendar_inferred',
          rulesApplied: [
            'rule:in_season_from_calendar',
            'rule:playoffs_taper_1',
            'rule:manual_playoffs',
          ],
          warnings: [],
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [
        { id: 'c1', type: 'reschedule', toDay: 3, appliedAt: '2026-04-06', reversible: true },
        { id: 'c2', type: 'skip', sessionId: 's1', appliedAt: '2026-04-06', reversible: true },
      ],
    })

    assertNoJargon(result)
  })

  // ── Sequential with dominant constraint ──

  it('sequential + fatigue → surfaces fatigue in summary, not generic count', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        fatigueLevel: 'very_high',
        planningTrace: { resolutionMode: 'backfilled', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(2),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('fatigue')
    expect(result.summaryLine).not.toContain('rythme')
    assertNoJargon(result)
  })

  it('sequential + recovery override → surfaces recovery in summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        loadManagementOverride: 'recovery',
        planningTrace: { resolutionMode: 'backfilled', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(2),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('récupération')
    assertNoJargon(result)
  })

  it('sequential + deload rule → surfaces deload in summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        isDeloadWeek: true,
        planningTrace: { resolutionMode: 'backfilled', rulesApplied: ['rule:in_season_deload_3_1'], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(2),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('récupération')
    assertNoJargon(result)
  })

  it('sequential + normal off-season → keeps generic count summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        cycle: 'off_season',
        offSeasonPhase: 1,
        planningTrace: { resolutionMode: 'backfilled', rulesApplied: ['rule:off_season_start_at'], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(3),
      corrections: [],
    })

    expect(result.summaryLine).toContain('3 séances')
    expect(result.summaryLine).toContain('rythme')
    assertNoJargon(result)
  })

  it('sequential + rule:auto_season_ended_28d → surfaces season-ended in summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        cycle: 'off_season',
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: ['rule:auto_season_ended_28d'], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(3),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('terminée')
    expect(result.summaryLine).not.toContain('rythme')
    assertNoJargon(result)
  })

  it('sequential + rule:manual_playoffs → surfaces playoffs in summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        cycle: 'playoffs',
        planningTrace: { resolutionMode: 'manual_override', rulesApplied: ['rule:manual_playoffs'], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(2),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('finale')
    expect(result.summaryLine).not.toContain('rythme')
    assertNoJargon(result)
  })

  it('sequential + match context (not overriding) → keeps generic count', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        isMatchWeek: true,
        daysUntilNextMatch: 4,
        planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: [], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(2),
      corrections: [],
    })

    expect(result.summaryLine).toContain('séance')
    expect(result.summaryLine).toContain('rythme')
    assertNoJargon(result)
  })

  // ── Warning filtering for technical content ──

  it('filters warnings containing S1-S4 style references', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: {
          resolutionMode: 'calendar_inferred',
          rulesApplied: [],
          warnings: ['Phase S1–S4 décalée par rapport au calendrier ISO'],
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.detailLines).toHaveLength(0)
  })

  it('filters warnings containing Force-Bridge', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: {
          resolutionMode: 'calendar_inferred',
          rulesApplied: [],
          warnings: ['Force-Bridge appliqué entre blocs'],
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.detailLines).toHaveLength(0)
  })

  it('filters warnings containing off-season english term', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: {
          resolutionMode: 'calendar_inferred',
          rulesApplied: [],
          warnings: ['Off-season compressée : 6 semaines disponibles, minimum 8 appliqué.'],
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.detailLines).toHaveLength(0)
  })

  // ── Newly covered real rule/anchor ids ──

  it('rule:manual_cycle=off_season → programme ajusté', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'manual_override', rulesApplied: ['rule:manual_cycle=off_season'], warnings: [] },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(),
      corrections: [],
    })

    expect(result.detailLines.some(l => l.includes('manuellement'))).toBe(true)
    assertNoJargon(result)
  })

  it('anchor:season_ended_at_validated → saison terminée', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'explicit_anchors', rulesApplied: ['anchor:season_ended_at_validated'], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('terminée')
    assertNoJargon(result)
  })

  it('anchor:return_to_team_training_validated → retour au collectif', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: { resolutionMode: 'explicit_anchors', rulesApplied: ['anchor:return_to_team_training_validated'], warnings: [] },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine.toLowerCase()).toContain('retour')
    assertNoJargon(result)
  })

  // ── Long absence (Slice 4 S2) ──

  it('long absence → summaryLine: "Semaine de reprise progressive"', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        monitoringSnapshot: {
          completedSessionsLast7d: 0,
          completedSessionsLast28d: 0,
          hasHistoricalLogs: true,
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine).toBe('Semaine de reprise progressive')
    expect(result.detailLines.some(l => l.includes('réadaptent'))).toBe(true)
    assertNoJargon(result)
  })

  it('long absence in sequential mode → overrides generic count summary', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        monitoringSnapshot: {
          completedSessionsLast7d: 0,
          completedSessionsLast28d: 0,
          hasHistoricalLogs: true,
        },
      }),
      schedulingMode: 'sequential',
      presentation: makeSeqPres(),
      corrections: [],
    })

    expect(result.summaryLine).toBe('Semaine de reprise progressive')
    expect(result.summaryLine).not.toContain('rythme')
    assertNoJargon(result)
  })

  it('long absence + real rule id → reprise still dominates', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        planningTrace: {
          resolutionMode: 'calendar_inferred',
          rulesApplied: ['rule:pre_season_from_calendar'],
          warnings: [],
        },
        monitoringSnapshot: {
          completedSessionsLast7d: 0,
          completedSessionsLast28d: 0,
          hasHistoricalLogs: true,
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine).toBe('Semaine de reprise progressive')
    assertNoJargon(result)
  })

  it('new user with 0 sessions → no long-absence explanation', () => {
    const result = buildExplanation({
      planningContext: makeCtx({
        monitoringSnapshot: {
          completedSessionsLast7d: 0,
          completedSessionsLast28d: 0,
          hasHistoricalLogs: false,
        },
      }),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [],
    })

    expect(result.summaryLine).not.toContain('reprise')
    assertNoJargon(result)
  })

  // ── Fatigue idempotency (Hardening Batch 1) ──

  it('repeated fatigue corrections produce only one correction line (idempotent at correction layer)', () => {
    // Simulate what useWeekSnapshot now does: only one fatigue correction
    // should ever be in the corrections array (old ones are replaced)
    const result = buildExplanation({
      planningContext: makeCtx(),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [
        { id: 'c1', type: 'fatigue', appliedAt: '2026-04-06T10:00:00Z', reversible: false },
      ],
    })

    const fatigueLines = result.corrections.filter(l => l.includes('fatigue'))
    expect(fatigueLines).toHaveLength(1)
  })

  it('multiple fatigue corrections (if somehow accumulated) produce multiple lines — dedup is at hook layer', () => {
    // This test documents that buildExplanation itself is a pure map —
    // deduplication happens in useWeekSnapshot
    const result = buildExplanation({
      planningContext: makeCtx(),
      schedulingMode: 'calendar',
      presentation: makePres(),
      corrections: [
        { id: 'c1', type: 'fatigue', appliedAt: '2026-04-06T10:00:00Z', reversible: false },
        { id: 'c2', type: 'fatigue', appliedAt: '2026-04-06T10:01:00Z', reversible: false },
      ],
    })

    // buildExplanation is a pure mapper — if 2 fatigue corrections exist, it produces 2 lines
    const fatigueLines = result.corrections.filter(l => l.includes('fatigue'))
    expect(fatigueLines).toHaveLength(2)
  })
})

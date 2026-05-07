import { describe, expect, it } from 'vitest'
import {
  buildAnnualWeekCode,
  buildMotherSessionProgramSessionLog,
  mapMotherSessionType,
} from '../buildProgramSessionLog'
import type { ResolvedMotherSessionSlot } from '../../motherSession/resolveMotherSessionsForWeek'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import type { MotherSession } from '../../../types/motherSession'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFakeMotherSession(id: string, sessionType: MotherSession['metadata']['sessionType']): MotherSession {
  return {
    metadata: {
      id,
      status: 'validated',
      version: 'V1',
      cycle: 'off_season',
      sessionType,
      targetLevel: 'performance',
      targetPositionGroup: 'back_three',
      equipment: 'full_gym',
      targetDuration: '50-60 min',
    },
    title: `Mother ${id}`,
    goal: [],
    sessionIdentity: [],
    warmUp: { exercises: [], notes: [] },
    blocks: [],
    progressionRules: [],
    positionAccent: [],
    injurySubstitutions: [],
    coachingWarnings: [],
    sourceReferences: [],
  }
}

function makeFakeSlot(id: string, sessionType: MotherSession['metadata']['sessionType']): ResolvedMotherSessionSlot {
  return {
    sessionId: id,
    session: makeFakeMotherSession(id, sessionType),
    role: 'primary',
    dayPreference: 'early_week',
    variant: 'normal',
    maxBlocks: 5,
  }
}

function makePlanningContext(cycle: AnnualPlanningContext['cycle'] = 'off_season'): AnnualPlanningContext {
  return {
    cycle,
    weekNumber: 2,
    weekLabel: `${cycle} — S2`,
    isDeloadWeek: false,
    isMatchWeek: false,
    firstMatchDate: null,
    lastMatchDate: null,
    offSeasonStartAt: '2026-06-01',
    daysUntilNextMatch: null,
    daysSinceLastMatch: null,
    fatigueLevel: 'normal',
    weeklyFrequency: 3,
    positionGroup: 'back_three',
    planningTrace: { resolutionMode: 'backfilled', rulesApplied: [], warnings: [] },
  }
}

// ── Tests mapMotherSessionType ───────────────────────────────────────────────

describe('mapMotherSessionType', () => {
  it('lower → LOWER', () => expect(mapMotherSessionType('lower')).toBe('LOWER'))
  it('upper → UPPER', () => expect(mapMotherSessionType('upper')).toBe('UPPER'))
  it('full → FULL', () => expect(mapMotherSessionType('full')).toBe('FULL'))
  it('full_light_primer → FULL', () => expect(mapMotherSessionType('full_light_primer')).toBe('FULL'))
  it('speed_power → CONDITIONING', () => expect(mapMotherSessionType('speed_power')).toBe('CONDITIONING'))
})

// ── Tests buildMotherSessionProgramSessionLog ────────────────────────────────

describe('buildMotherSessionProgramSessionLog', () => {
  it('produit un log enrichi avec programSource=mother_session', () => {
    const slot = makeFakeSlot('FULL_OFFSEASON_HYPER_A_V1', 'full')
    const ctx = makePlanningContext('off_season')

    const log = buildMotherSessionProgramSessionLog({
      dateISO: '2026-03-21T10:00:00Z',
      fatigue: 'OK',
      notes: 'Bonne séance',
      slot,
      planningContext: ctx,
    })

    expect(log.programSource).toBe('mother_session')
    expect(log.motherSessionId).toBe('FULL_OFFSEASON_HYPER_A_V1')
    expect(log.sessionLabel).toBe('Corps complet \u00b7 A')
    expect(log.legacyRecipeId).toBeUndefined()
    expect(log.sessionType).toBe('FULL')
    expect(log.programContext).toMatchObject({
      cycle: 'off_season',
      weekLabel: 'off_season — S2',
      variant: 'normal',
      maxBlocks: 5,
      annualWeekNumber: 2,
      annualWeekCode: 'OFF_S02',
    })
  })

  it('mappe speed_power → CONDITIONING', () => {
    const slot = makeFakeSlot('SPEED_POWER_PRE_V1', 'speed_power')
    const ctx = makePlanningContext('pre_season')

    const log = buildMotherSessionProgramSessionLog({
      dateISO: '2026-03-21T10:00:00Z',
      fatigue: 'OK',
      slot,
      planningContext: ctx,
    })

    expect(log.sessionType).toBe('CONDITIONING')
  })

  it('week = DELOAD si planningContext.isDeloadWeek', () => {
    const slot = makeFakeSlot('LOWER_OFF_V1', 'lower')
    const ctx = makePlanningContext('off_season')
    ctx.isDeloadWeek = true

    const log = buildMotherSessionProgramSessionLog({
      dateISO: '2026-03-21T10:00:00Z',
      fatigue: 'FATIGUE',
      slot,
      planningContext: ctx,
    })

    expect(log.week).toBe('DELOAD')
  })

  it('week utilise weekNumber au lieu de W1 hardcodé', () => {
    const slot = makeFakeSlot('LOWER_OFF_V1', 'lower')
    const ctx = makePlanningContext('off_season')
    ctx.weekNumber = 6

    const log = buildMotherSessionProgramSessionLog({
      dateISO: '2026-03-21T10:00:00Z',
      fatigue: 'OK',
      slot,
      planningContext: ctx,
    })

    expect(log.week).toBe('W6')
    expect(log.programContext?.annualWeekCode).toBe('OFF_S06')
    expect(log.programContext?.annualWeekNumber).toBe(6)
  })

  it('embarque offSeasonPhase et preSeasonPhase', () => {
    const slot = makeFakeSlot('UPPER_PRE_V1', 'upper')
    const ctx = makePlanningContext('pre_season')
    ctx.preSeasonPhase = 2
    ctx.weekNumber = 8

    const log = buildMotherSessionProgramSessionLog({
      dateISO: '2026-03-21T10:00:00Z',
      fatigue: 'OK',
      slot,
      planningContext: ctx,
    })

    expect(log.programContext?.preSeasonPhase).toBe(2)
    expect(log.programContext?.annualWeekCode).toBe('PRE_S08')
  })
})

// ── Tests buildAnnualWeekCode ────────────────────────────────────────────────

describe('buildAnnualWeekCode', () => {
  it('off_season S1', () => expect(buildAnnualWeekCode('off_season', 1)).toBe('OFF_S01'))
  it('off_season S10', () => expect(buildAnnualWeekCode('off_season', 10)).toBe('OFF_S10'))
  it('pre_season S12', () => expect(buildAnnualWeekCode('pre_season', 12)).toBe('PRE_S12'))
  it('in_season W3', () => expect(buildAnnualWeekCode('in_season', 3)).toBe('IN_W03'))
  it('playoffs W1', () => expect(buildAnnualWeekCode('playoffs', 1)).toBe('PO_W01'))
  it('undefined weekNumber → S00', () => expect(buildAnnualWeekCode('off_season', undefined)).toBe('OFF_S00'))
})

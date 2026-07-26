import { describe, expect, it } from 'vitest'
import type { DatedSession } from '../../../types/scheduling'
import type { SessionLog } from '../../../types/training'
import {
  findSessionLogForPlannedSlot,
  mergeDatedSessionCompletion,
  motherSessionIdsLoggedThisWeek,
} from '../mergeDatedSessionCompletion'
import type { ResolvedMotherSessionSlot } from '../../motherSession/resolveMotherSessionsForWeek'

function mockSlot(sessionId: string): ResolvedMotherSessionSlot {
  return {
    sessionId,
    role: 'primary',
    dayPreference: 'early_week',
    session: {
      metadata: { id: 'X_V1', sessionType: 'full', blockRole: 'primary' },
      blocks: [],
    },
  } as unknown as ResolvedMotherSessionSlot
}

function baseDated(sessionId: string): DatedSession {
  return {
    kind: 'dated',
    sessionSlot: mockSlot(sessionId),
    dayOfWeek: 2,
    dayLabel: 'Mardi',
  }
}

describe('mergeDatedSessionCompletion', () => {
  it('marks session completed when a mother_session log exists in the same ISO week', () => {
    const sessions = [baseDated('MS_A')]
    const logs: SessionLog[] = [{
      id: '1',
      dateISO: '2026-04-08T18:00:00.000Z',
      week: 'W1',
      sessionType: 'FULL',
      fatigue: 'OK',
      programSource: 'mother_session',
      motherSessionId: 'MS_A',
    }]
    const merged = mergeDatedSessionCompletion(sessions, logs, '2026-04-07')
    expect(merged[0].completionStatus).toBe('completed')
  })

  it('does not mark completed when log is in another ISO week', () => {
    const sessions = [baseDated('MS_A')]
    const logs: SessionLog[] = [{
      id: '1',
      dateISO: '2026-04-01T18:00:00.000Z',
      week: 'W1',
      sessionType: 'FULL',
      fatigue: 'OK',
      programSource: 'mother_session',
      motherSessionId: 'MS_A',
    }]
    const merged = mergeDatedSessionCompletion(sessions, logs, '2026-04-07')
    expect(merged[0].completionStatus).toBeUndefined()
  })

  it('preserves skipped over completed', () => {
    const sessions: DatedSession[] = [{ ...baseDated('MS_A'), completionStatus: 'skipped' }]
    const logs: SessionLog[] = [{
      id: '1',
      dateISO: '2026-04-08T18:00:00.000Z',
      week: 'W1',
      sessionType: 'FULL',
      fatigue: 'OK',
      programSource: 'mother_session',
      motherSessionId: 'MS_A',
    }]
    const merged = mergeDatedSessionCompletion(sessions, logs, '2026-04-07')
    expect(merged[0].completionStatus).toBe('skipped')
  })

  it('clears stale completed when log is gone', () => {
    const sessions: DatedSession[] = [{ ...baseDated('MS_A'), completionStatus: 'completed' }]
    const merged = mergeDatedSessionCompletion(sessions, [], '2026-04-07')
    expect(merged[0].completionStatus).toBeUndefined()
  })

  it('motherSessionIdsLoggedThisWeek ignores non-mother logs', () => {
    const logs: SessionLog[] = [{
      id: '1',
      dateISO: '2026-04-08T18:00:00.000Z',
      week: 'W1',
      sessionType: 'ACTIVE_RECOVERY',
      fatigue: 'OK',
    }]
    const set = motherSessionIdsLoggedThisWeek(logs, '2026-04-07')
    expect(set.size).toBe(0)
  })
})

describe('findSessionLogForPlannedSlot', () => {
  const lowerLog: SessionLog = {
    id: 'log-lower',
    dateISO: '2026-07-23T18:00:00.000Z',
    week: 'W1',
    sessionType: 'LOWER',
    fatigue: 'OK',
    programSource: 'mother_session',
    motherSessionId: 'LOWER_OFFSEASON_FORCE_BRIDGE_V1',
    durationMin: 1,
  }
  const upperLog: SessionLog = {
    id: 'log-upper',
    dateISO: '2026-07-21T18:00:00.000Z',
    week: 'W1',
    sessionType: 'UPPER',
    fatigue: 'OK',
    programSource: 'mother_session',
    motherSessionId: 'UPPER_OFFSEASON_FORCE_BRIDGE_V1',
    durationMin: 55,
  }

  it('ne prend pas le log Bas du même jour pour un Haut planifié', () => {
    const found = findSessionLogForPlannedSlot([lowerLog, upperLog], {
      motherSessionId: 'UPPER_OFFSEASON_FORCE_BRIDGE_V1',
      plannedDateISO: '2026-07-23',
      weekAnchorISO: '2026-07-26',
      expectedSessionType: 'UPPER',
    })
    expect(found?.id).toBe('log-upper')
  })

  it('préfère le log du jour planifié quand plusieurs candidats existent', () => {
    const upperSameDay: SessionLog = {
      ...upperLog,
      id: 'log-upper-thu',
      dateISO: '2026-07-23T19:00:00.000Z',
    }
    const found = findSessionLogForPlannedSlot([upperLog, upperSameDay], {
      motherSessionId: 'UPPER_OFFSEASON_FORCE_BRIDGE_V1',
      plannedDateISO: '2026-07-23',
      weekAnchorISO: '2026-07-26',
    })
    expect(found?.id).toBe('log-upper-thu')
  })

  it('repli legacy : date + sessionType si pas de motherSessionId', () => {
    const legacy: SessionLog = {
      id: 'legacy-upper',
      dateISO: '2026-07-23T12:00:00.000Z',
      week: 'W1',
      sessionType: 'UPPER',
      fatigue: 'OK',
    }
    const found = findSessionLogForPlannedSlot([legacy, lowerLog], {
      motherSessionId: 'UPPER_OFFSEASON_FORCE_BRIDGE_V1',
      plannedDateISO: '2026-07-23',
      weekAnchorISO: '2026-07-26',
      expectedSessionType: 'UPPER',
    })
    expect(found?.id).toBe('legacy-upper')
  })
})

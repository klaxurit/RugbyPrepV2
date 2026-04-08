import { describe, expect, it } from 'vitest'
import type { DatedSession } from '../../../types/scheduling'
import type { SessionLog } from '../../../types/training'
import { mergeDatedSessionCompletion, motherSessionIdsLoggedThisWeek } from '../mergeDatedSessionCompletion'
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
  } as ResolvedMotherSessionSlot
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

import { describe, expect, it } from 'vitest'
import type { SessionLog } from '../types/training'
import { mergeLogsById } from './useHistory'

const makeLog = (overrides: Partial<SessionLog> & Pick<SessionLog, 'id' | 'dateISO'>): SessionLog => ({
  id: overrides.id,
  dateISO: overrides.dateISO,
  week: overrides.week ?? 'W1',
  sessionType: overrides.sessionType ?? 'FULL',
  fatigue: overrides.fatigue ?? 'OK',
  notes: overrides.notes,
  rpe: overrides.rpe,
  durationMin: overrides.durationMin,
  programSource: overrides.programSource,
  legacyRecipeId: overrides.legacyRecipeId,
  motherSessionId: overrides.motherSessionId,
  sessionLabel: overrides.sessionLabel,
  programContext: overrides.programContext,
})

describe('mergeLogsById', () => {
  it('préserve un log local absent du chargement Supabase', () => {
    const remote = [
      makeLog({ id: 'remote-1', dateISO: '2026-03-30T10:00:00.000Z' }),
    ]
    const localOnly = [
      makeLog({
        id: 'local-1',
        dateISO: '2026-03-31T09:00:00.000Z',
        programSource: 'mother_session',
        motherSessionId: 'FULL_OFFSEASON_RECOVERY_A_V1',
      }),
    ]

    const merged = mergeLogsById(localOnly, remote)

    expect(merged).toHaveLength(2)
    expect(merged.map((log) => log.id)).toEqual(['local-1', 'remote-1'])
  })

  it('déduplique les logs ayant le même id', () => {
    const local = [
      makeLog({ id: 'same-id', dateISO: '2026-03-31T09:00:00.000Z', notes: 'local' }),
    ]
    const remote = [
      makeLog({ id: 'same-id', dateISO: '2026-03-31T09:00:00.000Z', notes: 'remote' }),
    ]

    const merged = mergeLogsById(local, remote)

    expect(merged).toHaveLength(1)
    expect(merged[0].notes).toBe('remote')
  })
})

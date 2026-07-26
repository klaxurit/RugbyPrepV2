import { describe, expect, it } from 'vitest'
import type { SessionLog } from '../types/training'
import {
  excludeDeletedLogs,
  mergeHistoryAfterRemoteFetch,
  mergeLogsById,
} from './useHistory'

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
  slotSignature: overrides.slotSignature,
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

describe('mergeHistoryAfterRemoteFetch', () => {
  it('ne ressuscite pas un log annulé même si un fetch périmé le renvoie', () => {
    const deleted = makeLog({ id: 'gone', dateISO: '2026-07-21T12:00:00.000Z' })
    const { logs, deletedIds } = mergeHistoryAfterRemoteFetch(
      [],
      [deleted],
      new Set(['gone']),
    )

    expect(logs.map((l) => l.id)).not.toContain('gone')
    expect(deletedIds.has('gone')).toBe(true)
  })

  it('retire le tombstone quand le remote ne contient plus le log', () => {
    const other = makeLog({ id: 'keep', dateISO: '2026-07-20T12:00:00.000Z' })
    const { logs, deletedIds } = mergeHistoryAfterRemoteFetch(
      [makeLog({ id: 'gone', dateISO: '2026-07-21T12:00:00.000Z' })],
      [other],
      new Set(['gone']),
    )

    expect(logs.map((l) => l.id)).toEqual(['keep'])
    expect(deletedIds.has('gone')).toBe(false)
  })

  it('excludeDeletedLogs filtre correctement', () => {
    const logs = [
      makeLog({ id: 'a', dateISO: '2026-07-21T12:00:00.000Z' }),
      makeLog({ id: 'b', dateISO: '2026-07-20T12:00:00.000Z' }),
    ]
    expect(excludeDeletedLogs(logs, new Set(['a'])).map((l) => l.id)).toEqual(['b'])
  })

  it('purge locale d’un fantôme : tombstone + slotSignature retirent le log même sans remote', () => {
    const ghost = makeLog({
      id: 'da8f04cd-cad2-4c51-aff9-f671e233f070',
      dateISO: '2026-07-18T20:57:50.633Z',
      programSource: 'mother_session',
      motherSessionId: 'FULL_OFFSEASON_FORCE_BRIDGE_V1',
      slotSignature: 'FULL_OFFSEASON_FORCE_BRIDGE_V1:Inter-saison Force-Pont - S9:2',
    })
    const keep = makeLog({ id: 'keep', dateISO: '2026-07-20T12:00:00.000Z' })
    const deletedIds = new Set([ghost.id])
    const next = excludeDeletedLogs([ghost, keep], deletedIds).filter(
      (log) =>
        !deletedIds.has(log.id) &&
        log.slotSignature !== 'FULL_OFFSEASON_FORCE_BRIDGE_V1:Inter-saison Force-Pont - S9:2',
    )
    expect(next.map((l) => l.id)).toEqual(['keep'])
  })
})

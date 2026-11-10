import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearVolumeConfidenceBypass,
  countGymLogsSince,
  detectVolumeLighteningReasons,
  isVolumeConfidenceBypassExpired,
  persistVolumeConfidenceBypass,
  readVolumeConfidenceBypass,
  reconcileVolumeConfidenceBypass,
  VOLUME_CONFIDENCE_STORAGE_KEY,
} from '../volumeConfidenceBypass'

function stubLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
    },
    dispatchEvent: () => true,
  })
}

describe('volumeConfidenceBypass', () => {
  beforeEach(() => {
    stubLocalStorage()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detecte restart + absence, ignore en décharge', () => {
    expect(
      detectVolumeLighteningReasons({
        profile: { trainingBaseline: 'restart', trainingBaselineSetAt: '2026-11-01T10:00:00.000Z' },
        today: '2026-11-06',
        completedSessionsLast7d: 0,
        completedSessionsLast28d: 0,
        hasHistoricalLogs: true,
      }),
    ).toEqual(['restart_ramp', 'long_absence'])

    expect(
      detectVolumeLighteningReasons({
        profile: {},
        today: '2026-11-06',
        inSeasonSubMode: 'treve_rampup',
        isDeloadWeek: true,
      }),
    ).toEqual([])
  })

  it('persist / read / clear', () => {
    persistVolumeConfidenceBypass({
      activatedAt: '2026-11-06T09:00:00.000Z',
      reason: 'treve_rampup',
      reasons: ['treve_rampup'],
    })
    expect(readVolumeConfidenceBypass()?.reason).toBe('treve_rampup')
    clearVolumeConfidenceBypass()
    expect(readVolumeConfidenceBypass()).toBeNull()
    expect(window.localStorage.getItem(VOLUME_CONFIDENCE_STORAGE_KEY)).toBeNull()
  })

  it('expire après 3 séances salle ou 14 jours', () => {
    const decision = {
      activatedAt: '2026-11-01T09:00:00.000Z',
      reason: 'long_absence' as const,
      reasons: ['long_absence' as const],
    }
    expect(
      countGymLogsSince(
        [
          { sessionType: 'UPPER', dateISO: '2026-11-02' },
          { sessionType: 'LOWER', dateISO: '2026-11-03' },
          { sessionType: 'ACTIVE_RECOVERY', dateISO: '2026-11-04' },
          { sessionType: 'FULL', dateISO: '2026-11-05' },
        ],
        decision.activatedAt,
      ),
    ).toBe(3)
    expect(
      isVolumeConfidenceBypassExpired(decision, '2026-11-06', [
        { sessionType: 'UPPER', dateISO: '2026-11-02' },
        { sessionType: 'LOWER', dateISO: '2026-11-03' },
        { sessionType: 'FULL', dateISO: '2026-11-05' },
      ]),
    ).toBe(true)
    expect(
      isVolumeConfidenceBypassExpired(
        { ...decision, activatedAt: '2026-10-20T09:00:00.000Z' },
        '2026-11-06',
        [],
      ),
    ).toBe(true)
  })

  it('reconcile purge si expiré', () => {
    persistVolumeConfidenceBypass({
      activatedAt: '2026-10-01T09:00:00.000Z',
      reason: 'restart_ramp',
      reasons: ['restart_ramp'],
    })
    expect(reconcileVolumeConfidenceBypass('2026-11-06', [])).toBeNull()
    expect(readVolumeConfidenceBypass()).toBeNull()
  })
})

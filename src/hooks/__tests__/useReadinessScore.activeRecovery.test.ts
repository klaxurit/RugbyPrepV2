// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReadinessScore, type UseReadinessScoreParams } from '../useReadinessScore'
import type { SessionLog } from '../../types/training'

function makeLog(
  dateISO: string,
  sessionType: SessionLog['sessionType'] = 'FULL',
): SessionLog {
  return {
    id: `log-${dateISO}-${sessionType}`,
    dateISO,
    week: 'W1',
    sessionType,
    fatigue: 'OK',
    rpe: sessionType === 'ACTIVE_RECOVERY' ? 2 : 7,
    durationMin: sessionType === 'ACTIVE_RECOVERY' ? 20 : 60,
  }
}

const TODAY = '2026-04-04'

const BASE: Omit<UseReadinessScoreParams, 'logs'> = {
  acwrZone: 'optimal',
  fatigue: 'OK',
  nextMatchDate: '2026-04-06',
  today: TODAY,
}

describe('useReadinessScore — ACTIVE_RECOVERY isolation', () => {
  it('ACTIVE_RECOVERY log does not become lastSessionDateISO', () => {
    const trainingLog = makeLog('2026-04-01T10:00:00', 'FULL')
    const activeRecLog = makeLog('2026-04-03T10:00:00', 'ACTIVE_RECOVERY')

    // With only the training log
    const { result: baseline } = renderHook(() =>
      useReadinessScore({ ...BASE, logs: [trainingLog] }),
    )

    // With training + active recovery (AR is more recent but should be ignored)
    const { result: withAR } = renderHook(() =>
      useReadinessScore({ ...BASE, logs: [activeRecLog, trainingLog] }),
    )

    // Score should be identical — AR doesn't change lastSessionDateISO
    expect(withAR.current.score).toBe(baseline.current.score)
    expect(withAR.current.components.recovery).toEqual(baseline.current.components.recovery)
  })

  it('only ACTIVE_RECOVERY logs → no lastSession → recovery component null', () => {
    const { result } = renderHook(() =>
      useReadinessScore({
        ...BASE,
        logs: [makeLog('2026-04-03T10:00:00', 'ACTIVE_RECOVERY')],
      }),
    )

    expect(result.current.components.recovery).toBeNull()
  })
})

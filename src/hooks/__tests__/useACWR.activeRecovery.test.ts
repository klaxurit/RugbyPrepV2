// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useACWR } from '../useACWR'
import type { CalendarEvent, SessionLog } from '../../types/training'

function makeLog(
  dateISO: string,
  sessionType: SessionLog['sessionType'] = 'FULL',
  rpe = 7,
  durationMin = 60,
): SessionLog {
  return {
    id: `log-${dateISO}-${sessionType}`,
    dateISO,
    week: 'W1',
    sessionType,
    fatigue: 'OK',
    rpe,
    durationMin,
  }
}

// Pin "today" so ACWR windows are deterministic
const FAKE_NOW = new Date('2026-04-04T12:00:00')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FAKE_NOW)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useACWR — ACTIVE_RECOVERY exclusion', () => {
  it('excludes ACTIVE_RECOVERY logs from acuteLoad', () => {
    const trainingLog = makeLog('2026-04-02T10:00:00', 'FULL', 7, 60) // 420 AU
    const activeRecLog = makeLog('2026-04-03T10:00:00', 'ACTIVE_RECOVERY', 2, 20) // 40 AU — should be excluded

    const { result: withAR } = renderHook(() =>
      useACWR([trainingLog, activeRecLog]),
    )
    const { result: withoutAR } = renderHook(() =>
      useACWR([trainingLog]),
    )

    expect(withAR.current.acuteLoad).toBe(withoutAR.current.acuteLoad)
    expect(withAR.current.acuteLoad).toBe(420)
  })

  it('excludes ACTIVE_RECOVERY logs from chronicLoad', () => {
    // 4 weeks of data — 1 training log per week + 1 ACTIVE_RECOVERY per week
    const logs: SessionLog[] = []
    for (let w = 0; w < 4; w++) {
      const d = new Date(FAKE_NOW)
      d.setDate(d.getDate() - w * 7 - 1)
      const iso = d.toISOString()
      logs.push(makeLog(iso, 'FULL', 6, 50)) // 300 AU per week
      logs.push(makeLog(iso.replace('T12:', 'T14:'), 'ACTIVE_RECOVERY', 2, 20)) // 40 AU — excluded
    }

    const { result } = renderHook(() => useACWR(logs))

    // Chronic load should be ~300 AU/week (not 340)
    expect(result.current.chronicLoad).toBe(300)
  })

  it('ACTIVE_RECOVERY-only history produces zero load', () => {
    const arLogs = [
      makeLog('2026-04-01T10:00:00', 'ACTIVE_RECOVERY', 3, 20),
      makeLog('2026-04-02T10:00:00', 'ACTIVE_RECOVERY', 2, 25),
    ]

    const { result } = renderHook(() => useACWR(arLogs))

    expect(result.current.acuteLoad).toBe(0)
    expect(result.current.chronicLoad).toBe(0)
  })

  it('ignores hidden matches when converting calendar load into ACWR', () => {
    const trainingLog = makeLog('2026-04-02T10:00:00', 'FULL', 7, 60) // 420 AU
    const hiddenMatch: CalendarEvent = {
      id: 'match-hidden',
      date: '2026-04-03',
      type: 'match',
      source: 'ffr_import',
      rpe: 8,
      duration_min: 80,
      user_hidden: true,
    }

    const { result } = renderHook(() => useACWR([trainingLog], [hiddenMatch]))

    expect(result.current.acuteLoad).toBe(420)
  })
})

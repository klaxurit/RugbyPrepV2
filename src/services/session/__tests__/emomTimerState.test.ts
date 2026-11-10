import { describe, expect, it } from 'vitest'
import { deriveEmomTimerView, emomPersistKey } from '../emomTimerState'

describe('deriveEmomTimerView', () => {
  const base = { totalMinutes: 8, intervalSeconds: 60 }

  it('idle / début → Minute 1, pas finished', () => {
    const v = deriveEmomTimerView({ ...base, elapsedSec: 0, status: 'running' })
    expect(v.displayMinute).toBe(1)
    expect(v.emomFinished).toBe(false)
    expect(v.remainingInIntervalSec).toBe(60)
  })

  it('fin naturelle → 8/8, 0:00, finished', () => {
    const v = deriveEmomTimerView({ ...base, elapsedSec: 480, status: 'running' })
    expect(v.emomFinished).toBe(true)
    expect(v.displayMinute).toBe(8)
    expect(v.remainingInIntervalSec).toBe(0)
    expect(v.currentMinuteIndex).toBe(7)
  })

  it('status completed → finished même si elapsed pile', () => {
    const v = deriveEmomTimerView({ ...base, elapsedSec: 480, status: 'completed' })
    expect(v.emomFinished).toBe(true)
    expect(v.status).toBe('completed')
  })

  it('skip vers fin de minute 1 → display 2', () => {
    const v = deriveEmomTimerView({ ...base, elapsedSec: 60, status: 'running' })
    expect(v.displayMinute).toBe(2)
    expect(v.currentMinuteIndex).toBe(1)
  })

  it('emomPersistKey stable', () => {
    expect(emomPersistKey(3)).toBe('emom-block-3')
  })
})

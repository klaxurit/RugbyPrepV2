import { describe, expect, it, beforeEach, vi } from 'vitest'
import { clearUserStorage, clearUserStorageForUser } from '../clearUserStorage'
import { userScopedKey } from '../userScopedStorage'

// ── Mock localStorage ─────────────────────────────────────────────

const store: Record<string, string> = {}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k])

  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  })
})

describe('clearUserStorage', () => {
  it('removes known static keys', () => {
    store['rugbyprep.profile.v1'] = 'x'
    store['rugbyprep.week.v1'] = 'x'
    store['rugbyprep.fatigue.v1'] = 'x'

    clearUserStorage()

    expect(store['rugbyprep.profile.v1']).toBeUndefined()
    expect(store['rugbyprep.week.v1']).toBeUndefined()
    expect(store['rugbyprep.fatigue.v1']).toBeUndefined()
  })

  it('F1: removes weekSnapshot v1 keys (per-user dynamic prefix)', () => {
    store['rugbyprep.weekSnapshot.v1.user-abc'] = '{"weekId":"W2026-15"}'
    store['rugbyprep.weekSnapshot.v1.user-xyz'] = '{"weekId":"W2026-15"}'

    clearUserStorage()

    expect(store['rugbyprep.weekSnapshot.v1.user-abc']).toBeUndefined()
    expect(store['rugbyprep.weekSnapshot.v1.user-xyz']).toBeUndefined()
  })

  it('F12: removes weekSnapshot v2 week-scoped keys on sign-out', () => {
    store['rugbyprep.weekSnapshot.v2.user-abc.W2026-15'] = '{"weekId":"W2026-15"}'
    store['rugbyprep.weekSnapshot.v2.user-abc.W2026-16'] = '{"weekId":"W2026-16"}'
    store['rugbyprep.weekSnapshot.v2.user-xyz.W2026-15'] = '{"weekId":"W2026-15"}'

    clearUserStorage()

    expect(store['rugbyprep.weekSnapshot.v2.user-abc.W2026-15']).toBeUndefined()
    expect(store['rugbyprep.weekSnapshot.v2.user-abc.W2026-16']).toBeUndefined()
    expect(store['rugbyprep.weekSnapshot.v2.user-xyz.W2026-15']).toBeUndefined()
  })

  it('F1: removes blockProgression keys (per-user dynamic prefix)', () => {
    store['rugbyprep.blockProgression.v1.user-abc'] = '{"currentBlockIndex":0}'

    clearUserStorage()

    expect(store['rugbyprep.blockProgression.v1.user-abc']).toBeUndefined()
  })

  it('F1: removes schedulingMode baseline keys (per-user dynamic prefix)', () => {
    store['rugbyprep.schedulingMode.baseline.user-abc'] = 'calendar'
    store['rugbyprep.schedulingMode.baseline.user-xyz'] = 'sequential'

    clearUserStorage()

    expect(store['rugbyprep.schedulingMode.baseline.user-abc']).toBeUndefined()
    expect(store['rugbyprep.schedulingMode.baseline.user-xyz']).toBeUndefined()
  })

  it('F1: removes schedulingTransition dismissed keys (per-user dynamic prefix)', () => {
    store['rugbyprep.schedulingTransition.dismissed.user-abc'] = '["calendar_mode_activated"]'

    clearUserStorage()

    expect(store['rugbyprep.schedulingTransition.dismissed.user-abc']).toBeUndefined()
  })

  it('preserves unrelated keys', () => {
    store['some.other.key'] = 'keep me'

    clearUserStorage()

    expect(store['some.other.key']).toBe('keep me')
  })
})

describe('clearUserStorageForUser', () => {
  it('removes only the targeted user scoped keys', () => {
    const profileA = userScopedKey('rugbyprep.profile', 'user-a')
    const profileB = userScopedKey('rugbyprep.profile', 'user-b')
    store[profileA] = '{"profile":{}}'
    store[profileB] = '{"profile":{}}'
    store['rugbyprep.weekSnapshot.v2.user-a.W2026-15'] = '{}'
    store['rugbyprep.weekSnapshot.v2.user-b.W2026-15'] = '{}'

    clearUserStorageForUser('user-a')

    expect(store[profileA]).toBeUndefined()
    expect(store[profileB]).toBeDefined()
    expect(store['rugbyprep.weekSnapshot.v2.user-a.W2026-15']).toBeUndefined()
    expect(store['rugbyprep.weekSnapshot.v2.user-b.W2026-15']).toBeDefined()
  })
})

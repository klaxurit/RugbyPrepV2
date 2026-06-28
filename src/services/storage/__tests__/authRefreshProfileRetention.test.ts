import { describe, expect, it, beforeEach, vi } from 'vitest'
import { shouldClearUserStorageOnAuthChange } from '../syncUserStoragePolicy'
import { clearLegacyUserStorage, clearUserStorageForUser } from '../clearUserStorage'
import { userScopedKey } from '../userScopedStorage'

const store: Record<string, string> = {}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k])
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    get length() {
      return Object.keys(store).length
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
  })
})

/** Mirrors AuthContext.syncUserStorage without React. */
function syncUserStorage(lastUserId: string | null, newUserId: string | null): string | null {
  if (shouldClearUserStorageOnAuthChange(lastUserId, newUserId)) {
    if (lastUserId) clearUserStorageForUser(lastUserId)
    clearLegacyUserStorage()
  }
  return newUserId
}

describe('auth refresh profile retention', () => {
  it('keeps cached profile when Supabase emits transient null then restores same user', () => {
    const userId = 'user-abc'
    const profileKey = userScopedKey('rugbyprep.profile', userId)
    store[profileKey] = JSON.stringify({
      profile: { equipment: [], weeklySessions: 2 },
      savedAt: '2026-06-18T10:00:00.000Z',
    })

    syncUserStorage(userId, null)
    expect(store[profileKey]).toBeDefined()

    syncUserStorage(null, userId)
    expect(store[profileKey]).toBeDefined()
    expect(JSON.parse(store[profileKey]).profile.equipment).toEqual([])
  })

  it('clears only the previous user when switching accounts', () => {
    const profileA = userScopedKey('rugbyprep.profile', 'user-a')
    const profileB = userScopedKey('rugbyprep.profile', 'user-b')
    store[profileA] = '{"profile":{"equipment":["barbell"]}}'
    store[profileB] = '{"profile":{"equipment":[]}}'

    syncUserStorage('user-a', 'user-b')

    expect(store[profileA]).toBeUndefined()
    expect(store[profileB]).toBeDefined()
    expect(JSON.parse(store[profileB]).profile.equipment).toEqual([])
  })
})

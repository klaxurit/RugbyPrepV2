/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isUserScopedStorageEventKey,
  subscribeRefetchOnDocumentVisible,
  subscribeUserScopedStorageKey,
} from '../subscribeUserScopedStorageSync'
import { userScopedKey } from '../userScopedStorage'

describe('subscribeUserScopedStorageSync', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('isUserScopedStorageEventKey matche la clé user', () => {
    const uid = 'user-abc'
    expect(
      isUserScopedStorageEventKey(
        userScopedKey('rugbyprep.calendar', uid),
        'rugbyprep.calendar',
        uid,
      ),
    ).toBe(true)
    expect(
      isUserScopedStorageEventKey(
        userScopedKey('rugbyprep.profile', uid),
        'rugbyprep.calendar',
        uid,
      ),
    ).toBe(false)
    expect(isUserScopedStorageEventKey(null, 'rugbyprep.calendar', uid)).toBe(false)
  })

  it('storage event d’un autre onglet déclenche onChange', () => {
    const uid = 'u1'
    const onChange = vi.fn()
    const unsub = subscribeUserScopedStorageKey('rugbyprep.calendar', uid, onChange)
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: userScopedKey('rugbyprep.calendar', uid),
        newValue: '[]',
      }),
    )
    expect(onChange).toHaveBeenCalledTimes(1)
    unsub()
  })

  it('visibility visible → refetch', () => {
    const refetch = vi.fn()
    const unsub = subscribeRefetchOnDocumentVisible(refetch)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(refetch).toHaveBeenCalledTimes(1)
    unsub()
  })

  it('visibility hidden → pas de refetch', () => {
    const refetch = vi.fn()
    const unsub = subscribeRefetchOnDocumentVisible(refetch)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(refetch).not.toHaveBeenCalled()
    unsub()
  })
})

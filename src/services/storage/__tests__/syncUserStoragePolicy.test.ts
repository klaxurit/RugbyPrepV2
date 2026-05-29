import { describe, expect, it } from 'vitest'
import { shouldClearUserStorageOnAuthChange } from '../syncUserStoragePolicy'

describe('shouldClearUserStorageOnAuthChange', () => {
  it('does nothing when userId is unchanged', () => {
    expect(shouldClearUserStorageOnAuthChange('user-a', 'user-a')).toBe(false)
  })

  it('does not clear when anchoring first session (lastUserId null)', () => {
    expect(shouldClearUserStorageOnAuthChange(null, 'user-a')).toBe(false)
  })

  it('does not clear when lastUserId was lost but same user returns', () => {
    expect(shouldClearUserStorageOnAuthChange(null, 'user-a')).toBe(false)
  })

  it('clears when switching from user A to user B', () => {
    expect(shouldClearUserStorageOnAuthChange('user-a', 'user-b')).toBe(true)
  })

  it('clears when signing out (known user → anonymous)', () => {
    expect(shouldClearUserStorageOnAuthChange('user-a', null)).toBe(true)
  })

  it('does not clear anonymous → anonymous', () => {
    expect(shouldClearUserStorageOnAuthChange(null, null)).toBe(false)
  })
})

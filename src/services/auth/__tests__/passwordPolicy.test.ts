import { describe, expect, it } from 'vitest'
import { MIN_PASSWORD_LENGTH, isPasswordMeetingPolicy, passwordTooWeakMessage } from '../passwordPolicy'

describe('passwordPolicy', () => {
  it('rejects passwords shorter than the minimum', () => {
    expect(isPasswordMeetingPolicy('azerty')).toBe(false)
    expect(isPasswordMeetingPolicy('azerty12')).toBe(false)
    expect(isPasswordMeetingPolicy('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false)
  })

  it('accepts passwords at or above the minimum', () => {
    expect(isPasswordMeetingPolicy('azerty12xx')).toBe(true)
    expect(isPasswordMeetingPolicy('une phrase de passe')).toBe(true)
  })

  it('mentions the minimum length in the error copy', () => {
    expect(passwordTooWeakMessage()).toContain(String(MIN_PASSWORD_LENGTH))
  })
})

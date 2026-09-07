// @vitest-environment jsdom

import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearPasswordNeedsUpgradeNote,
  notePasswordNeedsUpgrade,
  peekPasswordNeedsUpgrade,
  resolvePasswordNeedsUpgrade,
} from '../passwordUpgradeGate'

describe('passwordUpgradeGate', () => {
  beforeEach(() => {
    clearPasswordNeedsUpgradeNote()
  })

  it('notes a short-password login before the profile fetch can race', () => {
    notePasswordNeedsUpgrade(true)
    expect(peekPasswordNeedsUpgrade()).toBe(true)
    expect(resolvePasswordNeedsUpgrade(false)).toBe(true)
    expect(resolvePasswordNeedsUpgrade(undefined)).toBe(true)
  })

  it('does not prompt when both the profile and the session say the password is ok', () => {
    notePasswordNeedsUpgrade(false)
    expect(peekPasswordNeedsUpgrade()).toBe(false)
    expect(resolvePasswordNeedsUpgrade(false)).toBe(false)
    expect(resolvePasswordNeedsUpgrade(true, false)).toBe(true)
    expect(resolvePasswordNeedsUpgrade(false, true)).toBe(true)
  })
})

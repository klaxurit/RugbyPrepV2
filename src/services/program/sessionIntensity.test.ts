import { describe, expect, it } from 'vitest'
import type { SessionIntensity } from '../../types/training'
import { buildWeekProgram } from './buildWeekProgram'
import { getIntensityPreferences, getWeekIntensityPattern } from './sessionIntensity'
import { createProfile, SIMULATION_PROFILES } from './testHelpers'

// ── Unit tests for intensity module ───────────────────────────────

describe('getWeekIntensityPattern', () => {
  it('returns heavy → medium for performance 2×', () => {
    expect(getWeekIntensityPattern('performance', 2)).toEqual(['heavy', 'medium'])
  })

  it('returns heavy → medium → light for performance 3×', () => {
    expect(getWeekIntensityPattern('performance', 3)).toEqual(['heavy', 'medium', 'light'])
  })

  it('returns medium → medium for starter 2×', () => {
    expect(getWeekIntensityPattern('starter', 2)).toEqual(['medium', 'medium'])
  })

  it('returns medium → light for builder 2×', () => {
    expect(getWeekIntensityPattern('builder', 2)).toEqual(['medium', 'light'])
  })

  it('returns medium → medium → light for builder 3×', () => {
    expect(getWeekIntensityPattern('builder', 3)).toEqual(['medium', 'medium', 'light'])
  })
})

describe('getIntensityPreferences', () => {
  it('returns non-empty prefer tags for each intensity', () => {
    for (const intensity of ['heavy', 'medium', 'light'] as SessionIntensity[]) {
      const prefs = getIntensityPreferences(intensity)
      expect(prefs.preferTags.length).toBeGreaterThan(0)
      expect(prefs.priorityIntents.length).toBeGreaterThan(0)
    }
  })
})

// ── Integration tests: intensity flows through to sessions ──────

describe('session intensity assignment', () => {
  it('TID-INT-001 performance 3× assigns heavy/medium/light to sessions', () => {
    const result = buildWeekProgram(createProfile(), 'W1')

    expect(result.sessions).toHaveLength(3)
    expect(result.sessions[0]?.intensity).toBe('heavy')
    expect(result.sessions[1]?.intensity).toBe('medium')
    expect(result.sessions[2]?.intensity).toBe('light')
  })

  it('TID-INT-002 performance 2× assigns heavy/medium to sessions', () => {
    const result = buildWeekProgram(createProfile({ weeklySessions: 2 }), 'W1')

    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0]?.intensity).toBe('heavy')
    expect(result.sessions[1]?.intensity).toBe('medium')
  })

  it('TID-INT-003 starter always assigns medium intensity', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.S1!, 'W1')

    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0]?.intensity).toBe('medium')
    expect(result.sessions[1]?.intensity).toBe('medium')
  })

  it('TID-INT-004 builder 2× assigns medium/light', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.B1!, 'W1')

    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0]?.intensity).toBe('medium')
    expect(result.sessions[1]?.intensity).toBe('light')
  })

  it('TID-INT-005 builder 3× assigns medium/medium/light', () => {
    const result = buildWeekProgram(SIMULATION_PROFILES.B2!, 'W1')

    expect(result.sessions).toHaveLength(3)
    expect(result.sessions[0]?.intensity).toBe('medium')
    expect(result.sessions[1]?.intensity).toBe('medium')
    expect(result.sessions[2]?.intensity).toBe('light')
  })

  it('TID-INT-006 DELOAD has no intensity assignment (H1, VC-05: structured + mobility)', () => {
    const result = buildWeekProgram(createProfile(), 'DELOAD')

    // VC-05: performance 3x deload = 1 structured + 1 mobility (no duplicate)
    expect(result.sessions).toHaveLength(2)
    // DELOAD sessions have no intensity (week === 'DELOAD' → empty intensity pattern)
    for (const session of result.sessions) {
      expect(session.intensity).toBeUndefined()
    }
  })

  it('TID-INT-007 intensity is consistent across all critical weeks', () => {
    const profile = createProfile()
    const weeks = ['H1', 'H4', 'W1', 'W4', 'W5', 'W8'] as const

    for (const week of weeks) {
      const result = buildWeekProgram(profile, week)
      expect(result.sessions[0]?.intensity).toBe('heavy')
      expect(result.sessions[1]?.intensity).toBe('medium')
      expect(result.sessions[2]?.intensity).toBe('light')
    }
  })
})

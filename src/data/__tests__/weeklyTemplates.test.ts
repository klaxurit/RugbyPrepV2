import { describe, expect, it } from 'vitest'
import {
  FATIGUE_OVERRIDES,
  getWeeklyTemplate,
  WEEKLY_TEMPLATES,
} from '../weeklyTemplates'

describe('WEEKLY_TEMPLATES', () => {
  it('exporte des templates et des règles fatigue', () => {
    expect(WEEKLY_TEMPLATES.length).toBeGreaterThan(10)
    expect(FATIGUE_OVERRIDES.length).toBeGreaterThanOrEqual(5)
  })
})

describe('getWeeklyTemplate', () => {
  it('phase 1, 3x, front_row -> Lower + Upper + Full pré-saison force', () => {
    const { sessions: slots } = getWeeklyTemplate({
      cycle: 'pre_season',
      phase: 1,
      frequency: 3,
      positionGroup: 'front_row',
    })
    expect(slots).toHaveLength(3)
    expect(slots.map((s) => s.sessionId)).toEqual([
      'LOWER_PRESEASON_FORCE_V1',
      'UPPER_PRESEASON_FORCE_V1',
      'FULL_PRESEASON_FORCE_V1',
    ])
    expect(slots.every((s) => s.role === 'primary')).toBe(true)
  })

  it('phase 3, 3x, back_three -> séances spécifiques back_three', () => {
    const { sessions: slots } = getWeeklyTemplate({
      cycle: 'pre_season',
      phase: 3,
      frequency: 3,
      positionGroup: 'back_three',
    })
    expect(slots.map((s) => s.sessionId)).toEqual([
      'LOWER_PRESEASON_POWER_BACK_THREE_V1',
      'UPPER_PRESEASON_POWER_BACK_THREE_V1',
      'FULL_PRESEASON_POWER_BACK_THREE_V1',
    ])
  })

  it('in-season 3x, match_week, front_row -> Lower + Upper + Primer', () => {
    const { sessions: slots } = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'front_row',
      matchContext: 'match_week',
    })
    expect(slots.map((s) => s.sessionId)).toEqual([
      'LOWER_IN_SEASON_FRONT_ROW_V1',
      'UPPER_IN_SEASON_FRONT_ROW_V1',
      'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1',
    ])
  })

  it('in-season 3x, no_match_week, back_three -> Lower + Upper + Full Body', () => {
    const { sessions: slots } = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'back_three',
      matchContext: 'no_match_week',
    })
    expect(slots.map((s) => s.sessionId)).toEqual([
      'LOWER_IN_SEASON_BACK_THREE_V1',
      'UPPER_IN_SEASON_BACK_THREE_V1',
      'FULL_BODY_IN_SEASON_BACK_THREE_V1',
    ])
  })

  it('fatigue high + match_week -> Primer conservé en light maxBlocks 2', () => {
    const { sessions: slots } = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'front_row',
      matchContext: 'match_week',
      fatigueLevel: 'high',
    })
    expect(slots[2].sessionId).toBe('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1')
    expect(slots[2].variant).toBe('light')
    expect(slots[2].maxBlocks).toBe(2)
  })

  it('fatigue high + no_match_week -> Primer light remplace Full Body', () => {
    const { sessions: slots } = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'front_row',
      matchContext: 'no_match_week',
      fatigueLevel: 'high',
    })
    expect(slots).toHaveLength(3)
    expect(slots[2].sessionId).toBe('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1')
    expect(slots[2].variant).toBe('light')
    expect(slots[2].maxBlocks).toBe(2)
    expect(slots[2].dayPreference).toBe('pre_match')
  })

  it('pre_season phase 1, 4x, high fatigue -> retire la 4e séance optionnelle', () => {
    const { sessions: slots, effectiveFrequency } = getWeeklyTemplate({
      cycle: 'pre_season',
      phase: 1,
      frequency: 4,
      positionGroup: 'front_row',
      fatigueLevel: 'high',
    })
    expect(effectiveFrequency).toBe(3)
    expect(slots).toHaveLength(3)
    expect(slots.some((s) => s.sessionId === 'SPEED_POWER_PRESEASON_INTRO_V1')).toBe(false)
    expect(slots.map((s) => s.sessionId)).toEqual([
      'LOWER_PRESEASON_FORCE_V1',
      'UPPER_PRESEASON_FORCE_V1',
      'FULL_PRESEASON_FORCE_V1',
    ])
  })

  it('pre_season phase 3 + frequency 4 -> structure 3x (pas de 4e séance inventée)', () => {
    const { sessions: slots, effectiveFrequency } = getWeeklyTemplate({
      cycle: 'pre_season',
      phase: 3,
      frequency: 4,
      positionGroup: 'front_row',
    })
    expect(effectiveFrequency).toBe(3)
    expect(slots).toHaveLength(3)
    expect(slots.map((s) => s.sessionId)).toEqual([
      'LOWER_PRESEASON_POWER_FRONT_ROW_V1',
      'UPPER_PRESEASON_POWER_FRONT_ROW_V1',
      'FULL_PRESEASON_POWER_FRONT_ROW_V1',
    ])
  })

  it('very_high traité comme high (in-season no match)', () => {
    const high = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'back_three',
      matchContext: 'no_match_week',
      fatigueLevel: 'high',
    })
    const veryHigh = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'back_three',
      matchContext: 'no_match_week',
      fatigueLevel: 'very_high',
    })
    expect(veryHigh.sessions.map((s) => s.sessionId)).toEqual(
      high.sessions.map((s) => s.sessionId)
    )
    expect(veryHigh.sessions[2].variant).toBe('light')
  })

  it('lève si phase manquante en pré-saison', () => {
    expect(() =>
      getWeeklyTemplate({
        cycle: 'pre_season',
        frequency: 3,
        positionGroup: 'front_row',
      } as Parameters<typeof getWeeklyTemplate>[0])
    ).toThrow(/phase requise/)
  })

  it('lève si matchContext manquant in_season 3x', () => {
    expect(() =>
      getWeeklyTemplate({
        cycle: 'in_season',
        frequency: 3,
        positionGroup: 'front_row',
      } as Parameters<typeof getWeeklyTemplate>[0])
    ).toThrow(/matchContext requis/)
  })

  it('retourne une nouvelle array à chaque appel', () => {
    const a = getWeeklyTemplate({
      cycle: 'pre_season',
      phase: 1,
      frequency: 2,
      positionGroup: 'front_row',
    })
    const b = getWeeklyTemplate({
      cycle: 'pre_season',
      phase: 1,
      frequency: 2,
      positionGroup: 'front_row',
    })
    expect(a.sessions).not.toBe(b.sessions)
    expect(a.sessions[0]).not.toBe(b.sessions[0])
  })

  it('dayPreference Lower early / Upper mid / Full late / Primer pre_match', () => {
    const { sessions: slots } = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 3,
      positionGroup: 'front_row',
      matchContext: 'match_week',
    })
    expect(slots[0].dayPreference).toBe('early_week')
    expect(slots[1].dayPreference).toBe('mid_week')
    expect(slots[2].dayPreference).toBe('pre_match')
  })

  it('off-season Recovery 2x -> Recovery A + Recovery B + companion recommendations', () => {
    const r = getWeeklyTemplate({
      cycle: 'off_season',
      offSeasonPhase: 1,
      frequency: 2,
      positionGroup: 'front_row',
    })
    expect(r.sessions.map((s) => s.sessionId)).toEqual([
      'FULL_OFFSEASON_RECOVERY_A_V1',
      'FULL_OFFSEASON_RECOVERY_B_V1',
    ])
    expect(r.warnings).toHaveLength(0)
    expect(r.companionRecommendations?.length).toBeGreaterThan(0)
    expect(r.companionRecommendations?.join(' ')).toMatch(/récupération|activité légère/i)
    expect(r.requestedFrequency).toBe(2)
    expect(r.effectiveFrequency).toBe(2)
  })

  it('off-season Recovery 3x -> fallback 2x + warning explicite', () => {
    const r = getWeeklyTemplate({
      cycle: 'off_season',
      offSeasonPhase: 1,
      frequency: 3,
      positionGroup: 'back_three',
    })
    expect(r.sessions).toHaveLength(2)
    expect(r.effectiveFrequency).toBe(2)
    expect(r.warnings.some((w) => /Recovery|3x|2 séances/i.test(w))).toBe(true)
    expect(r.companionRecommendations?.length).toBeGreaterThan(0)
  })

  it('off-season Hypertrophy 3x -> Lower + Upper + Full', () => {
    const r = getWeeklyTemplate({
      cycle: 'off_season',
      offSeasonPhase: 3,
      frequency: 3,
      positionGroup: 'front_row',
    })
    expect(r.sessions.map((s) => s.sessionId)).toEqual([
      'LOWER_OFFSEASON_HYPERTROPHY_V1',
      'UPPER_OFFSEASON_HYPERTROPHY_V1',
      'FULL_OFFSEASON_HYPERTROPHY_V1',
    ])
    expect(r.effectiveFrequency).toBe(3)
    expect(r.companionRecommendations?.join(' ')).toMatch(/cardio|footing/i)
  })

  it('off-season Force-Bridge 3x → 3 sessions (Lower + Upper + Full)', () => {
    const r = getWeeklyTemplate({
      cycle: 'off_season',
      offSeasonPhase: 4,
      frequency: 3,
      positionGroup: 'front_row',
    })
    expect(r.sessions).toHaveLength(3)
    expect(r.sessions.map((s) => s.sessionId)).toEqual([
      'LOWER_OFFSEASON_FORCE_BRIDGE_V1',
      'UPPER_OFFSEASON_FORCE_BRIDGE_V1',
      'FULL_OFFSEASON_FORCE_BRIDGE_V1',
    ])
    expect(r.effectiveFrequency).toBe(3)
  })

  it('lève si offSeasonPhase manquante en off-season', () => {
    expect(() =>
      getWeeklyTemplate({
        cycle: 'off_season',
        frequency: 2,
        positionGroup: 'front_row',
      } as Parameters<typeof getWeeklyTemplate>[0])
    ).toThrow(/offSeasonPhase requise/)
  })

  it('off-season phase 5 maintenance → 2 sessions A/B', () => {
    const rA = getWeeklyTemplate({
      cycle: 'off_season',
      offSeasonPhase: 5,
      frequency: 3,
      positionGroup: 'front_row',
      maintenanceParity: 'A',
    })
    expect(rA.effectiveFrequency).toBe(2)
    expect(rA.sessions).toHaveLength(2)

    const rB = getWeeklyTemplate({
      cycle: 'off_season',
      offSeasonPhase: 5,
      frequency: 3,
      positionGroup: 'front_row',
      maintenanceParity: 'B',
    })
    expect(rB.effectiveFrequency).toBe(2)
    expect(rB.sessions).toHaveLength(2)
    // A and B should differ
    expect(rA.sessions.map((s) => s.sessionId)).not.toEqual(rB.sessions.map((s) => s.sessionId))
  })

  it('off-season phase 5 back_three uses position-specific sessions', () => {
    const r = getWeeklyTemplate({
      cycle: 'off_season',
      offSeasonPhase: 5,
      frequency: 2,
      positionGroup: 'back_three',
      maintenanceParity: 'A',
    })
    expect(r.sessions).toHaveLength(2)
    expect(r.sessions.every((s) => s.sessionId.includes('BACK_THREE'))).toBe(true)
  })
})

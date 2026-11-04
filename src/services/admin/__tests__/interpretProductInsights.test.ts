import { describe, expect, it } from 'vitest'
import {
  funnelRateCards,
  interpretProductInsights,
  type ProductInsightsPayload,
} from '../interpretProductInsights'

function base(overrides: Partial<ProductInsightsPayload['funnel']> = {}): ProductInsightsPayload {
  return {
    windowDays: 30,
    generatedAt: '2026-11-03T00:00:00Z',
    funnel: {
      profiles_total: 200,
      signups_window: 40,
      onboarded_total: 60,
      onboarded_window: 20,
      activated_total: 20,
      activated_window: 8,
      activated_within_7d: 10,
      onboarded_activated_within_7d: 10,
      activated_beyond_7d: 10,
      onboarded_never_trained: 40,
      one_and_done: 12,
      returned_at_least_once: 8,
      active_7d: 10,
      active_28d: 18,
      dormant_14d: 9,
      avg_hours_to_first_session: 96,
      ...overrides,
    },
    breakdowns: {
      equipmentOnboarded: { bw_leaning: 40, gym_leaning: 20 },
      equipmentActivated: { bw_leaning: 8, gym_leaning: 12 },
      trainingLevelOnboarded: { starter: 30, builder: 20, performance: 10 },
      trainingLevelActivated: { starter: 5, builder: 10, performance: 5 },
      weeklySessionsTarget: { '2': 25, '3': 35 },
      positionOnboarded: { PROP: 10 },
      sessionTypesWindow: { UPPER: 20, LOWER: 18 },
    },
    series: { signupsByDay: [], firstSessionsByDay: [] },
  }
}

describe('interpretProductInsights', () => {
  it('signale onboarding + activation + one-and-done', () => {
    const findings = interpretProductInsights(base())
    expect(findings.some((f) => f.id === 'onboarding-drop')).toBe(true)
    expect(findings.some((f) => f.id === 'activation-7d')).toBe(true)
    expect(findings.some((f) => f.id === 'activation-gap')).toBe(true)
    expect(findings.some((f) => f.id === 'one-and-done')).toBe(true)
    expect(findings[0].severity).toBe('critical')
  })

  it('reste ok si funnel sain', () => {
    const findings = interpretProductInsights(
      base({
        profiles_total: 50,
        onboarded_total: 45,
        activated_total: 40,
        activated_within_7d: 38,
        onboarded_activated_within_7d: 38,
        activated_beyond_7d: 2,
        onboarded_never_trained: 5,
        one_and_done: 2,
        returned_at_least_once: 38,
        dormant_14d: 1,
        avg_hours_to_first_session: 12,
      }),
    )
    expect(findings.some((f) => f.severity === 'critical')).toBe(false)
  })

  it('expose des cartes de taux', () => {
    const cards = funnelRateCards(base().funnel)
    expect(cards).toHaveLength(7)
    expect(cards[0].label).toBe('Comptes')
    expect(cards.some((c) => c.label === 'Activation ≤7 j')).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import {
  isBeforeProgramVisibleFrom,
  resolvePlannedSessionMissedStatus,
  resolveProgramVisibleFromISO,
} from '../programVisibility'

describe('resolveProgramVisibleFromISO', () => {
  it('préfère la fin d’onboarding à la création compte', () => {
    expect(
      resolveProgramVisibleFromISO({
        onboardingCompletedAtYmd: '2026-11-10T18:00:00.000Z',
        accountCreatedYmd: '2026-11-09',
      }),
    ).toBe('2026-11-10')
  })

  it('retombe sur la création compte', () => {
    expect(
      resolveProgramVisibleFromISO({
        onboardingCompletedAtYmd: null,
        accountCreatedYmd: '2026-11-10',
      }),
    ).toBe('2026-11-10')
  })
})

describe('resolvePlannedSessionMissedStatus', () => {
  it('ne marque pas manquée avant l’ancre programme', () => {
    expect(
      resolvePlannedSessionMissedStatus({
        dateISO: '2026-11-02',
        todayISO: '2026-11-10',
        programVisibleFromISO: '2026-11-10',
        hasGymLogOnDate: false,
      }),
    ).toBe('pending')
  })

  it('marque manquée seulement après l’ancre et avant today', () => {
    expect(
      resolvePlannedSessionMissedStatus({
        dateISO: '2026-11-11',
        todayISO: '2026-11-12',
        programVisibleFromISO: '2026-11-10',
        hasGymLogOnDate: false,
      }),
    ).toBe('missed')
  })

  it('completed gagne sur missed', () => {
    expect(
      resolvePlannedSessionMissedStatus({
        dateISO: '2026-11-10',
        todayISO: '2026-11-12',
        programVisibleFromISO: '2026-11-10',
        hasGymLogOnDate: true,
      }),
    ).toBe('completed')
  })
})

describe('isBeforeProgramVisibleFrom', () => {
  it('détecte les jours strictement antérieurs', () => {
    expect(isBeforeProgramVisibleFrom('2026-11-09', '2026-11-10')).toBe(true)
    expect(isBeforeProgramVisibleFrom('2026-11-10', '2026-11-10')).toBe(false)
  })
})

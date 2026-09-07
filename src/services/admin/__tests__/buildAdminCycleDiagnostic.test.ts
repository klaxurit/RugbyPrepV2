import { describe, expect, it } from 'vitest'
import { buildAdminCycleDiagnostic } from '../buildAdminCycleDiagnostic'

describe('buildAdminCycleDiagnostic', () => {
  it('Gabriel-like: calendrier J1 + reprise → pré-saison (pas d’override)', () => {
    const d = buildAdminCycleDiagnostic({
      todayIso: '2026-09-03',
      seasonMode: 'pre_season',
      weeklySessions: 3,
      onboardingComplete: false,
      trainingBaseline: 'active',
      planningAnchors: {
        offSeasonStartAt: '2026-07-20',
        onboardingCycleHint: 'off_season',
        returnToTeamTrainingAt: '2026-08-14',
        skipOffSeasonRecoveryIntro: true,
      },
      matches: [
        {
          date: '2026-09-27',
          opponent: 'AS MANTAISE',
          match_kind: 'league',
          source: 'ffr_import',
          user_hidden: false,
        },
      ],
    })

    expect(d.ok).toBe(true)
    expect(d.liveCycle).toBe('pre_season')
    expect(d.firstMatchDate).toBe('2026-09-27')
    expect(d.storedSeasonModeMismatch).toBe(false)
    expect(d.flags.some((f) => f.code === 'manual_cycle_override')).toBe(false)
  })

  it('Hugo avant patch A: override off_season → flag danger + cycle live ≠ calendrier seul', () => {
    const d = buildAdminCycleDiagnostic({
      todayIso: '2026-09-03',
      seasonMode: 'in_season',
      weeklySessions: 3,
      onboardingComplete: true,
      trainingBaseline: 'peak',
      planningAnchors: {
        offSeasonStartAt: '2026-05-18',
        manualCycleOverride: 'off_season',
        onboardingCycleHint: 'off_season',
        returnToTeamTrainingAt: '2026-08-10',
        skipOffSeasonRecoveryIntro: true,
      },
      matches: [
        {
          date: '2026-09-27',
          opponent: 'BOCAGE VIROIS',
          match_kind: 'league',
          source: 'ffr_import',
          user_hidden: false,
        },
      ],
    })

    expect(d.ok).toBe(true)
    expect(d.flags.some((f) => f.code === 'manual_cycle_override')).toBe(true)
    expect(d.resolutionMode).toBe('manual_override')
    expect(d.why).toContain('manualCycleOverride')
  })

  it('Hugo après patch A: sans override → pré-saison alignée J1', () => {
    const d = buildAdminCycleDiagnostic({
      todayIso: '2026-09-03',
      seasonMode: 'pre_season',
      weeklySessions: 3,
      onboardingComplete: true,
      trainingBaseline: 'peak',
      planningAnchors: {
        offSeasonStartAt: '2026-05-18',
        onboardingCycleHint: 'off_season',
        returnToTeamTrainingAt: '2026-08-10',
        skipOffSeasonRecoveryIntro: true,
      },
      matches: [
        {
          date: '2026-09-27',
          opponent: 'BOCAGE VIROIS',
          match_kind: 'league',
          source: 'ffr_import',
          user_hidden: false,
        },
      ],
    })

    expect(d.ok).toBe(true)
    expect(d.liveCycle).toBe('pre_season')
    expect(d.flags.some((f) => f.code === 'manual_cycle_override')).toBe(false)
    expect(d.storedSeasonModeMismatch).toBe(false)
  })

  it('Hugo + match leftover 17 mai : J1 = 27 sept, flag leftover, pas En saison S17', () => {
    const d = buildAdminCycleDiagnostic({
      todayIso: '2026-09-03',
      seasonMode: 'pre_season',
      weeklySessions: 3,
      onboardingComplete: true,
      trainingBaseline: 'peak',
      planningAnchors: {
        offSeasonStartAt: '2026-05-18',
        onboardingCycleHint: 'off_season',
        returnToTeamTrainingAt: '2026-08-10',
        skipOffSeasonRecoveryIntro: true,
      },
      matches: [
        {
          date: '2026-05-17',
          opponent: 'LOVALI XV',
          match_kind: null,
          source: 'manual',
          user_hidden: false,
        },
        {
          date: '2026-09-27',
          opponent: 'BOCAGE VIROIS',
          match_kind: 'league',
          source: 'ffr_import',
          user_hidden: false,
        },
      ],
    })

    expect(d.ok).toBe(true)
    expect(d.liveCycle).toBe('pre_season')
    expect(d.firstMatchDate).toBe('2026-09-27')
    expect(d.firstMatchOpponent).toBe('BOCAGE VIROIS')
    expect(d.weekLabel).not.toMatch(/En saison/)
    expect(d.flags.some((f) => f.code === 'leftover_pre_offseason_match')).toBe(true)
    expect(d.engineWarnings.some((w) => w.includes('2026-05-17'))).toBe(true)
  })
})

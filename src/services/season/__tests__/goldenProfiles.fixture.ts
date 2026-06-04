/**
 * Golden athlete profiles for planning regression (M0).
 * Any change to `cycle` (or optional fields below) must be intentional and documented in the commit.
 */
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'
import type { CalendarEvent, FatigueStatus, SessionLog, UserProfile } from '../../../types/training'
import type { AnnualCycle } from '../../../types/annualPlanning'

export const PROFILE_PRESERVED_TEST_IDS = [
  'ma-situation',
  'situation-cycle',
  'situation-next-match',
  'situation-confirmed',
  'situation-skip-recovery-card',
  'situation-skip-recovery-intro',
  'situation-undo-skip-recovery',
  'situation-return-set',
  'situation-clear-return',
  'situation-return-date',
  'situation-resume-season',
  'situation-season-started',
  'situation-season-ended',
  'situation-no-match',
  'profile-link-progress',
  'profile-baseline-reveal',
  'profile-section-baseline',
  'profile-baseline-OK',
  'profile-baseline-FATIGUE',
  'profile-baseline-INJURED',
] as const

export type GoldenPlanningExpectation = {
  cycle: AnnualCycle
  /** When set, `detectAnnualPlanningContext(...).planningTrace.resolutionMode` must match. */
  resolutionMode?: string
  /** When set, `planningAnchors.manualCycleOverride` after build must match. */
  manualCycleOverride?: AnnualCycle
  /** When set, `planningAnchors.onboardingCycleHint` after build must still be present. */
  preservedOnboardingHint?: AnnualCycle
}

export type GoldenPlanningProfile = {
  id: string
  description: string
  profile: UserProfile
  events: CalendarEvent[]
  logs: SessionLog[]
  today: string
  fatigue: FatigueStatus
  expected: GoldenPlanningExpectation
}

function profile(over: Partial<UserProfile>): UserProfile {
  return { ...DEFAULT_PROFILE, ...over }
}

function weeklyMatches(firstSaturday: string, count: number): CalendarEvent[] {
  const out: CalendarEvent[] = []
  const d = new Date(`${firstSaturday}T12:00:00`)
  for (let i = 0; i < count; i++) {
    out.push({ id: `golden-m-${i}`, date: d.toISOString().slice(0, 10), type: 'match' })
    d.setDate(d.getDate() + 7)
  }
  return out
}

/** Active FFR-style calendar: weekly matches, mid-season. */
const IN_SEASON_FFR_EVENTS = weeklyMatches('2025-09-06', 22)

/** Season ended late May 2026; no matches after. */
const ENDED_SEASON_EVENTS = weeklyMatches('2025-09-06', 38).filter((e) => e.date <= '2026-05-24')

export const GOLDEN_PLANNING_PROFILES: GoldenPlanningProfile[] = [
  {
    id: 'in_season_ffr_mid',
    description: 'Calendrier matchs hebdo actif, milieu de saison compétition',
    profile: profile({
      seasonMode: 'in_season',
      rugbyPosition: 'BACK_THREE',
      weeklySessions: 3,
      planningAnchors: {},
    }),
    events: IN_SEASON_FFR_EVENTS,
    logs: [],
    today: '2025-11-10',
    fatigue: 'OK',
    expected: { cycle: 'in_season' },
  },
  {
    id: 'off_season_onboarding_bootstrap',
    description: 'Premier run inter-saison : hint onboarding, pas de calendrier',
    profile: profile({
      seasonMode: 'off_season',
      planningAnchors: {
        onboardingCycleHint: 'off_season',
        offSeasonStartAt: '2025-03-10',
      },
    }),
    events: [],
    logs: [],
    today: '2025-03-10',
    fatigue: 'OK',
    expected: { cycle: 'off_season', resolutionMode: 'onboarding_hint' },
  },
  {
    id: 'off_season_hint_past_matches',
    description:
      'Hint off_season + match passé récent : cycle calendrier (in_season), hint conservé dans les ancres',
    profile: profile({
      seasonMode: 'off_season',
      planningAnchors: {
        onboardingCycleHint: 'off_season',
        offSeasonStartAt: '2025-03-10',
      },
    }),
    events: [{ id: 'past', date: '2025-02-22', type: 'match' }],
    logs: [],
    today: '2025-03-10',
    fatigue: 'OK',
    expected: {
      cycle: 'in_season',
      preservedOnboardingHint: 'off_season',
    },
  },
  {
    id: 'pre_season_return_date',
    description: 'Reprise équipe renseignée, avant premier match calendrier',
    profile: profile({
      seasonMode: 'pre_season',
      planningAnchors: { returnToTeamTrainingAt: '2026-09-01' },
    }),
    events: [{ id: 'fm', date: '2026-09-12', type: 'match' }],
    logs: [],
    today: '2026-08-15',
    fatigue: 'OK',
    expected: { cycle: 'pre_season' },
  },
  {
    id: 'off_season_manual_end',
    description: 'Fin de saison déclarée (seasonEndedAt), après dernier match',
    profile: profile({
      seasonMode: 'off_season',
      planningAnchors: { seasonEndedAt: '2026-05-30' },
    }),
    events: ENDED_SEASON_EVENTS,
    logs: [],
    today: '2026-06-15',
    fatigue: 'OK',
    expected: { cycle: 'off_season' },
  },
]

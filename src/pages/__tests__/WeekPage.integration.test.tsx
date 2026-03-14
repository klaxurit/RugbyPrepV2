// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { WeekPage } from '../WeekPage'
import { renderWithRouter } from '../../test/ui/renderWithRouter'

const buildWeekProgramMock = vi.fn()
const useProfileMock = vi.fn()

const ELIGIBLE_PROFILE = {
  weeklySessions: 3,
  seasonMode: 'in_season' as const,
  scSchedule: undefined,
  rehabInjury: undefined,
  ageBand: 'adult' as const,   // requis pour passer le guard beta self-serve
  injuries: [] as string[],
  equipment: [] as string[],
}

vi.mock('../../services/analytics/posthog', () => ({
  posthog: { capture: vi.fn() },
}))

vi.mock('../../hooks/useProfile', () => ({
  useProfile: (...args: unknown[]) => useProfileMock(...args),
}))

vi.mock('../../hooks/useWeek', () => ({
  useWeek: () => ({
    week: 'W1',
    setWeek: vi.fn(),
    lastNonDeloadWeek: 'W1',
  }),
}))

vi.mock('../../hooks/useFatigue', () => ({
  useFatigue: () => ({
    fatigue: 'OK',
    setFatigue: vi.fn(),
  }),
}))

vi.mock('../../hooks/useBlockLogs', () => ({
  useBlockLogs: () => ({ logs: [] }),
}))

vi.mock('../../hooks/useHistory', () => ({
  useHistory: () => ({ logs: [] }),
}))

vi.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => ({ events: [] }),
}))

vi.mock('../../hooks/useACWR', () => ({
  useACWR: () => ({
    acwr: null,
    zone: null,
    hasSufficientData: false,
  }),
}))

vi.mock('../../hooks/useAcwrOverride', () => ({
  useAcwrOverride: () => ({
    ignoreAcwrOverload: false,
    setOverride: vi.fn(),
  }),
}))

vi.mock('../../hooks/useAcwrBlockCollapsed', () => ({
  useAcwrBlockCollapsed: () => ({
    collapsed: false,
    toggle: vi.fn(),
  }),
}))

vi.mock('../../hooks/useProgramFeatureFlags', () => ({
  useProgramFeatureFlags: () => ({
    featureFlags: {
      populationProfileV1: true,
      safetyContractsV1: true,
      u18HardCapsV1: true,
      microcycleArchetypesV2: true,
      sessionIdentityV2: true,
      qualityGatesV2: true,
      qualityScorecardV2: true,
      enforceMatchProximityGateV2: true,
    },
    rollout: {
      enabled: true,
      source: 'forced',
      canaryPercent: 10,
      bucket: 0,
    },
  }),
}))

vi.mock('../../services/program', () => ({
  buildWeekProgram: (...args: unknown[]) => buildWeekProgramMock(...args),
  validateSession: () => ({ isValid: true, warnings: [] }),
}))

vi.mock('../../services/ui/recommendations', () => ({
  shouldRecommendDeload: () => ({
    recommend: false,
    reason: '',
  }),
}))

vi.mock('../../services/ui/progression', () => ({
  getSessionRecap: () => ({
    loggedExercises: 0,
    totalExercises: 3,
    loadProxy: 'n/a',
  }),
}))

vi.mock('../../services/ui/safetyMessaging', () => ({
  getProgramSafetyMessages: () => [],
}))

describe('WeekPage integration', () => {
  beforeEach(() => {
    buildWeekProgramMock.mockClear()
    useProfileMock.mockReturnValue({ profile: ELIGIBLE_PROFILE })
  })

  it('renders microcycle scorecard and passes canary flags to buildWeekProgram', () => {
    buildWeekProgramMock.mockReturnValue({
      week: 'W1',
      warnings: [],
      hardConstraintEvents: [],
      qualityGateEvents: [],
      selectedArchetypeId: 'IN_SEASON_3X_STD',
      qualityScorecard: {
        safety: 100,
        microcycle: 90,
        matchProximity: 100,
        structure: 95,
        identity: 90,
        population: 90,
        overall: 93,
      },
      sessions: [
        {
          recipeId: 'LOWER_V1',
          title: 'Lower Force',
          week: 'W1',
          blocks: [
            {
              block: {
                blockId: 'BLK_LOW_01',
                name: 'Lower block',
                intent: 'force',
                tags: [],
                equipment: ['none'],
                contraindications: [],
                exercises: [],
                versions: [],
                coachingNotes: '',
              },
              version: {
                versionId: 'W1',
                sets: 4,
                scheme: { kind: 'reps', reps: '5' },
                restSeconds: 120,
              },
            },
          ],
          warnings: [],
          identity: {
            archetypeId: 'IN_SEASON_3X_STD',
            sessionRole: 'lower_strength',
            sessionIntensity: 'heavy',
            matchDayOffset: 'MD-4',
            objectiveLabel: 'Lower heavy',
            whyTodayLabel: 'Loin du match, priorité force bas du corps.',
          },
        },
      ],
    })

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByText(/Archetype: IN_SEASON_3X_STD/i)).toBeInTheDocument()
    expect(screen.getByText(/Score qualité: 93\/100/i)).toBeInTheDocument()
    expect(buildWeekProgramMock).toHaveBeenCalledTimes(1)
    expect(buildWeekProgramMock.mock.calls[0]?.[2]).toMatchObject({
      featureFlags: {
        microcycleArchetypesV2: true,
        qualityGatesV2: true,
        qualityScorecardV2: true,
      },
    })
  })

  it('shows beta eligibility guard and does NOT call buildWeekProgram for ineligible profile', () => {
    useProfileMock.mockReturnValueOnce({
      profile: {
        ...ELIGIBLE_PROFILE,
        seasonMode: 'off_season', // déclenche OFF_SEASON_NOT_SUPPORTED
      },
    })

    renderWithRouter(<WeekPage />, { initialEntries: ['/week'] })

    expect(screen.getByText(/Profil non encore supporté en bêta self-serve/i)).toBeInTheDocument()
    expect(screen.getByText(/Mode saison non supporté ou non renseigné/i)).toBeInTheDocument()
    expect(buildWeekProgramMock).not.toHaveBeenCalled()
  })
})

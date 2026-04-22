// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen, fireEvent, render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { OnboardingPage } from '../OnboardingPage'
import type { UserProfile } from '../../types/training'

const updateProfileMock = vi.fn()
const navigateMock = vi.fn()
const markOnboardingCompleteMock = vi.fn()

vi.mock('../../services/analytics/posthog', () => ({
  posthog: { capture: vi.fn() },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    authState: { status: 'authenticated', user: { id: 'u1' } },
    isInitializing: false,
  }),
}))

let mockProfile: UserProfile | null = null

vi.mock('../../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: mockProfile,
    updateProfile: updateProfileMock,
  }),
  markOnboardingComplete: (...args: unknown[]) => markOnboardingCompleteMock(...args),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../services/program/scheduleOptimizer', () => ({
  computeSCSchedule: () => ({ sessions: [] }),
  buildManualSCSchedule: () => ({ sessions: [] }),
}))

function renderOnboarding(state?: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/onboarding', state }]}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>
    </MemoryRouter>
  )
}

/** Click through all steps to reach the summary. */
function navigateToSummary() {
  // Step 0: Position → Première ligne
  fireEvent.click(screen.getByText('Première ligne'))
  fireEvent.click(screen.getAllByText('Suivant')[0])

  // Step 1: Profil → Avancée + 2 séances
  fireEvent.click(screen.getByText('Avancée'))
  fireEvent.click(screen.getByText('2 séances'))
  fireEvent.click(screen.getAllByText('Suivant')[0])

  // Step 2: Situation → En saison + Actif
  fireEvent.click(screen.getByTestId('onboarding-season-in_season'))
  fireEvent.click(screen.getByTestId('onboarding-baseline-active'))
  fireEvent.click(screen.getAllByText('Suivant')[0])

  // Step 3: Planning club → skip
  fireEvent.click(screen.getByText(/Pas d'entraînement club/))

  // Step 4: Morphologie → skip
  fireEvent.click(screen.getByText('Passer cette étape'))
}

describe('OnboardingPage · first run flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfile = null
  })

  afterEach(() => {
    cleanup()
  })

  it('fin d\'onboarding standard → navigate(/home)', () => {
    renderOnboarding()
    navigateToSummary()

    const finishBtn = screen.getByTestId('onboarding-finish-btn')
    expect(finishBtn).toHaveTextContent('Voir mon programme')
    expect(finishBtn).not.toBeDisabled()
    fireEvent.click(finishBtn)

    expect(navigateMock).toHaveBeenCalledWith('/home', { replace: true })
    expect(markOnboardingCompleteMock).toHaveBeenCalledWith('u1')
  })

  it('fin d\'onboarding avec intention transmise → destination conservée', () => {
    renderOnboarding({ intendedPath: '/progress' })
    navigateToSummary()

    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    expect(navigateMock).toHaveBeenCalledWith('/progress', { replace: true })
  })

  it('ne montre pas performanceFocus dans le tunnel', () => {
    renderOnboarding()

    // Step 0: Position
    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 1: select Avancée
    fireEvent.click(screen.getByText('Avancée'))

    // performanceFocus should NOT appear
    expect(screen.queryByText('Orientation performance')).toBeNull()
  })

  it('résumé n\'affiche pas performanceFocus, Population, Période ni Équipement', () => {
    renderOnboarding()
    navigateToSummary()

    expect(screen.queryByText('Orientation')).toBeNull()
    expect(screen.queryByText('Population')).toBeNull()
    expect(screen.queryByText('Période')).toBeNull()
    expect(screen.queryByText('Équipement')).toBeNull()
  })

  it('question genre visible et dérive le bon populationSegment', () => {
    renderOnboarding()

    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    fireEvent.click(screen.getByText('Avancée'))
    fireEvent.click(screen.getByText('2 séances'))

    fireEvent.click(screen.getByText('Joueuse'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 2: Situation → Inter-saison + Actif
    fireEvent.click(screen.getByTestId('onboarding-season-off_season'))
    fireEvent.click(screen.getByTestId('onboarding-baseline-active'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 3: Planning → skip
    fireEvent.click(screen.getByText(/Pas d'entraînement club/))
    // Step 4: Morphologie → skip
    fireEvent.click(screen.getByText('Passer cette étape'))

    // Finish
    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({ populationSegment: 'female_senior' }),
      expect.anything()
    )
  })

  it('CTA final toujours accessible (pas de guard eligibility)', () => {
    renderOnboarding()
    navigateToSummary()

    const finishBtn = screen.getByTestId('onboarding-finish-btn')
    expect(finishBtn).toHaveTextContent('Voir mon programme')
    expect(finishBtn).not.toBeDisabled()
  })

  it('onboarding submit saisit seasonMode + trainingBaseline + onboardingCycleHint', () => {
    renderOnboarding()
    navigateToSummary()

    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    const call = updateProfileMock.mock.calls[0][0]
    expect(call.seasonMode).toBe('in_season')
    expect(call.trainingBaseline).toBe('active')
    expect(call.planningAnchors?.onboardingCycleHint).toBe('in_season')
  })

  it('playoffs onboarding choice → seasonMode=in_season + manualPlayoffs=true', () => {
    renderOnboarding()

    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])
    fireEvent.click(screen.getByText('Avancée'))
    fireEvent.click(screen.getByText('2 séances'))
    fireEvent.click(screen.getAllByText('Suivant')[0])
    fireEvent.click(screen.getByTestId('onboarding-season-playoffs'))
    fireEvent.click(screen.getByTestId('onboarding-baseline-peak'))
    fireEvent.click(screen.getAllByText('Suivant')[0])
    fireEvent.click(screen.getByText(/Pas d'entraînement club/))
    fireEvent.click(screen.getByText('Passer cette étape'))
    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    const call = updateProfileMock.mock.calls[0][0]
    expect(call.seasonMode).toBe('in_season')
    expect(call.trainingBaseline).toBe('peak')
    expect(call.planningAnchors.onboardingCycleHint).toBe('playoffs')
    expect(call.planningAnchors.manualPlayoffs).toBe(true)
  })

  it('onboarding submit force l\'équipement sur GYM_PRESET complet', () => {
    renderOnboarding()
    navigateToSummary()

    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    const call = updateProfileMock.mock.calls[0][0]
    expect(call.equipment).toEqual(expect.arrayContaining(['barbell', 'dumbbell', 'bench', 'pullup_bar', 'band', 'box']))
  })

  it('onboarding submit preserves existing planningAnchors', () => {
    mockProfile = {
      equipment: [],
      injuries: [],
      weeklySessions: 2,
      level: 'intermediate',
      planningAnchors: { seasonEndedAt: '2026-03-01', returnToTeamTrainingAt: '2026-08-01' },
    }

    renderOnboarding()
    navigateToSummary()

    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    const call = updateProfileMock.mock.calls[0][0]
    expect(call.planningAnchors.seasonEndedAt).toBe('2026-03-01')
    expect(call.planningAnchors.returnToTeamTrainingAt).toBe('2026-08-01')
  })

  it('first-run with null profile does not crash on submit', () => {
    mockProfile = null

    renderOnboarding()
    navigateToSummary()

    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    expect(updateProfileMock).toHaveBeenCalled()
  })
})

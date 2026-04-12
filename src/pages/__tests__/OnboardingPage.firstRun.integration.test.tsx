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

// betaEligibility mock removed — no longer imported by OnboardingPage (all profiles eligible)

function renderOnboarding(state?: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/onboarding', state }]}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>
    </MemoryRouter>
  )
}

/** Click through welcome + all steps to reach summary. */
function navigateToSummary(options?: { seasonMode?: string }) {
  // Welcome screen → "Créer mon programme"
  fireEvent.click(screen.getByText('Créer mon programme'))

  // Step 0: Position → select Front Row then Next
  fireEvent.click(screen.getByText('Première ligne'))
  fireEvent.click(screen.getAllByText('Suivant')[0])

  // Step 1: Profil → select Advanced path + 2 séances
  fireEvent.click(screen.getByText('Confirmé'))
  fireEvent.click(screen.getByText('2 séances'))
  if (options?.seasonMode === 'off_season') {
    fireEvent.click(screen.getByText('Inter-saison'))
  }
  fireEvent.click(screen.getAllByText('Suivant')[0])

  // Step 2: Equipment → click "Oui" (gym access) then Next
  fireEvent.click(screen.getByText('Oui'))
  fireEvent.click(screen.getAllByText('Suivant')[0])

  // Step 3: Planning club → skip
  fireEvent.click(screen.getByText(/Pas d'entraînement club/))

  // Step 4: Morphology → skip
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

  it('off_season → onboarding termine normalement (moteur annuel gère tous les cycles)', () => {
    renderOnboarding()
    navigateToSummary({ seasonMode: 'off_season' })

    // Plus de bannière "non-eligible" — tous les profils passent
    expect(screen.queryByTestId('onboarding-non-eligible-info')).toBeNull()

    const finishBtn = screen.getByTestId('onboarding-finish-btn')
    expect(finishBtn).not.toBeDisabled()
    fireEvent.click(finishBtn)

    expect(navigateMock).toHaveBeenCalledWith('/home', { replace: true })
    expect(markOnboardingCompleteMock).toHaveBeenCalledWith('u1')
  })

  it('ne montre pas performanceFocus dans le tunnel', () => {
    renderOnboarding()
    fireEvent.click(screen.getByText('Créer mon programme'))

    // Step 0: Position
    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 1: select Avancé (performance)
    fireEvent.click(screen.getByText('Confirmé'))

    // performanceFocus should NOT appear
    expect(screen.queryByText('Orientation performance')).toBeNull()
  })

  it('question binaire matériel : oui → preset salle affiché', () => {
    renderOnboarding()
    fireEvent.click(screen.getByText('Créer mon programme'))

    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    fireEvent.click(screen.getByText('Confirmé'))
    fireEvent.click(screen.getByText('2 séances'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 2: Equipment → click "Oui"
    fireEvent.click(screen.getByText('Oui'))
    expect(screen.getByText('Tout l\'équipement salle activé')).toBeInTheDocument()
  })

  it('question binaire matériel : non → checklist maison', () => {
    renderOnboarding()
    fireEvent.click(screen.getByText('Créer mon programme'))

    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    fireEvent.click(screen.getByText('Confirmé'))
    fireEvent.click(screen.getByText('2 séances'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 2: Equipment → click "Non"
    fireEvent.click(screen.getByText('Non'))
    expect(screen.getByText('Matériel disponible')).toBeInTheDocument()
    // 8 home items should be visible
    expect(screen.getByText('Haltères')).toBeInTheDocument()
    expect(screen.getByText('Piste / Gazon')).toBeInTheDocument()
  })

  it('résumé n\'affiche pas performanceFocus ni Population', () => {
    renderOnboarding()
    navigateToSummary()

    expect(screen.queryByText('Orientation')).toBeNull()
    expect(screen.queryByText('Population')).toBeNull()
  })

  it('question genre visible et dérive le bon populationSegment', () => {
    renderOnboarding()
    fireEvent.click(screen.getByText('Créer mon programme'))

    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    fireEvent.click(screen.getByText('Confirmé'))
    fireEvent.click(screen.getByText('2 séances'))

    // Select "Joueuse"
    fireEvent.click(screen.getByText('Joueuse'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Navigate through remaining steps
    fireEvent.click(screen.getByText('Oui'))
    fireEvent.click(screen.getAllByText('Suivant')[0])
    fireEvent.click(screen.getByText(/Pas d'entraînement club/))
    fireEvent.click(screen.getByText('Passer cette étape'))

    // Finish
    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    expect(updateProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({ populationSegment: 'female_senior' }),
      expect.anything()
    )
  })

  it('step 2 bloqué tant que hasGymAccess === null', () => {
    renderOnboarding()
    fireEvent.click(screen.getByText('Créer mon programme'))

    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    fireEvent.click(screen.getByText('Confirmé'))
    fireEvent.click(screen.getByText('2 séances'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 2: Equipment — Suivant should be disabled before answering Oui/Non
    const suivantBtns = screen.getAllByText('Suivant')
    const suivantBtn = suivantBtns[suivantBtns.length - 1] // Last "Suivant" button visible
    expect(suivantBtn).toBeDisabled()

    // After clicking "Oui", Suivant should be enabled
    fireEvent.click(screen.getByText('Oui'))
    expect(suivantBtn).not.toBeDisabled()
  })

  it('CTA final toujours accessible (pas de guard eligibility)', () => {
    renderOnboarding()
    navigateToSummary()

    const finishBtn = screen.getByTestId('onboarding-finish-btn')
    expect(finishBtn).toHaveTextContent('Voir mon programme')
    expect(finishBtn).not.toBeDisabled()
  })

  // ── S3 Slice 4: onboarding cycle hint ──

  it('cycle hint step shows factual wording', () => {
    renderOnboarding()
    fireEvent.click(screen.getByText('Créer mon programme'))
    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 1: should show cycle hint question
    expect(screen.getByText('Ta saison en ce moment')).toBeInTheDocument()
    expect(screen.getByText('En saison')).toBeInTheDocument()
    expect(screen.getByText('Inter-saison')).toBeInTheDocument()
    // Must NOT show mode selector wording
    expect(screen.queryByText(/mode calendrier/i)).toBeNull()
    expect(screen.queryByText(/mode bloc/i)).toBeNull()
  })

  it('selecting "En saison" writes onboardingCycleHint: in_season + seasonMode compat', () => {
    renderOnboarding()
    navigateToSummary() // defaults to in_season

    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    const call = updateProfileMock.mock.calls[0][0]
    expect(call.planningAnchors?.onboardingCycleHint).toBe('in_season')
    expect(call.seasonMode).toBe('in_season')
  })

  it('selecting "Inter-saison" writes onboardingCycleHint: off_season + seasonMode compat', () => {
    renderOnboarding()
    navigateToSummary({ seasonMode: 'off_season' })

    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    const call = updateProfileMock.mock.calls[0][0]
    expect(call.planningAnchors?.onboardingCycleHint).toBe('off_season')
    expect(call.seasonMode).toBe('off_season')
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
    expect(call.planningAnchors.onboardingCycleHint).toBe('in_season')
    // Existing anchors preserved
    expect(call.planningAnchors.seasonEndedAt).toBe('2026-03-01')
    expect(call.planningAnchors.returnToTeamTrainingAt).toBe('2026-08-01')
  })

  it('first-run with null profile does not crash on submit', () => {
    mockProfile = null

    renderOnboarding()
    navigateToSummary()

    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    const call = updateProfileMock.mock.calls[0][0]
    expect(call.planningAnchors.onboardingCycleHint).toBe('in_season')
  })
})

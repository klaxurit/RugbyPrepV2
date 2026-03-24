// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen, fireEvent, render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { OnboardingPage } from '../OnboardingPage'

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

vi.mock('../../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: null,
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

vi.mock('../../services/betaEligibility', () => ({
  checkBetaEligibility: (profile: Record<string, unknown>) => {
    if (profile.seasonMode === 'off_season') {
      return { isEligible: false, primaryReason: 'OFF_SEASON_NOT_SUPPORTED', reasons: ['OFF_SEASON_NOT_SUPPORTED'] }
    }
    return { isEligible: true, primaryReason: null, reasons: [] }
  },
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

/** Click through welcome + all steps to reach summary (step 6). */
function navigateToSummary(options?: { seasonMode?: string }) {
  // Welcome screen → "Créer mon programme"
  fireEvent.click(screen.getByText('Créer mon programme'))

  // Step 0: Position → select Front Row then Next
  fireEvent.click(screen.getByText('Première ligne'))
  fireEvent.click(screen.getAllByText('Suivant')[0])

  // Step 1: Profil → select Builder (label: "Intermédiaire") + 2 séances
  fireEvent.click(screen.getByText('Intermédiaire'))
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

  // Step 4: Injuries → skip
  fireEvent.click(screen.getByText(/Aucun inconfort/))

  // Step 5: Morphology → skip
  fireEvent.click(screen.getByText('Passer cette étape'))

  // Now on step 6 (summary)
}

describe('OnboardingPage · first run flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('fin d\'onboarding standard → navigate(/program)', () => {
    renderOnboarding()
    navigateToSummary()

    const finishBtn = screen.getByTestId('onboarding-finish-btn')
    expect(finishBtn).toHaveTextContent('Voir mon programme')
    expect(finishBtn).not.toBeDisabled()
    fireEvent.click(finishBtn)

    expect(navigateMock).toHaveBeenCalledWith('/program', { replace: true })
    expect(markOnboardingCompleteMock).toHaveBeenCalledWith('u1')
  })

  it('fin d\'onboarding avec intention transmise → destination conservée', () => {
    renderOnboarding({ intendedPath: '/progress' })
    navigateToSummary()

    fireEvent.click(screen.getByTestId('onboarding-finish-btn'))

    expect(navigateMock).toHaveBeenCalledWith('/progress', { replace: true })
  })

  it('profil non legacy-eligible → onboarding termine, pas de /week', () => {
    renderOnboarding()
    navigateToSummary({ seasonMode: 'off_season' })

    expect(screen.getByTestId('onboarding-non-eligible-info')).toBeInTheDocument()
    expect(screen.getByText(/Programme adapté à ta période/)).toBeInTheDocument()

    const finishBtn = screen.getByTestId('onboarding-finish-btn')
    expect(finishBtn).not.toBeDisabled()
    fireEvent.click(finishBtn)

    expect(navigateMock).not.toHaveBeenCalledWith('/week', expect.anything())
    expect(navigateMock).toHaveBeenCalledWith('/program', { replace: true })
    expect(markOnboardingCompleteMock).toHaveBeenCalledWith('u1')
  })

  it('ne montre pas performanceFocus dans le tunnel', () => {
    renderOnboarding()
    fireEvent.click(screen.getByText('Créer mon programme'))

    // Step 0: Position
    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 1: select Avancé (performance)
    fireEvent.click(screen.getByText('Avancé'))

    // performanceFocus should NOT appear
    expect(screen.queryByText('Orientation performance')).toBeNull()
  })

  it('question binaire matériel : oui → preset salle affiché', () => {
    renderOnboarding()
    fireEvent.click(screen.getByText('Créer mon programme'))

    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    fireEvent.click(screen.getByText('Intermédiaire'))
    fireEvent.click(screen.getByText('2 séances'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Step 2: Equipment → click "Oui"
    fireEvent.click(screen.getByText('Oui'))
    expect(screen.getByText('Salle standard sélectionnée')).toBeInTheDocument()
  })

  it('question binaire matériel : non → checklist maison', () => {
    renderOnboarding()
    fireEvent.click(screen.getByText('Créer mon programme'))

    fireEvent.click(screen.getByText('Première ligne'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    fireEvent.click(screen.getByText('Intermédiaire'))
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

    fireEvent.click(screen.getByText('Intermédiaire'))
    fireEvent.click(screen.getByText('2 séances'))

    // Select "Joueuse"
    fireEvent.click(screen.getByText('Joueuse'))
    fireEvent.click(screen.getAllByText('Suivant')[0])

    // Navigate through remaining steps
    fireEvent.click(screen.getByText('Oui'))
    fireEvent.click(screen.getAllByText('Suivant')[0])
    fireEvent.click(screen.getByText(/Pas d'entraînement club/))
    fireEvent.click(screen.getByText(/Aucun inconfort/))
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

    fireEvent.click(screen.getByText('Intermédiaire'))
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

  it('BETA_CAP ne bloque plus le CTA final', () => {
    renderOnboarding()
    navigateToSummary()

    const finishBtn = screen.getByTestId('onboarding-finish-btn')
    expect(finishBtn).toHaveTextContent('Voir mon programme')
    expect(finishBtn).not.toBeDisabled()
    expect(screen.queryByText(/Places bêta complètes/)).toBeNull()
  })
})

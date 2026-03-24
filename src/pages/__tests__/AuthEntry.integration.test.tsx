// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, screen, render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { RequireAuth } from '../../components/auth/RequireAuth'
import { LoginPage } from '../auth/LoginPage'
import { CallbackPage } from '../auth/CallbackPage'

const useAuthMock = vi.fn()
const useOnboardingStatusMock = vi.fn()

vi.mock('../../services/analytics/posthog', () => ({
  posthog: { capture: vi.fn() },
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../hooks/useProfile', () => ({
  useOnboardingStatus: () => useOnboardingStatusMock(),
  useProfile: () => ({ profile: null }),
  markOnboardingComplete: vi.fn(),
}))

function TestApp({ initialEntries }: { initialEntries: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/program" element={<div data-testid="program-page">Program</div>} />
          <Route path="/progress" element={<div data-testid="progress-page">Progress</div>} />
          <Route path="/onboarding" element={<div data-testid="onboarding-page">Onboarding</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Auth entry flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('utilisateur anonyme ouvrant /program → redirection login', () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'anonymous' },
      isInitializing: false,
      signIn: vi.fn(),
    })
    useOnboardingStatusMock.mockReturnValue('loading')

    render(<TestApp initialEntries={['/program']} />)

    // Should be on login page
    expect(screen.getByText('Se connecter')).toBeInTheDocument()
  })

  it('login réussi + onboarding complet + pas d\'intention → /program', () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'authenticated', user: { id: 'u1' } },
      isInitializing: false,
      signIn: vi.fn(),
    })
    useOnboardingStatusMock.mockReturnValue('complete')

    // LoginPage with no state → redirects to /program
    render(<TestApp initialEntries={['/auth/login']} />)

    expect(screen.getByTestId('program-page')).toBeInTheDocument()
  })

  it('login réussi + onboarding complet + intention /progress → /progress', () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'authenticated', user: { id: 'u1' } },
      isInitializing: false,
      signIn: vi.fn(),
    })
    useOnboardingStatusMock.mockReturnValue('complete')

    render(
      <MemoryRouter initialEntries={[{
        pathname: '/auth/login',
        state: { from: { pathname: '/progress' } },
      }]}>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/progress" element={<div data-testid="progress-page">Progress</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('progress-page')).toBeInTheDocument()
  })

  it('callback auth + onboarding incomplet → /onboarding', () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'authenticated', user: { id: 'u1' } },
      isInitializing: false,
    })
    useOnboardingStatusMock.mockReturnValue('incomplete')

    render(<TestApp initialEntries={['/auth/callback']} />)

    expect(screen.getByTestId('onboarding-page')).toBeInTheDocument()
  })

  it('callback auth + onboarding complet → /program', () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'authenticated', user: { id: 'u1' } },
      isInitializing: false,
    })
    useOnboardingStatusMock.mockReturnValue('complete')

    render(<TestApp initialEntries={['/auth/callback']} />)

    expect(screen.getByTestId('program-page')).toBeInTheDocument()
  })
})

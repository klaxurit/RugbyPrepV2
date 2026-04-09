// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../auth/LoginPage'
import { ForgotPasswordPage } from '../auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../auth/ResetPasswordPage'

const useAuthMock = vi.fn()
const resetPasswordForEmailMock = vi.fn()
const updateUserMock = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../services/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmailMock(...args),
      updateUser: (...args: unknown[]) => updateUserMock(...args),
    },
  },
}))

describe('Reset password flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateUserMock.mockResolvedValue({ error: null })
    resetPasswordForEmailMock.mockResolvedValue({ error: null })
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('login page links to the dedicated forgot-password screen and preserves the email', async () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'anonymous', user: null },
      isInitializing: false,
      signIn: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'juncahugo@gmail.com' },
    })
    fireEvent.click(screen.getByText('Mot de passe oublié ?'))

    expect(screen.getByText('Mot de passe oublié')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('juncahugo@gmail.com')
  })

  it('forgot password sends the recovery email to the dedicated route', async () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'anonymous', user: null },
      isInitializing: false,
    })

    render(
      <MemoryRouter initialEntries={['/auth/forgot-password']}>
        <Routes>
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'juncahugo@gmail.com' },
    })
    fireEvent.click(screen.getByText('Envoyer le lien de réinitialisation'))

    await waitFor(() => {
      expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
        'juncahugo@gmail.com',
        expect.objectContaining({
          redirectTo: expect.stringMatching(/\/auth\/reset-password$/),
        }),
      )
    })
  })

  it('shows an expired-link state when there is no authenticated recovery session', () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'anonymous', user: null },
      isInitializing: false,
    })

    render(
      <MemoryRouter initialEntries={['/auth/reset-password']}>
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Ce lien de réinitialisation est invalide ou expiré.')).toBeInTheDocument()
  })

  it('updates the password when the recovery session is authenticated', async () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'authenticated', user: { id: 'u1', email: 'test@example.com' } },
      isInitializing: false,
    })

    render(
      <MemoryRouter initialEntries={['/auth/reset-password']}>
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/program" element={<div data-testid="program-page">Program</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'nouveau-mot-de-passe' },
    })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), {
      target: { value: 'nouveau-mot-de-passe' },
    })
    fireEvent.click(screen.getByText('Mettre à jour mon mot de passe'))

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith({ password: 'nouveau-mot-de-passe' })
    })

    expect(screen.getByText("Mot de passe mis à jour. Tu peux continuer dans l'application.")).toBeInTheDocument()
  })

  it('blocks submission when passwords do not match', async () => {
    useAuthMock.mockReturnValue({
      authState: { status: 'authenticated', user: { id: 'u1', email: 'test@example.com' } },
      isInitializing: false,
    })

    render(
      <MemoryRouter initialEntries={['/auth/reset-password']}>
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'abcdef' },
    })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), {
      target: { value: 'abcdeg' },
    })
    fireEvent.click(screen.getByText('Mettre à jour mon mot de passe'))

    expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument()
    expect(updateUserMock).not.toHaveBeenCalled()
  })
})

// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EmailConfirmBanner } from '../EmailConfirmBanner'

const dismiss = vi.fn()
const resendMock = vi.fn()
const authState = {
  status: 'authenticated' as const,
  user: {
    id: 'u1',
    email: 'a@club.fr',
    displayName: 'A',
    createdAt: 1,
    emailConfirmed: false as boolean | undefined,
  },
}

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ authState }),
}))

vi.mock('../../../hooks/useProfile', () => ({
  useProfile: () => ({ profile: { preferredLanguage: 'fr' } }),
}))

vi.mock('../../../hooks/useHintVisibility', () => ({
  useHintVisibility: () => ({ visible: true, dismiss, loading: false }),
}))

vi.mock('../../../services/auth/emailConfirmation', async () => {
  const actual = await vi.importActual<typeof import('../../../services/auth/emailConfirmation')>(
    '../../../services/auth/emailConfirmation',
  )
  return {
    ...actual,
    resendSignupConfirmation: (...args: unknown[]) => resendMock(...args),
  }
})

describe('EmailConfirmBanner', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    authState.user.emailConfirmed = false
    authState.status = 'authenticated'
  })

  it('affiche le bandeau si l’email n’est pas confirmé', () => {
    render(<EmailConfirmBanner />)
    expect(screen.getByTestId('email-confirm-banner')).toBeInTheDocument()
    expect(screen.getByText('Confirme ton email')).toBeInTheDocument()
  })

  it('ne s’affiche pas si l’email est déjà confirmé', () => {
    authState.user.emailConfirmed = true
    render(<EmailConfirmBanner />)
    expect(screen.queryByTestId('email-confirm-banner')).toBeNull()
  })

  it('renvoie le mail au clic', async () => {
    resendMock.mockResolvedValue({ ok: true })
    render(<EmailConfirmBanner />)
    fireEvent.click(screen.getByRole('button', { name: 'Renvoyer le mail' }))
    await waitFor(() => {
      expect(resendMock).toHaveBeenCalledWith('a@club.fr')
    })
    expect(screen.getByText('Mail envoyé. Vérifie ta boîte.')).toBeInTheDocument()
  })
})

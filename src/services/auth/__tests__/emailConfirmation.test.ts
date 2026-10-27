import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resendSignupConfirmation, shouldPromptEmailConfirmation } from '../emailConfirmation'

const resendMock = vi.fn()

vi.mock('../../supabase/client', () => ({
  supabase: {
    auth: {
      resend: (...args: unknown[]) => resendMock(...args),
    },
  },
}))

describe('shouldPromptEmailConfirmation', () => {
  it('n’affiche rien si l’email est déjà confirmé ou inconnu', () => {
    expect(shouldPromptEmailConfirmation({ emailConfirmed: true, email: 'a@club.fr' })).toBe(false)
    expect(shouldPromptEmailConfirmation({ emailConfirmed: undefined, email: 'a@club.fr' })).toBe(false)
    expect(shouldPromptEmailConfirmation({ emailConfirmed: false, email: '' })).toBe(false)
  })

  it('affiche le bandeau si un vrai email n’est pas confirmé', () => {
    expect(shouldPromptEmailConfirmation({ emailConfirmed: false, email: 'a@club.fr' })).toBe(true)
  })
})

describe('resendSignupConfirmation', () => {
  beforeEach(() => {
    resendMock.mockReset()
  })

  it('renvoie ok si Supabase accepte', async () => {
    resendMock.mockResolvedValue({ error: null })
    await expect(resendSignupConfirmation('a@club.fr')).resolves.toEqual({ ok: true })
    expect(resendMock).toHaveBeenCalledWith({ type: 'signup', email: 'a@club.fr' })
  })

  it('mappe un 429 en rate_limit', async () => {
    resendMock.mockResolvedValue({ error: { status: 429, message: 'slow down' } })
    await expect(resendSignupConfirmation('a@club.fr')).resolves.toEqual({
      ok: false,
      error: 'rate_limit',
    })
  })
})

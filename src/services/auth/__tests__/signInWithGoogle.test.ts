import { afterEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'

const signInWithOAuthMock = vi.fn()

vi.mock('../../supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: unknown[]) => signInWithOAuthMock(...args),
    },
  },
}))

describe('signInWithGoogle', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('redirige vers /auth/callback de l’origine courante', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } })
    signInWithOAuthMock.mockResolvedValue({ error: null })

    const { signInWithGoogle } = await import('../authService')
    const result = await signInWithGoogle()

    expect(result).toEqual({ ok: true, value: undefined })
    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback',
        queryParams: { prompt: 'select_account' },
      },
    })
  })

  it('mappe un 429 en RATE_LIMIT', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://rugbyforge.fr' } })
    signInWithOAuthMock.mockResolvedValue({ error: { status: 429, message: 'rate' } })

    const { signInWithGoogle } = await import('../authService')
    await expect(signInWithGoogle()).resolves.toEqual({ ok: false, error: 'RATE_LIMIT' })
  })

  it('prend le nom Google (full_name) si display_name est absent', async () => {
    const { mapSupabaseUserToAuthUser } = await import('../authService')
    const user = {
      id: 'u1',
      email: 'antoine@gmail.com',
      created_at: '2026-10-27T12:00:00.000Z',
      user_metadata: { full_name: 'Antoine Dupont' },
    } as unknown as User
    expect(mapSupabaseUserToAuthUser(user).displayName).toBe('Antoine Dupont')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'

type UpsertResult = { error: { message: string } | null }

function createLazyBuilder(result: UpsertResult) {
  let thenCalled = 0
  const builder = {
    then(
      onFulfilled?: (value: UpsertResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      thenCalled += 1
      return Promise.resolve(result).then(onFulfilled, onRejected)
    },
    get thenCallCount() {
      return thenCalled
    },
  }
  return builder
}

const upsertMock = vi.fn()
const fromMock = vi.fn(() => ({ upsert: upsertMock }))
const updateUserMock = vi.fn()

vi.mock('../../supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    auth: {
      updateUser: (...args: unknown[]) => updateUserMock(...args),
    },
  },
}))

describe('persistOauthLegalConsent', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('consomme le thenable PostgREST et pose password_needs_upgrade=false', async () => {
    const builder = createLazyBuilder({ error: null })
    upsertMock.mockReturnValue(builder)
    updateUserMock.mockResolvedValue({ error: null })

    const { persistOauthLegalConsent } = await import('../persistOauthLegalConsent')
    await persistOauthLegalConsent({
      userId: 'user-1',
      medicalConsentAcceptedAt: '2026-10-27T12:00:00.000Z',
      newsletterOptIn: true,
    })

    expect(fromMock).toHaveBeenCalledWith('profiles')
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        medical_consent_accepted_at: '2026-10-27T12:00:00.000Z',
        adult_play_eligibility_approved: true,
        password_needs_upgrade: false,
        newsletter_opt_in: true,
        newsletter_opt_in_source: 'signup',
      }),
      { onConflict: 'id' },
    )
    expect(builder.thenCallCount).toBeGreaterThan(0)
    expect(updateUserMock).toHaveBeenCalled()
  })

  it('ne throw pas si Supabase refuse l’écriture', async () => {
    upsertMock.mockReturnValue(createLazyBuilder({ error: { message: 'rls' } }))
    updateUserMock.mockResolvedValue({ error: { message: 'meta' } })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { persistOauthLegalConsent } = await import('../persistOauthLegalConsent')
    await expect(persistOauthLegalConsent({
      userId: 'user-1',
      medicalConsentAcceptedAt: '2026-10-27T12:00:00.000Z',
    })).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })
})

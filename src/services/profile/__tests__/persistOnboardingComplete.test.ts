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

vi.mock('../../supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}))

describe('persistOnboardingComplete', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('consomme le thenable PostgREST (sans await, l’upsert ne part jamais)', async () => {
    const builder = createLazyBuilder({ error: null })
    upsertMock.mockReturnValue(builder)

    const { persistOnboardingComplete } = await import('../persistOnboardingComplete')
    await persistOnboardingComplete('user-1')

    expect(fromMock).toHaveBeenCalledWith('profiles')
    expect(upsertMock).toHaveBeenCalledWith(
      { id: 'user-1', onboarding_complete: true },
      { onConflict: 'id' },
    )
    expect(builder.thenCallCount).toBeGreaterThan(0)
  })

  it('ne throw pas si Supabase refuse l’écriture', async () => {
    upsertMock.mockReturnValue(createLazyBuilder({ error: { message: 'rls' } }))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { persistOnboardingComplete } = await import('../persistOnboardingComplete')
    await expect(persistOnboardingComplete('user-1')).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })
})

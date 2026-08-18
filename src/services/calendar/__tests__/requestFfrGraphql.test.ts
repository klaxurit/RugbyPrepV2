import { beforeEach, describe, expect, it, vi } from 'vitest'
import { postFfrGraphql } from '../postFfrGraphql'
import { isFfrUpstreamSyncError, requestFfrGraphql } from '../requestFfrGraphql'

const invokeMock = vi.fn()
const refreshSessionMock = vi.fn()

vi.mock('../../supabase/client', () => ({
  supabase: {
    auth: { refreshSession: (...args: unknown[]) => refreshSessionMock(...args) },
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}))

vi.mock('../postFfrGraphql', () => ({
  postFfrGraphql: vi.fn(),
}))

describe('requestFfrGraphql', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    refreshSessionMock.mockReset()
    refreshSessionMock.mockResolvedValue({})
    vi.mocked(postFfrGraphql).mockReset()
  })

  it('utilise le fetch direct quand la FFR répond', async () => {
    vi.mocked(postFfrGraphql).mockResolvedValue({
      ok: true,
      status: 200,
      json: { data: { ok: true } },
    })

    const result = await requestFfrGraphql('query Q { x }', { ffrId: 1 })

    expect(invokeMock).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: true, status: 200, json: { data: { ok: true } } })
  })

  it('bascule sur le proxy Edge si fetch jette (CSP / Failed to fetch)', async () => {
    vi.mocked(postFfrGraphql).mockRejectedValue(new TypeError('Failed to fetch'))
    invokeMock.mockResolvedValue({
      data: { ok: true, status: 200, json: { data: { Structure: { id: 1 } } } },
      error: null,
    })

    const result = await requestFfrGraphql('query Q { x }', { ffrId: 1 })

    expect(invokeMock).toHaveBeenCalledWith(
      'ffr-sync',
      expect.objectContaining({
        body: { action: 'proxy_graphql', query: 'query Q { x }', variables: { ffrId: 1 } },
      }),
    )
    expect(result.ok).toBe(true)
    expect(result.json).toEqual({ data: { Structure: { id: 1 } } })
  })

  it('bascule sur le proxy Edge si la FFR renvoie un HTTP d’erreur', async () => {
    vi.mocked(postFfrGraphql).mockResolvedValue({ ok: false, status: 403, json: null })
    invokeMock.mockResolvedValue({
      data: { ok: true, status: 200, json: { data: {} } },
      error: null,
    })

    const result = await requestFfrGraphql('query Q { x }', {})

    expect(invokeMock).toHaveBeenCalled()
    expect(result.ok).toBe(true)
  })
})

describe('isFfrUpstreamSyncError', () => {
  it('reconnaît les erreurs amont FFR (pour le fallback client)', () => {
    expect(isFfrUpstreamSyncError('ffr_unavailable')).toBe(true)
    expect(isFfrUpstreamSyncError('missing_matches')).toBe(true)
    expect(isFfrUpstreamSyncError('ffr_http_403')).toBe(true)
    expect(isFfrUpstreamSyncError('unauthorized')).toBe(false)
  })
})

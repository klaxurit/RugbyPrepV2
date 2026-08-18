import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { FFR_GRAPHQL_URL, postFfrGraphql } from '../postFfrGraphql'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
  CapacitorHttp: { post: vi.fn() },
}))

describe('postFfrGraphql', () => {
  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    vi.mocked(CapacitorHttp.post).mockReset()
    vi.unstubAllGlobals()
  })

  it('web : fetch vers l’API FFR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { Structure: { id: 1 } } }),
      }),
    )

    const result = await postFfrGraphql('query Q { x }', { ffrId: 42 })

    expect(CapacitorHttp.post).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith(
      FFR_GRAPHQL_URL,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result).toEqual({
      ok: true,
      status: 200,
      json: { data: { Structure: { id: 1 } } },
    })
  })

  it('iOS : CapacitorHttp (pas fetch) — contourne le CORS WKWebView', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(CapacitorHttp.post).mockResolvedValue({
      status: 200,
      data: { data: { Competition: { id: '1' } } },
      headers: {},
      url: FFR_GRAPHQL_URL,
    })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await postFfrGraphql('query C { x }', { compId: 9 })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(CapacitorHttp.post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: FFR_GRAPHQL_URL,
        data: { query: 'query C { x }', variables: { compId: 9 } },
      }),
    )
    expect(result.ok).toBe(true)
    expect(result.json).toEqual({ data: { Competition: { id: '1' } } })
  })
})

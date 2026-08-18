import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syncCalendar } from '../ffrSyncService'
import { requestFfrGraphql } from '../requestFfrGraphql'

const invokeMock = vi.fn()
const refreshSessionMock = vi.fn()

vi.mock('../../supabase/client', () => ({
  supabase: {
    auth: { refreshSession: (...args: unknown[]) => refreshSessionMock(...args) },
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}))

vi.mock('../requestFfrGraphql', async () => {
  const actual = await vi.importActual<typeof import('../requestFfrGraphql')>('../requestFfrGraphql')
  return {
    ...actual,
    requestFfrGraphql: vi.fn(),
  }
})

describe('syncCalendar', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    refreshSessionMock.mockReset()
    refreshSessionMock.mockResolvedValue({})
    vi.mocked(requestFfrGraphql).mockReset()
  })

  it('laisse l’Edge Function fetch la FFR (TWA / Play) sans GraphQL client', async () => {
    invokeMock.mockResolvedValue({ data: { success: true, imported: 8 }, error: null })

    const result = await syncCalendar('123', '4207Y')

    expect(requestFfrGraphql).not.toHaveBeenCalled()
    expect(invokeMock).toHaveBeenCalledWith(
      'ffr-sync',
      expect.objectContaining({
        body: { action: 'sync_calendar', competitionId: '123', clubCode: '4207Y' },
      }),
    )
    expect(result).toEqual({ imported: 8 })
  })

  it('retombe sur le GraphQL client si l’Edge n’a pas les matchs', async () => {
    invokeMock
      .mockResolvedValueOnce({ data: { success: false, error: 'missing_matches' }, error: null })
      .mockResolvedValueOnce({ data: { success: true, imported: 2 }, error: null })
    vi.mocked(requestFfrGraphql).mockResolvedValue({
      ok: true,
      status: 200,
      json: {
        data: {
          Competition: {
            Journees: [
              {
                nom: 'Journée 1',
                numero: 1,
                Rencontres: [
                  {
                    id: 'r-1',
                    dateOfficielle: '2099-03-15T14:00:00.000Z',
                    Etat: { nom: 'À venir' },
                    CompetitionEquipeLocale: { Structure: { code: '4207Y', nom: 'Us' } },
                    CompetitionEquipeVisiteuse: { Structure: { code: '9999Z', nom: 'Them' } },
                  },
                ],
              },
            ],
          },
        },
      },
    })

    const result = await syncCalendar('123', '4207Y')

    expect(requestFfrGraphql).toHaveBeenCalled()
    expect(invokeMock).toHaveBeenCalledTimes(2)
    expect(invokeMock.mock.calls[1][1].body.matches).toHaveLength(1)
    expect(result).toEqual({ imported: 2 })
  })
})

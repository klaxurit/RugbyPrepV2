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

  const calendarJson = {
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
  }

  it('lit la FFR côté client puis envoie les matchs à l’Edge', async () => {
    vi.mocked(requestFfrGraphql).mockResolvedValue({
      ok: true,
      status: 200,
      json: calendarJson,
    })
    invokeMock.mockResolvedValue({ data: { success: true, imported: 8 }, error: null })

    const result = await syncCalendar('123', '4207Y')

    expect(requestFfrGraphql).toHaveBeenCalled()
    expect(invokeMock).toHaveBeenCalledTimes(1)
    expect(invokeMock).toHaveBeenCalledWith(
      'ffr-sync',
      expect.objectContaining({
        body: expect.objectContaining({
          action: 'sync_calendar',
          competitionId: '123',
          clubCode: '4207Y',
          matches: expect.any(Array),
        }),
      }),
    )
    expect(invokeMock.mock.calls[0][1].body.matches).toHaveLength(1)
    expect(result).toEqual({ imported: 8 })
  })

  it('ignore les erreurs GraphQL partielles si le calendrier est présent', async () => {
    vi.mocked(requestFfrGraphql).mockResolvedValue({
      ok: true,
      status: 200,
      json: { errors: [{ message: '' }], ...calendarJson },
    })
    invokeMock.mockResolvedValue({ data: { success: true, imported: 1 }, error: null })

    const result = await syncCalendar('123', '4207Y')

    expect(invokeMock).toHaveBeenCalledTimes(1)
    expect(invokeMock.mock.calls[0][1].body.matches).toHaveLength(1)
    expect(result).toEqual({ imported: 1 })
  })

  it('retombe sur l’Edge si le client ne joint pas la FFR', async () => {
    vi.mocked(requestFfrGraphql).mockResolvedValue({ ok: false, status: 403, json: null })
    invokeMock.mockResolvedValue({ data: { success: true, imported: 2 }, error: null })

    const result = await syncCalendar('123', '4207Y')

    expect(invokeMock).toHaveBeenCalledWith(
      'ffr-sync',
      expect.objectContaining({
        body: { action: 'sync_calendar', competitionId: '123', clubCode: '4207Y' },
      }),
    )
    expect(result).toEqual({ imported: 2 })
  })
})

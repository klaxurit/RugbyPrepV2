import { describe, expect, it, vi, beforeEach } from 'vitest'
import { deleteFfrImportedMatches, dropFfrImportedEvents, staleFfrImportIds } from '../ffrImportedEvents'

const deleteEq = vi.fn()

vi.mock('../../supabase/client', () => ({
  supabase: {
    from: () => ({
      delete: () => {
        const result = { error: null }
        const chain: {
          eq: (...args: unknown[]) => typeof chain
          then: (onFulfilled: (value: typeof result) => unknown) => Promise<unknown>
        } = {
          eq: (...args: unknown[]) => {
            deleteEq(...args)
            return chain
          },
          then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
        }
        return chain
      },
    }),
  },
}))

describe('dropFfrImportedEvents', () => {
  it('garde les matchs manuels et enlève les imports FFR', () => {
    const next = dropFfrImportedEvents([
      { id: 'm1', source: 'manual' as const },
      { id: 'f1', source: 'ffr_import' as const },
      { id: 'f2', source: 'ffr_import' as const },
    ])
    expect(next.map((e) => e.id)).toEqual(['m1'])
  })
})

describe('staleFfrImportIds', () => {
  it('supprime les imports d’une autre compétition, pas les matchs encore dans le sync', () => {
    const ids = staleFfrImportIds(
      [
        { id: 'keep-incoming', competition_id: 'old', external_id: 'ext-1' },
        { id: 'drop-old-comp', competition_id: 'old', external_id: 'ext-2' },
        { id: 'keep-same-comp-past', competition_id: 'new', external_id: 'ext-past' },
      ],
      'new',
      new Set(['ext-1']),
    )
    expect(ids).toEqual(['drop-old-comp'])
  })
})

describe('deleteFfrImportedMatches', () => {
  beforeEach(() => {
    deleteEq.mockReset()
  })

  it('efface les lignes ffr_import du user', async () => {
    const result = await deleteFfrImportedMatches('user-1')
    expect(deleteEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(deleteEq).toHaveBeenCalledWith('source', 'ffr_import')
    expect(result.error).toBeUndefined()
  })
})

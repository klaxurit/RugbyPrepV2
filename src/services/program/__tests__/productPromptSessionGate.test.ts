import { describe, expect, it, vi } from 'vitest'
import {
  fetchCompletedGymSessionCountForProductPrompts,
  isProductPromptSessionGateOpen,
  productPromptSessionCountFromState,
} from '../productPromptSessionGate'

describe('isProductPromptSessionGateOpen', () => {
  it('refuse tant que le serveur n’a pas répondu', () => {
    expect(isProductPromptSessionGateOpen({ status: 'idle' })).toBe(false)
    expect(isProductPromptSessionGateOpen({ status: 'loading' })).toBe(false)
    expect(isProductPromptSessionGateOpen({ status: 'error' })).toBe(false)
  })

  it('refuse à 0 séance gym même ready', () => {
    expect(
      isProductPromptSessionGateOpen({ status: 'ready', completedGymSessionCount: 0 }),
    ).toBe(false)
  })

  it('ouvre après ≥1 séance gym serveur', () => {
    expect(
      isProductPromptSessionGateOpen({ status: 'ready', completedGymSessionCount: 1 }),
    ).toBe(true)
  })
})

describe('productPromptSessionCountFromState', () => {
  it('expose 0 hors ready', () => {
    expect(productPromptSessionCountFromState({ status: 'loading' })).toBe(0)
    expect(
      productPromptSessionCountFromState({ status: 'ready', completedGymSessionCount: 3 }),
    ).toBe(3)
  })
})

describe('fetchCompletedGymSessionCountForProductPrompts', () => {
  it('filtre récup et compte le reste', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        { session_type: 'LOWER' },
        { session_type: 'ACTIVE_RECOVERY' },
        { session_type: 'RECOVERY' },
        { session_type: 'UPPER' },
      ],
      error: null,
    })
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))
    const client = { from } as never

    await expect(
      fetchCompletedGymSessionCountForProductPrompts(client, 'user-1'),
    ).resolves.toBe(2)
    expect(from).toHaveBeenCalledWith('session_logs')
    expect(select).toHaveBeenCalledWith('session_type')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('échoue si erreur serveur', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const select = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ select }))
    const client = { from } as never

    await expect(
      fetchCompletedGymSessionCountForProductPrompts(client, 'user-1'),
    ).rejects.toThrow(/boom/)
  })
})

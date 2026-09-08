// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

let pending: { resolve: (value: { data: unknown; error: unknown }) => void } | null = null

vi.mock('../../services/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () =>
              new Promise((resolve) => {
                pending = { resolve: resolve as (value: { data: unknown; error: unknown }) => void }
              }),
          }),
        }),
      }),
    }),
  },
}))

vi.mock('../useAuth', () => ({
  useAuth: () => ({
    authState: { status: 'authenticated', user: { id: 'u1' } },
  }),
}))

import { useStaffCoachAccess } from '../useStaffCoachAccess'

describe('useStaffCoachAccess', () => {
  it('ne met pas à jour l’état après unmount (promesse encore en vol)', async () => {
    const { unmount } = renderHook(() => useStaffCoachAccess())
    expect(pending).not.toBeNull()

    unmount()

    await act(async () => {
      pending?.resolve({ data: [], error: null })
      await Promise.resolve()
    })
  })
})

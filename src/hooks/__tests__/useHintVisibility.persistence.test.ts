// @vitest-environment jsdom
//
// Persistence invariants : ces tests blindent les bugs UX qui ont déjà
// surgi en prod (dismiss qui ré-apparaît au refresh, badge qui revient
// chaque semaine sans changement de contenu).

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const mockUserId = 'user-persist-1'
const mockLogs: Array<{ id: string }> = []

const upsertCalls: unknown[] = []

vi.mock('../../services/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            // No remote record by default — local cache must drive everything.
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      upsert: (payload: unknown) => {
        upsertCalls.push(payload)
        return Promise.resolve({ error: null })
      },
    }),
  },
}))

vi.mock('../useAuth', () => ({
  useAuth: () => ({
    authState: { status: 'authenticated', user: { id: mockUserId } },
  }),
}))

vi.mock('../useHistory', () => ({
  useHistory: () => ({ logs: mockLogs }),
}))

import { useHintVisibility } from '../useHintVisibility'

beforeEach(() => {
  localStorage.clear()
  mockLogs.length = 0
  upsertCalls.length = 0
})

describe('useHintVisibility — persistence invariants', () => {
  it('dismiss persists across remount via localStorage even when Supabase returns no row', async () => {
    // First mount → dismiss
    const first = renderHook(() => useHintVisibility('hint-persist'))
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    expect(first.result.current.visible).toBe(true)
    act(() => { first.result.current.dismiss() })
    expect(first.result.current.visible).toBe(false)
    first.unmount()

    // Second mount = simulates a page refresh.
    // Supabase fetch returns null (table miss / network / RLS) but local cache
    // must still hide the hint. This is the regression that bit us in prod.
    const second = renderHook(() => useHintVisibility('hint-persist'))
    expect(second.result.current.visible).toBe(false) // immediate, before async
    await waitFor(() => expect(second.result.current.loading).toBe(false))
    expect(second.result.current.visible).toBe(false) // after Supabase fetch
  })

  it('Supabase miss after dismiss does NOT clear the local optimistic state', async () => {
    const { result } = renderHook(() => useHintVisibility('hint-supabase-miss'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.dismiss() })
    expect(result.current.visible).toBe(false)
    // Wait an extra tick so any background fetch completes — the previous
    // implementation called setRecord(null) here and re-showed the hint.
    await new Promise((r) => setTimeout(r, 20))
    expect(result.current.visible).toBe(false)
  })

  it('contextHash change after a dismiss re-shows the hint and a new dismiss is scoped to the new context', async () => {
    const { result, rerender } = renderHook(
      (props: { hash: string }) => useHintVisibility('hint-ctx', { contextHash: props.hash }),
      { initialProps: { hash: 'phase-3' } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.dismiss() })
    expect(result.current.visible).toBe(false)

    // Phase changes → invalidates dismiss
    rerender({ hash: 'phase-4' })
    expect(result.current.visible).toBe(true)

    // Dismiss again under new context → still hidden under phase-4
    act(() => { result.current.dismiss() })
    expect(result.current.visible).toBe(false)

    // Reverting to phase-3 should also re-show (different hash than current dismiss)
    rerender({ hash: 'phase-3' })
    expect(result.current.visible).toBe(true)
  })

  it('expireAfterSessions auto-hides regardless of dismiss state', async () => {
    const { result, rerender } = renderHook(
      (props: { logs: number }) => {
        mockLogs.length = 0
        for (let i = 0; i < props.logs; i++) mockLogs.push({ id: `l${i}` })
        return useHintVisibility('hint-expire', { expireAfterSessions: 5 })
      },
      { initialProps: { logs: 0 } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.visible).toBe(true)

    // 4 séances → still visible
    rerender({ logs: 4 })
    expect(result.current.visible).toBe(true)

    // 5 séances → auto-hide (l'utilisateur connaît l'app, plus besoin du hint)
    rerender({ logs: 5 })
    expect(result.current.visible).toBe(false)
  })

  it('cooldown elapsed re-shows even if no contextHash change', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T10:00:00Z'))
    try {
      const { result, rerender } = renderHook(() =>
        useHintVisibility('hint-cooldown', { cooldownDays: 7 }),
      )
      await act(async () => { await Promise.resolve() })
      act(() => { result.current.dismiss() })
      expect(result.current.visible).toBe(false)

      // 6 days later → still hidden
      vi.setSystemTime(new Date('2026-04-07T10:00:00Z'))
      rerender()
      expect(result.current.visible).toBe(false)

      // 8 days later → re-shown
      vi.setSystemTime(new Date('2026-04-09T10:00:00Z'))
      rerender()
      expect(result.current.visible).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('writes to Supabase on dismiss with the correct payload', async () => {
    const { result } = renderHook(() => useHintVisibility('hint-write', { contextHash: 'ctx-xyz' }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.dismiss() })
    await waitFor(() => expect(upsertCalls.length).toBe(1))
    const payload = upsertCalls[0] as { user_id: string; hint_id: string; context_hash: string }
    expect(payload.user_id).toBe(mockUserId)
    expect(payload.hint_id).toBe('hint-write')
    expect(payload.context_hash).toBe('ctx-xyz')
  })
})

// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const mockUserId = 'user-test-1'
const mockLogs: Array<{ id: string }> = []

const upsertMock = vi.fn().mockResolvedValue({ error: null })
const supabaseSelectMock = vi.fn()

function buildSupabaseMock(maybeSingle: { data: unknown; error: unknown }) {
  return {
    from: () => ({
      select: (...args: unknown[]) => {
        supabaseSelectMock(...args)
        return {
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve(maybeSingle),
            }),
          }),
        }
      },
      upsert: (...args: unknown[]) => {
        upsertMock(...args)
        return Promise.resolve({ error: null })
      },
    }),
  }
}

let supabaseMaybeSingle: { data: unknown; error: unknown } = { data: null, error: null }

vi.mock('../../services/supabase/client', () => ({
  get supabase() { return buildSupabaseMock(supabaseMaybeSingle) },
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
  upsertMock.mockClear()
  supabaseMaybeSingle = { data: null, error: null }
})

afterEach(() => { vi.useRealTimers() })

describe('useHintVisibility', () => {
  it('visible by default when no dismiss record exists', async () => {
    const { result } = renderHook(() => useHintVisibility('hint-a'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.visible).toBe(true)
  })

  it('hides immediately after dismiss() and persists optimistically', async () => {
    const { result } = renderHook(() => useHintVisibility('hint-b'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.dismiss() })
    expect(result.current.visible).toBe(false)
    expect(upsertMock).toHaveBeenCalledTimes(1)
  })

  it('reappears after cooldownDays elapsed', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T10:00:00Z'))
    const { result, rerender } = renderHook(
      (props: { hint: string }) => useHintVisibility(props.hint, { cooldownDays: 7 }),
      { initialProps: { hint: 'hint-c' } },
    )
    await act(async () => { await Promise.resolve() })
    act(() => { result.current.dismiss() })
    expect(result.current.visible).toBe(false)

    // 8 days later → cooldown elapsed
    vi.setSystemTime(new Date('2026-04-09T10:00:00Z'))
    rerender({ hint: 'hint-c' })
    expect(result.current.visible).toBe(true)
  })

  it('expires automatically after expireAfterSessions logged sessions', async () => {
    const { result, rerender } = renderHook(
      (props: { count: number }) => {
        // Re-mock log count between renders
        mockLogs.length = 0
        for (let i = 0; i < props.count; i++) mockLogs.push({ id: `l${i}` })
        return useHintVisibility('hint-d', { expireAfterSessions: 5 })
      },
      { initialProps: { count: 0 } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.visible).toBe(true)
    rerender({ count: 5 })
    expect(result.current.visible).toBe(false)
  })

  it('reappears when contextHash changes after a dismiss', async () => {
    const { result, rerender } = renderHook(
      (props: { hash: string }) => useHintVisibility('hint-e', { contextHash: props.hash }),
      { initialProps: { hash: 'phase-3' } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => { result.current.dismiss() })
    expect(result.current.visible).toBe(false)
    rerender({ hash: 'phase-4' })
    expect(result.current.visible).toBe(true)
  })

  it('hydrates from Supabase on mount when a record exists', async () => {
    supabaseMaybeSingle = {
      data: { dismissed_at: new Date().toISOString(), context_hash: null },
      error: null,
    }
    const { result } = renderHook(() => useHintVisibility('hint-f'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.visible).toBe(false)
  })
})

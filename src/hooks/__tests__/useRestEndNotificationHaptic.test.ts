// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRestEndNotificationHaptic } from '../useRestEndNotificationHaptic'
import { REST_END_HAPTIC_MESSAGE } from '../../services/notifications/restEndHaptic'

const vibrateMock = vi.fn()

vi.mock('../../utils/vibrate', () => ({
  vibrate: (...args: unknown[]) => vibrateMock(...args),
}))

describe('useRestEndNotificationHaptic', () => {
  afterEach(() => {
    vibrateMock.mockReset()
  })

  it('vibre quand le SW envoie REST_END_HAPTIC', () => {
    const listeners: Array<(event: MessageEvent) => void> = []
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        addEventListener: (_type: string, handler: (event: MessageEvent) => void) => {
          listeners.push(handler)
        },
        removeEventListener: (_type: string, handler: (event: MessageEvent) => void) => {
          const idx = listeners.indexOf(handler)
          if (idx >= 0) listeners.splice(idx, 1)
        },
      },
    })

    renderHook(() => useRestEndNotificationHaptic())

    listeners.forEach((handler) =>
      handler(new MessageEvent('message', { data: { type: REST_END_HAPTIC_MESSAGE } })),
    )

    expect(vibrateMock).toHaveBeenCalledWith([120, 80, 120, 80, 120])
  })
})

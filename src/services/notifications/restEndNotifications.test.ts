// @vitest-environment jsdom

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import {
  cancelRestEndPush,
  cancelRestEndServiceWorker,
  getSessionReturnUrl,
  scheduleRestEndPush,
  scheduleRestEndServiceWorker,
  syncRestEndNotifications,
} from './restEndNotifications'

const invokeMock = vi.fn()
const postMessageMock = vi.fn()

vi.mock('../supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}))

vi.mock('./postToServiceWorker', () => ({
  hasNotificationPermission: () => true,
  postToServiceWorker: (msg: unknown) => {
    postMessageMock(msg)
    return Promise.resolve()
  },
}))

describe('restEndNotifications', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    postMessageMock.mockReset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-19T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('scheduleRestEndServiceWorker envoie SCHEDULE_REST_END au SW', async () => {
    const endsAt = Date.now() + 90_000
    await scheduleRestEndServiceWorker({ endsAt, label: 'Squat', returnUrl: '/session/2' })

    expect(postMessageMock).toHaveBeenCalledWith({
      type: 'SCHEDULE_REST_END',
      seconds: 90,
      label: 'Squat',
      url: '/session/2',
    })
  })

  it('cancelRestEndServiceWorker envoie CANCEL_REST_END', async () => {
    await cancelRestEndServiceWorker()
    expect(postMessageMock).toHaveBeenCalledWith({ type: 'CANCEL_REST_END' })
  })

  it('scheduleRestEndPush appelle schedule-rest-end', async () => {
    const endsAt = Date.now() + 60_000
    await scheduleRestEndPush({ endsAt, returnUrl: '/session/1' })

    expect(invokeMock).toHaveBeenCalledWith('schedule-rest-end', {
      body: {
        endsAtISO: new Date(endsAt).toISOString(),
        label: 'Repos terminé',
        returnUrl: '/session/1',
      },
    })
  })

  it('cancelRestEndPush appelle cancel-rest-end', async () => {
    await cancelRestEndPush()
    expect(invokeMock).toHaveBeenCalledWith('cancel-rest-end', { body: {} })
  })

  it('syncRestEndNotifications en arrière-plan programme SW + push', async () => {
    const endsAt = Date.now() + 45_000
    await syncRestEndNotifications({ endsAt }, true)

    expect(postMessageMock).toHaveBeenCalled()
    expect(invokeMock).toHaveBeenCalledWith('schedule-rest-end', expect.any(Object))
  })

  it('syncRestEndNotifications au premier plan annule tout', async () => {
    const endsAt = Date.now() + 45_000
    await syncRestEndNotifications({ endsAt }, false)

    expect(postMessageMock).toHaveBeenCalledWith({ type: 'CANCEL_REST_END' })
    expect(invokeMock).toHaveBeenCalledWith('cancel-rest-end', { body: {} })
  })

  it('syncRestEndNotifications sans timer annule', async () => {
    await syncRestEndNotifications(null, true)

    expect(postMessageMock).toHaveBeenCalledWith({ type: 'CANCEL_REST_END' })
    expect(invokeMock).toHaveBeenCalledWith('cancel-rest-end', { body: {} })
  })

  it('getSessionReturnUrl renvoie la route séance courante', () => {
    window.history.pushState({}, '', '/session/3')
    expect(getSessionReturnUrl()).toBe('/session/3')
  })
})

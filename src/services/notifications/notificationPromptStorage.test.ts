// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  canShowNotificationPrompt,
  dismissNotificationPrompt,
  isNotificationPromptSuppressed,
} from './notificationPromptStorage'
import {
  canOfferRestTimerNotificationOptIn,
  canOfferTrainingReminderOptIn,
} from './notificationOptInEligibility'

describe('notificationPromptStorage', () => {
  const userId = 'test-user'

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('pas supprimé par défaut', () => {
    expect(isNotificationPromptSuppressed(userId, 'onboarding', '2026-06-16')).toBe(false)
    expect(canShowNotificationPrompt(userId, 'onboarding', '2026-06-16')).toBe(true)
  })

  it('dismiss → cooldown 7 jours', () => {
    dismissNotificationPrompt(userId, 'onboarding', '2026-06-16')
    expect(isNotificationPromptSuppressed(userId, 'onboarding', '2026-06-16')).toBe(true)
    expect(isNotificationPromptSuppressed(userId, 'onboarding', '2026-06-22')).toBe(true)
    expect(isNotificationPromptSuppressed(userId, 'onboarding', '2026-06-23')).toBe(true)
    expect(isNotificationPromptSuppressed(userId, 'onboarding', '2026-06-24')).toBe(false)
  })
})

describe('notificationOptInEligibility', () => {
  const originalNotification = globalThis.Notification

  afterEach(() => {
    if (originalNotification) {
      Object.defineProperty(globalThis, 'Notification', {
        configurable: true,
        writable: true,
        value: originalNotification,
      })
    } else {
      Reflect.deleteProperty(globalThis, 'Notification')
    }
  })

  it('sans API Notification → unsupported', () => {
    Reflect.deleteProperty(globalThis, 'Notification')
    expect(canOfferTrainingReminderOptIn()).toBe(false)
    expect(canOfferRestTimerNotificationOptIn()).toBe(false)
  })
})

// @vitest-environment jsdom

import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  acceptNotificationPrompt,
  canShowNotificationPrompt,
  deferNotificationPromptsUntilGymCount,
  dismissNotificationPrompt,
  dismissOnboardingNotificationPrompt,
  isNotificationPromptSkippedThisSession,
  isNotificationPromptSuppressed,
  markNotificationPromptSkippedThisSession,
} from './notificationPromptStorage'
import {
  canOfferRestTimerNotificationOptIn,
  canOfferTrainingReminderOptIn,
} from './notificationOptInEligibility'

describe('notificationPromptStorage', () => {
  const userId = 'test-user'

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
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

  it('accept → suppression permanente', () => {
    acceptNotificationPrompt(userId, 'rest_timer')
    expect(isNotificationPromptSuppressed(userId, 'rest_timer', '2030-01-01')).toBe(true)
    expect(canShowNotificationPrompt(userId, 'rest_timer', '2030-01-01')).toBe(false)
  })

  it('Plus tard onboarding → skip session + pas de rest_timer avant 2 séances', () => {
    dismissOnboardingNotificationPrompt(userId, '2026-06-16')
    expect(isNotificationPromptSkippedThisSession()).toBe(true)
    expect(
      canShowNotificationPrompt(userId, 'rest_timer', '2026-06-16', {
        completedGymSessionCount: 0,
      }),
    ).toBe(false)
    expect(
      canShowNotificationPrompt(userId, 'rest_timer', '2026-06-16', {
        completedGymSessionCount: 1,
      }),
    ).toBe(false)
    // Même après clear sessionStorage, le différé bloque rest_timer.
    sessionStorage.clear()
    expect(
      canShowNotificationPrompt(userId, 'rest_timer', '2026-06-20', {
        completedGymSessionCount: 2,
      }),
    ).toBe(false)
    expect(
      canShowNotificationPrompt(userId, 'combined', '2026-06-20', {
        completedGymSessionCount: 2,
      }),
    ).toBe(true)
  })

  it('skip session navigateur bloque tout prompt', () => {
    markNotificationPromptSkippedThisSession()
    expect(canShowNotificationPrompt(userId, 'rest_timer', '2026-06-16')).toBe(false)
  })

  it('deferUntilGymCount bloque jusqu’au seuil', () => {
    deferNotificationPromptsUntilGymCount(userId, 2)
    expect(
      canShowNotificationPrompt(userId, 'combined', '2026-06-16', {
        completedGymSessionCount: 1,
      }),
    ).toBe(false)
    expect(
      canShowNotificationPrompt(userId, 'combined', '2026-06-16', {
        completedGymSessionCount: 2,
      }),
    ).toBe(true)
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

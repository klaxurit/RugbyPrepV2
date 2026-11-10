import { useEffect, useRef, useState } from 'react'
import { useSessionRun } from '../../contexts/SessionRunContext'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useHistory } from '../../hooks/useHistory'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationOptInSheet } from './NotificationOptInSheet'
import {
  acceptNotificationPrompt,
  canShowNotificationPrompt,
  clearDeferredNotificationGymCount,
  dismissNotificationPrompt,
  getDeferredNotificationGymCount,
  markNotificationPromptSkippedThisSession,
} from '../../services/notifications/notificationPromptStorage'
import { canOfferRestTimerNotificationOptIn } from '../../services/notifications/notificationOptInEligibility'
import { useOverlayPermission } from '../../hooks/useOverlayPermission'
import { posthog } from '../../services/analytics/posthog'
import type { Lang } from '../../i18n/appLabels'

/**
 * Soft prompt contextuel : timer de repos OU message combiné après différé onboarding.
 * Les alertes de repos fonctionnent sans push (bip / vibration in-app).
 */
export function RestTimerNotificationPrompt() {
  const { restTimer } = useSessionRun()
  const { authState } = useAuth()
  const { profile } = useProfile()
  const { logs } = useHistory()
  const { subscribe, requestBrowserPermission, status } = useNotifications(profile)
  const lang: Lang = (profile?.preferredLanguage as Lang | undefined) ?? 'fr'
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const completedGymSessionCount = logs.filter(
    (l) => l.sessionType !== 'ACTIVE_RECOVERY' && l.sessionType !== 'RECOVERY',
  ).length

  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState<'rest_timer' | 'combined'>('rest_timer')
  const [isLoading, setIsLoading] = useState(false)
  const promptedThisSessionRef = useRef(false)
  const hadRestTimerRef = useRef(false)
  const allowed = useOverlayPermission('notification_opt_in', open)

  useEffect(() => {
    if (promptedThisSessionRef.current) return
    if (!canOfferRestTimerNotificationOptIn()) return
    if (status === 'subscribed' || status === 'denied' || status === 'unsupported' || status === 'no_vapid') {
      return
    }

    const deferredUntil = getDeferredNotificationGymCount(userId)
    const gymOpts = { completedGymSessionCount }

    // Après « Plus tard » onboarding : un seul message combiné une fois le seuil atteint.
    if (
      deferredUntil != null &&
      completedGymSessionCount >= deferredUntil &&
      canShowNotificationPrompt(userId, 'combined', undefined, gymOpts)
    ) {
      promptedThisSessionRef.current = true
      setVariant('combined')
      setOpen(true)
      posthog.capture('notification_prompt_shown', { kind: 'combined' })
      return
    }

    if (!restTimer) {
      hadRestTimerRef.current = false
      return
    }
    if (hadRestTimerRef.current) return
    hadRestTimerRef.current = true

    if (!canShowNotificationPrompt(userId, 'rest_timer', undefined, gymOpts)) return

    promptedThisSessionRef.current = true
    setVariant('rest_timer')
    setOpen(true)
    posthog.capture('notification_prompt_shown', { kind: 'rest_timer' })
  }, [restTimer, userId, status, completedGymSessionCount])

  const close = () => setOpen(false)

  const handleLater = () => {
    markNotificationPromptSkippedThisSession()
    dismissNotificationPrompt(userId, variant === 'combined' ? 'combined' : 'rest_timer')
    if (variant === 'combined') {
      clearDeferredNotificationGymCount(userId)
      dismissNotificationPrompt(userId, 'rest_timer')
    }
    posthog.capture('notification_prompt_dismissed', { kind: variant })
    close()
  }

  const handleEnable = async () => {
    setIsLoading(true)
    try {
      // Fin de repos : bip/vibration in-app restent actifs sans push.
      // La permission navigateur active les notifs hors onglet.
      const permission = await requestBrowserPermission()
      acceptNotificationPrompt(userId, variant === 'combined' ? 'combined' : 'rest_timer')

      if (permission === 'granted') {
        void subscribe({ profileOverride: profile }).catch(() => undefined)
        posthog.capture('notification_prompt_enabled', { kind: variant })
      } else {
        posthog.capture('notification_prompt_denied', { kind: variant })
      }
    } catch {
      acceptNotificationPrompt(userId, variant === 'combined' ? 'combined' : 'rest_timer')
      posthog.capture('notification_prompt_denied', { kind: variant })
    } finally {
      setIsLoading(false)
      close()
    }
  }

  return (
    <NotificationOptInSheet
      open={allowed}
      variant={variant}
      lang={lang}
      isLoading={isLoading}
      onEnable={handleEnable}
      onLater={handleLater}
    />
  )
}

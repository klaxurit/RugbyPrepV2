import { useEffect, useRef, useState } from 'react'
import { useSessionRun } from '../../contexts/SessionRunContext'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationOptInSheet } from './NotificationOptInSheet'
import {
  canShowNotificationPrompt,
  dismissNotificationPrompt,
} from '../../services/notifications/notificationPromptStorage'
import { canOfferRestTimerNotificationOptIn } from '../../services/notifications/notificationOptInEligibility'
import { posthog } from '../../services/analytics/posthog'
import type { Lang } from '../../i18n/appLabels'

/**
 * Soft prompt contextuel : première utilisation du timer de repos.
 * Demande uniquement la permission navigateur (notif locale SW), pas l'abonnement push.
 */
export function RestTimerNotificationPrompt() {
  const { restTimer } = useSessionRun()
  const { authState } = useAuth()
  const { profile } = useProfile()
  const { requestBrowserPermission } = useNotifications(profile)
  const lang: Lang = (profile?.preferredLanguage as Lang | undefined) ?? 'fr'
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const promptedThisSessionRef = useRef(false)
  const hadRestTimerRef = useRef(false)

  useEffect(() => {
    if (!restTimer) {
      hadRestTimerRef.current = false
      return
    }

    if (hadRestTimerRef.current || promptedThisSessionRef.current) return
    hadRestTimerRef.current = true

    if (!canOfferRestTimerNotificationOptIn()) return
    if (!canShowNotificationPrompt(userId, 'rest_timer')) return

    promptedThisSessionRef.current = true
    setOpen(true)
    posthog.capture('notification_prompt_shown', { kind: 'rest_timer' })
  }, [restTimer, userId])

  const close = () => setOpen(false)

  const handleLater = () => {
    dismissNotificationPrompt(userId, 'rest_timer')
    posthog.capture('notification_prompt_dismissed', { kind: 'rest_timer' })
    close()
  }

  const handleEnable = async () => {
    setIsLoading(true)
    try {
      const result = await requestBrowserPermission()
      if (result === 'granted') {
        posthog.capture('notification_prompt_enabled', { kind: 'rest_timer' })
      } else {
        posthog.capture('notification_prompt_denied', { kind: 'rest_timer' })
      }
    } finally {
      setIsLoading(false)
      close()
    }
  }

  return (
    <NotificationOptInSheet
      open={open}
      variant="rest_timer"
      lang={lang}
      isLoading={isLoading}
      onEnable={handleEnable}
      onLater={handleLater}
    />
  )
}

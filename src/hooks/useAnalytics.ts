import { useCallback } from 'react'
import { posthog } from '../services/analytics/posthog'

type AnalyticsEvent =
  | 'signup_completed'
  | 'onboarding_completed'
  | 'week_viewed'
  | 'session_viewed'
  | 'session_logged'
  | 'chat_used'
  | 'program_viewed'
  | 'profile_updated'
  | 'test_added'

export function useAnalytics() {
  const track = useCallback((event: AnalyticsEvent, properties?: Record<string, unknown>) => {
    posthog.capture(event, properties)
  }, [])

  const identify = useCallback((userId: string, properties?: Record<string, unknown>) => {
    posthog.identify(userId, properties)
  }, [])

  const reset = useCallback(() => {
    posthog.reset()
  }, [])

  return { track, identify, reset }
}

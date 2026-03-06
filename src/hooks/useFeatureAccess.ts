import { useMemo } from 'react'
import { useEntitlements } from './useEntitlements'

export function useFeatureAccess() {
  const entitlements = useEntitlements()

  const features = useMemo(() => ({
    programBasic: entitlements.hasEntitlement('program_basic'),
    notificationsBasic: entitlements.hasEntitlement('notifications_basic'),
    calendarBasic: entitlements.hasEntitlement('calendar_basic'),
    athleticTestsBasic: entitlements.hasEntitlement('athletic_tests_basic'),
    premiumProgramAdaptations: entitlements.hasEntitlement('premium_program_adaptations'),
    premiumAnalytics: entitlements.hasEntitlement('premium_analytics'),
    advancedNotifications: entitlements.hasEntitlement('advanced_notifications'),
    coachMode: entitlements.hasEntitlement('coach_mode'),
    prioritySupport: entitlements.hasEntitlement('priority_support'),
  }), [entitlements])

  return {
    ...entitlements,
    features,
  }
}

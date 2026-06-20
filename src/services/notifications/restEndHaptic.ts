/** Pattern vibration fin de repos — notif système SW + fallback haptique au tap. */
export const REST_END_VIBRATE_PATTERN = [120, 80, 120, 80, 120] as const

export const REST_END_NOTIFICATION_TAG = 'rugbyforge-rest-end'

export const REST_END_HAPTIC_MESSAGE = 'REST_END_HAPTIC' as const

export function isRestEndNotificationTag(tag: string | undefined): boolean {
  return tag === REST_END_NOTIFICATION_TAG
}

import posthog from 'posthog-js'

export function initPostHog(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  if (!key) return

  posthog.init(key, {
    api_host: 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: false,
  })
}

export { posthog }

import posthog from 'posthog-js'
import { PRODUCT_ANALYTICS_SCHEMA_VERSION } from './productTaxonomy'

export function initPostHog(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  if (!key) return

  const appVersion = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev'

  posthog.init(key, {
    api_host: 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    // Pageviews SPA : ScrollToTop émet `$pageview` manuellement.
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask], .ph-mask',
      blockSelector: '[data-ph-no-capture]',
    },
    loaded: (ph) => {
      try {
        ph.register({
          app_name: 'rugbyforge',
          analytics_schema_version: PRODUCT_ANALYTICS_SCHEMA_VERSION,
          app_version: appVersion,
        })
      } catch {
        /* ignore */
      }
    },
  })
}

export { posthog }

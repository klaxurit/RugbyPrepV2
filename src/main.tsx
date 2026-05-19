import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './styles/global.css'
import App from './App.tsx'
import { initAnalyticsIfConsented } from './services/analytics/cookieConsent'
import { initThemeFromStorage } from './utils/theme'
import { initStatusBar } from './services/native/initStatusBar'
import { initPlatformClass } from './services/native/initPlatformClass'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
if (typeof sentryDsn === 'string' && sentryDsn.trim().length > 0) {
  Sentry.init({
    dsn: sentryDsn.trim(),
    environment: import.meta.env.MODE,
    integrations: [],
    tracesSampleRate: import.meta.env.PROD ? 0.06 : 0,
  })
}

initThemeFromStorage()
initPlatformClass()
// WS9 — analytics gated by user consent (CNIL 2020). PostHog only inits
// when readCookieConsent() === 'accepted'.
initAnalyticsIfConsented()
void initStatusBar()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

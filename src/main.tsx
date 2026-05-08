import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { initAnalyticsIfConsented } from './services/analytics/cookieConsent'
import { initThemeFromStorage } from './utils/theme'
import { initStatusBar } from './services/native/initStatusBar'
import { initPlatformClass } from './services/native/initPlatformClass'

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

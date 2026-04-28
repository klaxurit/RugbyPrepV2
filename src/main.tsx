import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { initPostHog } from './services/analytics/posthog'
import { initThemeFromStorage } from './utils/theme'
import { initStatusBar } from './services/native/initStatusBar'
import { initPlatformClass } from './services/native/initPlatformClass'

initThemeFromStorage()
initPlatformClass()
initPostHog()
void initStatusBar()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
